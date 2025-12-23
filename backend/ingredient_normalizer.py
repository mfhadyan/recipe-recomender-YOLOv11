"""
Ingredient normalization service using Gemini AI for automatic mapping.
Falls back to dictionary lookup for performance, then uses AI for unknown ingredients.
"""
import json
import logging
import os
import time
from typing import Dict, List, Optional

from .gemini_client import GeminiClient

logger = logging.getLogger(__name__)

# Fast dictionary lookup for common ingredients (performance optimization)
# This is used as a first-pass before calling AI
COMMON_INGREDIENT_MAPPING: Dict[str, str] = {
    # Chili variations
    "chili": "chili pepper",
    "chili_pepper": "chili pepper",
    "red_chili": "chili pepper",
    "chili pepper": "chili pepper",
    "pepper": "pepper",
    "bell_pepper": "bell pepper",
    "red_pepper": "red pepper",
    "green_pepper": "green pepper",
    
    # Onion variations
    "spring_onion": "green onion",
    "green_onion": "green onion",
    "scallion": "green onion",
    "onion": "onion",
    "red_onion": "red onion",
    "yellow_onion": "onion",
    "white_onion": "onion",
    
    # Garlic
    "garlic": "garlic",
    
    # Other common ingredients
    "tempeh": "tempeh",
    "tofu": "tofu",
    "tomato": "tomato",
    "tomatoes": "tomato",
    "carrot": "carrot",
    "carrots": "carrot",
    "potato": "potato",
    "potatoes": "potato",
    "cucumber": "cucumber",
    "cucumbers": "cucumber",
    "lettuce": "lettuce",
    "spinach": "spinach",
    "broccoli": "broccoli",
    "cabbage": "cabbage",
    "mushroom": "mushroom",
    "mushrooms": "mushroom",
    "egg": "egg",
    "eggs": "egg",
    "chicken": "chicken",
    "beef": "beef",
    "pork": "pork",
    "fish": "fish",
    "rice": "rice",
    "noodle": "noodles",
    "noodles": "noodles",
}

# Cache for AI-normalized ingredients (reduces API calls)
_ai_cache: Dict[str, str] = {}


def normalize_ingredient(raw_name: str, use_ai: Optional[bool] = None) -> str:
    """
    Normalize a single ingredient name.
    
    Strategy:
    1. Try dictionary lookup (fast, common ingredients)
    2. Try AI normalization (handles any ingredient)
    3. Fallback to cleaned raw name
    
    Args:
        raw_name: Raw ingredient name from YOLO
        use_ai: Whether to use AI for normalization. If None, uses ENABLE_AI_NORMALIZATION env var (default: True)
    
    Returns:
        Normalized ingredient name
    """
    if not raw_name or not raw_name.strip():
        return ""
    
    # Check environment variable if use_ai is not explicitly set
    # Default to False to avoid rate limits - dictionary lookup handles most cases
    if use_ai is None:
        use_ai = os.environ.get("ENABLE_AI_NORMALIZATION", "false").lower() == "true"
    
    raw_lower = raw_name.lower().strip()
    
    # Step 1: Try dictionary lookup with multiple key variations
    key_variations = [
        raw_lower.replace(" ", "_"),
        raw_lower.replace("-", "_"),
        raw_lower.replace("_", " "),
        raw_lower,
    ]
    
    for key in key_variations:
        if key in COMMON_INGREDIENT_MAPPING:
            normalized = COMMON_INGREDIENT_MAPPING[key]
            logger.debug(f"Dictionary mapping: {raw_name} -> {normalized}")
            return normalized
    
    # Step 2: Check AI cache
    cache_key = raw_lower
    if cache_key in _ai_cache:
        normalized = _ai_cache[cache_key]
        logger.debug(f"AI cache hit: {raw_name} -> {normalized}")
        return normalized
    
    # Step 3: Use AI normalization if enabled
    if use_ai:
        try:
            normalized = _normalize_with_ai(raw_name)
            if normalized:
                # Cache the result
                _ai_cache[cache_key] = normalized
                logger.info(f"AI normalized: {raw_name} -> {normalized}")
                return normalized
        except Exception as e:
            logger.warning(f"AI normalization failed for '{raw_name}': {e}")
            # Fall through to fallback
    
    # Step 4: Fallback to cleaned raw name
    normalized = raw_lower
    logger.info(f"Using fallback normalization: {raw_name} -> {normalized}")
    return normalized


