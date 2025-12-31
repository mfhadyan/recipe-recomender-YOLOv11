import json
import logging
import os
import time
import hashlib
from typing import Any, Dict, List, Optional

import requests

logger = logging.getLogger(__name__)

# Rate limiting: track last API call time to prevent rapid successive calls
_last_api_call_time = 0.0
_min_time_between_calls = 1.0  # Minimum 1 second between API calls

# Recipe cache to reduce API calls for same ingredient combinations
_recipe_cache: Dict[str, tuple] = {}  # key: md5 hash, value: (recipes, timestamp)
_cache_ttl = 3600  # Cache for 1 hour
_max_cache_size = 100  # Maximum cache entries

GEMINI_API_KEY_ENV = "GEMINI_API_KEY"
GEMINI_API_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-2.5-flash:generateContent"
)


class GeminiClient:
    """
    Optimized wrapper around the Gemini REST API to generate recipes from ingredients.
    
    Key improvements:
    - Stable MD5-based ID generation (consistent across restarts)
    - Better cache key generation using MD5 hashing
    - Improved JSON parsing with markdown cleanup
    - LRU-style cache eviction
    - Enhanced error handling
    """

    def __init__(self, api_key: Optional[str] = None) -> None:
        self.api_key = api_key or os.environ.get(GEMINI_API_KEY_ENV)
        if not self.api_key:
            raise RuntimeError(
                f"Gemini API key not set. Please export {GEMINI_API_KEY_ENV} environment variable."
            )

    def _call_gemini(self, prompt: str) -> str:
        """
        Call Gemini API using the official REST format.
        Uses x-goog-api-key header as per: https://ai.google.dev/gemini-api/docs/quickstart
        """
        global _last_api_call_time
        
        # Rate limiting: ensure minimum time between API calls
        current_time = time.time()
        time_since_last_call = current_time - _last_api_call_time
        if _last_api_call_time > 0 and time_since_last_call < _min_time_between_calls:
            wait_time = _min_time_between_calls - time_since_last_call
            time.sleep(wait_time)
        
        call_start_time = time.time()
        _last_api_call_time = call_start_time
        
        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": prompt,
                        }
                    ]
                }
            ]
        }
        headers = {
            "x-goog-api-key": self.api_key,
            "Content-Type": "application/json",
        }
        
        # Retry logic for 429 errors with exponential backoff
        max_retries = 3
        base_wait_time = 2.0
        
        for attempt in range(max_retries + 1):
            try:
                resp = requests.post(
                    GEMINI_API_URL, json=payload, headers=headers, timeout=90
                )
                
                # Handle 429 rate limit errors with retry
                if resp.status_code == 429:
                    if attempt < max_retries:
                        wait_time = base_wait_time * (2 ** attempt)
                        logger.warning(f"Rate limited, retrying in {wait_time}s (attempt {attempt + 1}/{max_retries + 1})")
                        time.sleep(wait_time)
                        _last_api_call_time = time.time()
                        continue
                    else:
                        resp.raise_for_status()
                
                resp.raise_for_status()
                data = resp.json()
                break
                
            except requests.exceptions.Timeout as e:
                if attempt < max_retries:
                    wait_time = base_wait_time * (2 ** attempt)
                    logger.warning(f"Request timed out, retrying in {wait_time}s (attempt {attempt + 1}/{max_retries + 1})")
                    time.sleep(wait_time)
                    _last_api_call_time = time.time()
                    continue
                else:
                    raise RuntimeError(
                        "Request to Gemini API timed out after multiple attempts. "
                        "Please try again with fewer ingredients or try again later."
                    ) from e
            except requests.exceptions.HTTPError as e:
                if hasattr(e, 'response') and e.response is not None and e.response.status_code == 429:
                    if attempt < max_retries:
                        wait_time = base_wait_time * (2 ** attempt)
                        time.sleep(wait_time)
                        _last_api_call_time = time.time()
                        continue
                raise RuntimeError(f"Failed to call Gemini API: {e}") from e
            except requests.exceptions.RequestException as e:
                raise RuntimeError(f"Failed to call Gemini API: {e}") from e
        
        # Extract first text part
        candidates = data.get("candidates") or []
        if not candidates:
            raise RuntimeError("No candidates returned from Gemini API.")
        content = candidates[0].get("content") or {}
        parts = content.get("parts") or []
        if not parts:
            raise RuntimeError("No content parts returned from Gemini API.")
        text = parts[0].get("text") or ""
        if not text:
            raise RuntimeError("Empty text returned from Gemini API.")
        return text

    def generate_recipes(
        self, 
        ingredients: List[str], 
        dietary_preferences: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Ask Gemini to propose recipes given a list of ingredients.

        Improvements:
        - Uses MD5 hash for stable cache keys
        - Better JSON parsing with markdown cleanup
        - Stable MD5-based recipe IDs (consistent across restarts)
        - LRU cache eviction strategy

        Returns:
            List of recipe dictionaries with stable IDs and consistent structure
        """
        if not ingredients:
            return []
        
        # IMPROVEMENT: Use MD5 hash for stable cache keys
        clean_ingredients = sorted([ing.lower().strip() for ing in ingredients])
        clean_dietary = sorted([dp.lower().strip() for dp in dietary_preferences]) if dietary_preferences else []
        
        cache_key_string = ",".join(clean_ingredients + clean_dietary)
        cache_key = hashlib.md5(cache_key_string.encode()).hexdigest()
        
        current_time = time.time()
        if cache_key in _recipe_cache:
            cached_recipes, cache_time = _recipe_cache[cache_key]
            if current_time - cache_time < _cache_ttl:
                logger.info(f"Cache hit for key: {cache_key[:8]}...")
                return cached_recipes
            else:
                # Cache expired, remove it
                del _recipe_cache[cache_key]

        ingredients_str = ", ".join(ingredients)
        dietary_constraint = ""
        if dietary_preferences:
            dietary_str = ", ".join(dietary_preferences)
            dietary_constraint = f"\n- Must be {dietary_str}."
        
        prompt = f"""
You are a cooking assistant. The user has the following ingredients available:
{ingredients_str}

Generate up to 5 recipe ideas that:
- Use at least 60–70% of the listed ingredients.
- Have at most 5 missing ingredients beyond what the user has.
- Are realistic and cookable.{dietary_constraint}

Return your answer as strict JSON with this structure (and nothing else, no prose):
{{
  "recipes": [
    {{
      "title": "string",
      "description": "short description of the dish",
      "prepTime": 15,
      "cookTime": 30,
      "totalTime": 45,
      "servings": 4,
      "difficulty": "Medium",
      "usedIngredients": [
        {{"name": "ingredient name", "quantity": "2 cups"}},
        {{"name": "another ingredient", "quantity": "1 tsp"}}
      ],
      "missingIngredients": [
        {{"name": "ingredient name", "quantity": "1 cup"}},
        {{"name": "another ingredient", "quantity": "2 tbsp"}}
      ],
      "coverageScore": 0.0,
      "steps": ["step 1", "step 2", "..."]
    }}
  ]
}}

Important:
- usedIngredients and missingIngredients must be arrays of objects with "name" and "quantity" fields
- Quantities should be in common cooking units (cups, tbsp, tsp, oz, lb, etc.)
- prepTime, cookTime, and totalTime are in minutes
- servings is a number
- difficulty must be exactly "Easy", "Medium", or "Hard"
- Make sure usedIngredients and missingIngredients are consistent with the given list and the rules above.
"""

        text = self._call_gemini(prompt)

        # IMPROVEMENT: Better JSON parsing with markdown cleanup
        try:
            # Clean markdown syntax that Gemini often adds
            cleaned_text = text.replace("```json", "").replace("```", "").strip()
            data = json.loads(cleaned_text)
        except json.JSONDecodeError:
            # Fallback: try to extract JSON from response
            start = text.find("{")
            end = text.rfind("}")
            if start != -1 and end != -1 and end > start:
                try:
                    data = json.loads(text[start : end + 1])
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse JSON even after extraction: {e}")
                    raise RuntimeError("Failed to parse JSON response from Gemini API.")
            else:
                raise RuntimeError("Failed to parse JSON response from Gemini API.")

        recipes = data.get("recipes") or []
        normalized: List[Dict[str, Any]] = []
        
        for r in recipes:
            title = r.get("title") or "Untitled recipe"
            description = r.get("description") or ""
            
            # Handle ingredients - support both old format (array of strings) and new format (array of objects)
            used_raw = r.get("usedIngredients") or []
            missing_raw = r.get("missingIngredients") or []
            
            # Normalize ingredients to object format
            used = []
            for u in used_raw:
                if isinstance(u, dict):
                    used.append({"name": u.get("name", ""), "quantity": u.get("quantity", "")})
                else:
                    used.append({"name": str(u), "quantity": ""})
            
            missing = []
            for m in missing_raw:
                if isinstance(m, dict):
                    missing.append({"name": m.get("name", ""), "quantity": m.get("quantity", "")})
                else:
                    missing.append({"name": str(m), "quantity": ""})
            
            # Extract metadata with defaults
            prep_time = r.get("prepTime")
            cook_time = r.get("cookTime")
            total_time = r.get("totalTime")
            servings = r.get("servings")
            difficulty = r.get("difficulty", "Medium")
            
            # Validate and normalize metadata
            try:
                prep_time = int(prep_time) if prep_time is not None else None
            except (TypeError, ValueError):
                prep_time = None
            
            try:
                cook_time = int(cook_time) if cook_time is not None else None
            except (TypeError, ValueError):
                cook_time = None
            
            # Calculate total time if not provided
            if total_time is None and prep_time is not None and cook_time is not None:
                total_time = prep_time + cook_time
            try:
                total_time = int(total_time) if total_time is not None else None
            except (TypeError, ValueError):
                total_time = None
            
            try:
                servings = int(servings) if servings is not None else None
            except (TypeError, ValueError):
                servings = None
            
            # Validate difficulty
            if difficulty not in ["Easy", "Medium", "Hard"]:
                difficulty = "Medium"
            
            coverage = r.get("coverageScore")
            try:
                coverage_val = float(coverage)
            except (TypeError, ValueError):
                # Recompute coverage if not provided/invalid
                used_names = {u.get("name", "").lower() if isinstance(u, dict) else str(u).lower() for u in used_raw}
                total = len(ingredients) or 1
                hits = sum(1 for ing in ingredients if ing.lower() in used_names)
                coverage_val = hits / total

            # IMPROVEMENT: Stable MD5-based ID generation (consistent across restarts)
            # Python's hash() changes every restart, MD5 is stable
            id_source = f"{title}-{description}".encode('utf-8')
            stable_id = hashlib.md5(id_source).hexdigest()

            normalized.append(
                {
                    "id": stable_id,  # Stable string ID
                    "title": title,
                    "description": description,
                    "prepTime": prep_time,
                    "cookTime": cook_time,
                    "totalTime": total_time,
                    "servings": servings,
                    "difficulty": difficulty,
                    "usedIngredients": used,
                    "missedIngredients": missing,
                    "usedIngredientCount": len(used),
                    "missedIngredientCount": len(missing),
                    "coverageScore": coverage_val,
                    "steps": r.get("steps") or [],
                }
            )

        # IMPROVEMENT: LRU-style cache eviction
        # Cache the results
        _recipe_cache[cache_key] = (normalized, current_time)
        
        # Limit cache size with smarter eviction
        if len(_recipe_cache) > _max_cache_size:
            # Remove oldest entry by timestamp
            oldest_key = min(_recipe_cache.keys(), key=lambda k: _recipe_cache[k][1])
            del _recipe_cache[oldest_key]
            logger.info(f"Cache evicted oldest entry, size: {len(_recipe_cache)}")
        
        return normalized