def normalize_ingredients_batch(raw_names: List[str], use_ai: Optional[bool] = None) -> List[str]:
    """
    Normalize multiple ingredients efficiently.
    Uses batch AI processing when possible.
    
    Args:
        raw_names: List of raw ingredient names
        use_ai: Whether to use AI for normalization. If None, uses ENABLE_AI_NORMALIZATION env var (default: True)
    
    Returns:
        List of normalized ingredient names
    """
    if not raw_names:
        return []
    
    # Check environment variable if use_ai is not explicitly set
    # Default to False to avoid rate limits - dictionary lookup handles most cases
    if use_ai is None:
        use_ai = os.environ.get("ENABLE_AI_NORMALIZATION", "false").lower() == "true"
    
    # #region agent log
    log_path = "/Users/mfahmi/Documents/UAI/semester 5/AI/Tugas Proyek/panic/my-app/.cursor/debug.log"
    try:
        with open(log_path, "a") as f:
            f.write(json.dumps({
                "sessionId": "debug-session",
                "runId": "run1",
                "hypothesisId": "A,C",
                "location": "ingredient_normalizer.py:normalize_ingredients_batch",
                "message": "Batch normalization START",
                "data": {
                    "raw_count": len(raw_names),
                    "raw_ingredients": raw_names,
                    "use_ai": use_ai,
                    "cache_size": len(_ai_cache),
                    "timestamp": int(time.time() * 1000)
                },
                "timestamp": int(time.time() * 1000)
            }) + "\n")
    except: pass
    # #endregion
    
    # First pass: dictionary lookup
    normalized_dict: Dict[str, str] = {}
    needs_ai: List[str] = []
    dict_hits = 0
    cache_hits = 0
    
    for raw in raw_names:
        if not raw or not raw.strip():
            continue
        
        raw_lower = raw.lower().strip()
        key_variations = [
            raw_lower.replace(" ", "_"),
            raw_lower.replace("-", "_"),
            raw_lower.replace("_", " "),
            raw_lower,
        ]
        
        found = False
        for key in key_variations:
            if key in COMMON_INGREDIENT_MAPPING:
                normalized_dict[raw] = COMMON_INGREDIENT_MAPPING[key]
                found = True
                dict_hits += 1
                break
        
        if not found:
            # Check cache
            cache_key = raw_lower
            if cache_key in _ai_cache:
                normalized_dict[raw] = _ai_cache[cache_key]
                cache_hits += 1
            else:
                needs_ai.append(raw)
    
    # #region agent log
    try:
        with open(log_path, "a") as f:
            f.write(json.dumps({
                "sessionId": "debug-session",
                "runId": "run1",
                "hypothesisId": "A,C",
                "location": "ingredient_normalizer.py:normalize_ingredients_batch",
                "message": "Dictionary lookup complete",
                "data": {
                    "dict_hits": dict_hits,
                    "cache_hits": cache_hits,
                    "needs_ai_count": len(needs_ai),
                    "needs_ai": needs_ai,
                    "timestamp": int(time.time() * 1000)
                },
                "timestamp": int(time.time() * 1000)
            }) + "\n")
    except: pass
    # #endregion
    
    # Second pass: AI normalization for unknown ingredients
    if needs_ai and use_ai:
        # #region agent log
        try:
            with open(log_path, "a") as f:
                f.write(json.dumps({
                    "sessionId": "debug-session",
                    "runId": "run1",
                    "hypothesisId": "A,B",
                    "location": "ingredient_normalizer.py:normalize_ingredients_batch",
                    "message": "Calling AI batch normalization",
                    "data": {
                        "ingredient_count": len(needs_ai),
                        "ingredients": needs_ai,
                        "timestamp": int(time.time() * 1000)
                    },
                    "timestamp": int(time.time() * 1000)
                }) + "\n")
        except: pass
        # #endregion
        try:
            ai_normalized = _normalize_batch_with_ai(needs_ai)
            # #region agent log
            try:
                with open(log_path, "a") as f:
                    f.write(json.dumps({
                        "sessionId": "debug-session",
                        "runId": "run1",
                        "hypothesisId": "A",
                        "location": "ingredient_normalizer.py:normalize_ingredients_batch",
                        "message": "AI batch normalization SUCCESS",
                        "data": {
                            "normalized_count": len(ai_normalized),
                            "normalized": ai_normalized,
                            "timestamp": int(time.time() * 1000)
                        },
                        "timestamp": int(time.time() * 1000)
                    }) + "\n")
            except: pass
            # #endregion
            for raw, normalized in zip(needs_ai, ai_normalized):
                if normalized:
                    normalized_dict[raw] = normalized
                    # Cache the result
                    _ai_cache[raw.lower().strip()] = normalized
        except Exception as e:
            # #region agent log
            try:
                with open(log_path, "a") as f:
                    f.write(json.dumps({
                        "sessionId": "debug-session",
                        "runId": "run1",
                        "hypothesisId": "A,B,D",
                        "location": "ingredient_normalizer.py:normalize_ingredients_batch",
                        "message": "AI batch normalization FAILED",
                        "data": {
                            "error": str(e),
                            "error_type": type(e).__name__,
                            "timestamp": int(time.time() * 1000)
                        },
                        "timestamp": int(time.time() * 1000)
                    }) + "\n")
            except: pass
            # #endregion
            logger.warning(f"Batch AI normalization failed: {e}")
            # Fall through to individual fallback
    
    # Build final list preserving order
    result: List[str] = []
    seen = set()
    for raw in raw_names:
        if not raw or not raw.strip():
            continue
        
        normalized = normalized_dict.get(raw)
        if not normalized:
            # Fallback to cleaned raw name
            normalized = raw.lower().strip()
        
        # Deduplicate
        normalized_lower = normalized.lower()
        if normalized_lower not in seen:
            seen.add(normalized_lower)
            result.append(normalized)
    
    # #region agent log
    try:
        with open(log_path, "a") as f:
            f.write(json.dumps({
                "sessionId": "debug-session",
                "runId": "run1",
                "hypothesisId": "A,C",
                "location": "ingredient_normalizer.py:normalize_ingredients_batch",
                "message": "Batch normalization COMPLETE",
                "data": {
                    "final_count": len(result),
                    "final_normalized": result,
                    "dict_hits": dict_hits,
                    "cache_hits": cache_hits,
                    "ai_calls_made": 1 if (needs_ai and use_ai) else 0,
                    "timestamp": int(time.time() * 1000)
                },
                "timestamp": int(time.time() * 1000)
            }) + "\n")
    except: pass
    # #endregion
    
    return result


def _normalize_with_ai(raw_name: str) -> str:
    """
    Use Gemini AI to normalize a single ingredient name.
    
    Args:
        raw_name: Raw ingredient name
    
    Returns:
        Normalized ingredient name
    """
    try:
        client = GeminiClient()
        prompt = f"""Normalize this cooking ingredient name to a standard, common name.
Return ONLY the normalized ingredient name, nothing else. No explanations, no quotes, just the name.

Examples:
- "chili_pepper" -> "chili pepper"
- "red_chili" -> "chili pepper"
- "spring_onion" -> "green onion"
- "scallion" -> "green onion"
- "tomatoes" -> "tomato"
- "eggs" -> "egg"

Ingredient to normalize: "{raw_name}"
Normalized name:"""
        
        response = client._call_gemini(prompt)
        normalized = response.strip().strip('"').strip("'").strip()
        
        # Validate: if response looks wrong, use fallback
        if len(normalized) > 50 or not normalized:
            logger.warning(f"AI returned invalid normalization for '{raw_name}': '{normalized}'")
            return raw_name.lower().strip()
        
        return normalized.lower().strip()
    except Exception as e:
        logger.error(f"Error normalizing '{raw_name}' with AI: {e}")
        raise


def _normalize_batch_with_ai(raw_names: List[str]) -> List[str]:
    """
    Use Gemini AI to normalize multiple ingredient names in one call.
    
    Args:
        raw_names: List of raw ingredient names
    
    Returns:
        List of normalized ingredient names
    """
    try:
        client = GeminiClient()
        ingredients_str = ", ".join([f'"{name}"' for name in raw_names])
        
        prompt = f"""Normalize these cooking ingredient names to standard, common names.
Return ONLY a JSON array of normalized names in the same order, nothing else.

Examples:
- "chili_pepper" -> "chili pepper"
- "red_chili" -> "chili pepper"
- "spring_onion" -> "green onion"
- "scallion" -> "green onion"
- "tomatoes" -> "tomato"
- "eggs" -> "egg"

Ingredients to normalize: [{ingredients_str}]

Return format: ["normalized1", "normalized2", ...]"""
        
        response = client._call_gemini(prompt)
        
        # Try to parse JSON array
        try:
            # Try direct JSON parse
            normalized_list = json.loads(response)
            if isinstance(normalized_list, list) and len(normalized_list) == len(raw_names):
                return [str(n).lower().strip() for n in normalized_list]
        except json.JSONDecodeError:
            # Try to extract JSON array from text
            start = response.find("[")
            end = response.rfind("]")
            if start != -1 and end != -1 and end > start:
                normalized_list = json.loads(response[start : end + 1])
                if isinstance(normalized_list, list) and len(normalized_list) == len(raw_names):
                    return [str(n).lower().strip() for n in normalized_list]
        
        # Fallback: parse individual names
        logger.warning("Failed to parse batch AI response as JSON, falling back to individual normalization")
        return [raw_name.lower().strip() for raw_name in raw_names]
    except Exception as e:
        logger.error(f"Error batch normalizing with AI: {e}")
        raise


def clear_cache():
    """Clear the AI normalization cache."""
    global _ai_cache
    _ai_cache.clear()
    logger.info("AI normalization cache cleared")


def get_cache_stats() -> Dict[str, int]:
    """Get statistics about the normalization cache."""
    return {
        "cached_items": len(_ai_cache),
        "dictionary_items": len(COMMON_INGREDIENT_MAPPING),
    }

