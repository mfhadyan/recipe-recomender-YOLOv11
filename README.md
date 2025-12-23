This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## CRITICAL FIXES

### 1. Fix `backend/gemini_client.py` - Remove Hardcoded API Key

```python:backend/gemini_client.py
import json
import os
from typing import Any, Dict, List, Optional

import requests

GEMINI_API_KEY_ENV = "GEMINI_API_KEY"
# Using gemini-2.5-flash as per official docs: https://ai.google.dev/gemini-api/docs/quickstart
GEMINI_API_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-2.5-flash:generateContent"
)


class GeminiClient:
    """
    Thin wrapper around the Gemini REST API to generate recipes from ingredients.
    Uses the official API format with x-goog-api-key header.
    Reference: https://ai.google.dev/gemini-api/docs/quickstart
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
        try:
            resp = requests.post(
                GEMINI_API_URL, json=payload, headers=headers, timeout=30
            )
            resp.raise_for_status()
            data = resp.json()
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

    def generate_recipes(self, ingredients: List[str]) -> List[Dict[str, Any]]:
        """
        Ask Gemini to propose recipes given a list of ingredients.

        We instruct it to:
        - Use at least 60–70% of provided ingredients.
        - Have at most 5 missing ingredients.
        - Return exactly 5 recipes when possible.
        - Respond as strict JSON with a 'recipes' array.
        """
        if not ingredients:
            return []

        ingredients_str = ", ".join(ingredients)
        prompt = f"""
You are a cooking assistant. The user has the following ingredients available:
{ingredients_str}

Generate up to 5 recipe ideas that:
- Use at least 60–70% of the listed ingredients.
- Have at most 5 missing ingredients beyond what the user has.
- Are realistic and cookable.

Return your answer as strict JSON with this structure (and nothing else, no prose):
{{
  "recipes": [
    {{
      "title": "string",
      "description": "short description of the dish",
      "usedIngredients": ["ingredient name", "..."],
      "missingIngredients": ["ingredient name", "..."],
      "coverageScore": 0.0,  // fraction of user ingredients used, between 0 and 1
      "steps": ["step 1", "step 2", "..."]
    }}
  ]
}}

Make sure usedIngredients and missingIngredients are consistent with the given list and the rules above.
"""

        text = self._call_gemini(prompt)

        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            # Try to recover if the model added prose around JSON
            start = text.find("{")
            end = text.rfind("}")
            if start != -1 and end != -1 and end > start:
                data = json.loads(text[start : end + 1])
            else:
                raise RuntimeError("Failed to parse JSON response from Gemini API.")

        recipes = data.get("recipes") or []
        # Basic normalization of fields
        normalized: List[Dict[str, Any]] = []
        for r in recipes:
            title = r.get("title") or "Untitled recipe"
            description = r.get("description") or ""
            used = r.get("usedIngredients") or []
            missing = r.get("missingIngredients") or []
            coverage = r.get("coverageScore")
            try:
                coverage_val = float(coverage)
            except (TypeError, ValueError):
                # Recompute a simple coverage if not provided / invalid
                used_set = {u.lower() for u in used}
                total = len(ingredients) or 1
                hits = sum(1 for ing in ingredients if ing.lower() in used_set)
                coverage_val = hits / total

            # Use a more reliable ID generation
            import hashlib
            id_str = f"{title}{description}"
            recipe_id = int(hashlib.md5(id_str.encode()).hexdigest()[:8], 16)

            normalized.append(
                {
                    "id": recipe_id,
                    "title": title,
                    "description": description,
                    "usedIngredients": [{"name": u} for u in used],
                    "missedIngredients": [{"name": m} for m in missing],
                    "usedIngredientCount": len(used),
                    "missedIngredientCount": len(missing),
                    "coverageScore": coverage_val,
                    "steps": r.get("steps") or [],
                }
            )

        return normalized
```

### 2. Fix `backend/main.py` - Improve CORS and Error Handling

```python:backend/main.py
import io
import os
from typing import List, Optional

from fastapi import FastAPI, File, HTTPException, UploadFile  # type: ignore[import]
from fastapi.middleware.cors import CORSMiddleware  # type: ignore[import]
from fastapi.responses import JSONResponse  # type: ignore[import]
from PIL import Image
from PIL import UnidentifiedImageError

from .gemini_client import GeminiClient
from .model import detect_ingredients

app = FastAPI(title="Recipe Recommender API")

# CORS configuration - use environment variable for production
allowed_origins = os.environ.get("ALLOWED_ORIGINS", "*").split(",")
if allowed_origins == ["*"]:
    # Development mode - allow all origins
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    # Production mode - specific origins only
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
    )


@app.get("/")
def root() -> dict:
    return {"message": "Recipe Recommender API", "endpoints": ["/health", "/ingredients/autocomplete", "/recommend"]}


@app.get("/health")
def health_check() -> dict:
    return {"status": "ok"}


@app.get("/ingredients/autocomplete")
def ingredient_autocomplete(query: str, limit: int = 5) -> dict:
    """
    Simple autocomplete stub.

    Previously this proxied Spoonacular; now we just echo back the query in a
    structure compatible with the existing frontend.
    """
    q = (query or "").strip()
    if not q:
        return {"suggestions": []}
    # You could make this smarter (e.g. using Gemini) if desired.
    return {"suggestions": [{"name": q.lower()}]}


@app.post("/recommend")
async def recommend_recipes(
    file: UploadFile = File(...),
    extra_ingredients: Optional[str] = None,
) -> JSONResponse:
    """
    Main endpoint:
    - Accepts an image file and optional comma-separated extra ingredients.
    - Detects ingredients via YOLO.
    - Merges + deduplicates all ingredients.
    - Queries Gemini to generate recipe ideas.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    # Process image fully in-memory
    try:
        contents = await file.read()
        img = Image.open(io.BytesIO(contents)).convert("RGB")
    except UnidentifiedImageError as exc:
        raise HTTPException(status_code=400, detail="Unable to read image file. Invalid image format.") from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"Unable to process image file: {str(exc)}") from exc

    # 1) YOLO ingredient detection
    try:
        detected_ingredients: List[str] = detect_ingredients(img)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=500,
            detail=f"Error during ingredient detection: {str(exc)}"
        ) from exc

    # 2) Parse & normalize user-typed ingredients (already canonicalized on frontend)
    user_ingredients: List[str] = []
    if extra_ingredients:
        for token in extra_ingredients.split(","):
            name = token.strip()
            if name:
                user_ingredients.append(name)

    # If nothing at all, ask user to add something
    if not detected_ingredients and not user_ingredients:
        return JSONResponse(
            status_code=200,
            content={
                "ingredients": [],
                "recipes": [],
                "message": "No ingredients detected. Please add ingredients manually.",
            },
        )

    # 3) Merge + deduplicate
    merged: List[str] = []
    seen = set()
    for source_list in (detected_ingredients, user_ingredients):
        for ing in source_list:
            key = ing.lower()
            if key not in seen:
                seen.add(key)
                merged.append(ing)

    # 4) Query Gemini to generate recipe ideas based on ingredients
    try:
        client = GeminiClient()
        raw_recipes = client.generate_recipes(merged)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Gemini API error: {exc}",
        ) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error while generating recipes: {str(exc)}",
        ) from exc

    if not raw_recipes:
        return JSONResponse(
            status_code=200,
            content={
                "ingredients": merged,
                "recipes": [],
                "message": "No recipes found for these ingredients.",
            },
        )
    
    # Gemini client already returns normalized recipes, with coverageScore etc.
    top5 = raw_recipes[:5]

    return JSONResponse(
        status_code=200,
        content={
            "ingredients": merged,
            "recipes": top5,
            "fallback": False,
        },
    )
```

### 3. Remove or Comment Out `backend/spoonacular.py` (Unused)

Since `spoonacular.py` is not imported anywhere, you can either delete it or comment it out. If you might use it later, rename it to `spoonacular.py.backup` or add a comment at the top:

```python:backend/spoonacular.py
# UNUSED - This file is not currently imported anywhere
# Keeping for potential future use
# TODO: Remove if not needed

# ... rest of file stays commented or delete the file entirely
```

Or simply delete the file if you're sure you won't need it.

### 4. Update `backend/requirements.txt` - Add python-dotenv

```txt:backend/requirements.txt
fastapi
uvicorn[standard]==0.32.0
python-multipart==0.0.9
Pillow==11.0.0
ultralytics
requests
python-dotenv
```

### 5. Create `backend/.env.example` File

Create a new file `backend/.env.example`:

```env:backend/.env.example
# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# CORS Configuration (comma-separated list of allowed origins)
# For development, leave as * or use: http://localhost:3000
# For production, specify exact origins: https://yourdomain.com,https://www.yourdomain.com
ALLOWED_ORIGINS=*

# Optional: Model file path (defaults to yolo11s.pt in current directory)
# MODEL_PATH=yolo11s.pt
```

### 6. Update `.gitignore` - Add Python-specific ignores

```gitignore:.gitignore
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.*
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/versions

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# env files (can opt-in for committing if needed)
.env*
!.env.example

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
backend/venv/
backend/env/
backend/.venv/
*.egg-info/
dist/
build/

# Model files (optional - uncomment if you don't want to track model files)
# *.pt
# *.pth
```

### 7. Fix `backend/model.py` - Make Model Path Configurable

```python:backend/model.py
import os
from functools import lru_cache
from typing import List

from PIL import Image
from ultralytics import YOLO


# Mapping from YOLO class names to Spoonacular ingredient names
YOLO_TO_SPOONACULAR = {
    "chili": "chili pepper",
    "chili_pepper": "chili pepper",
    "red_chili": "chili pepper",
    "spring_onion": "green onion",
    "green_onion": "green onion",
    "scallion": "green onion",
    "tempeh": "tempeh",
    "garlic": "garlic",
}


@lru_cache(maxsize=1)
def get_model() -> YOLO:
    """
    Lazily load the YOLOv11s model.

    Expect the weights file (e.g. 'yolo11s.pt') to be available locally.
    You can also swap this for a different checkpoint if needed.
    """
    model_path = os.environ.get("MODEL_PATH", "yolo11s.pt")
    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"Model file not found at {model_path}. "
            f"Please set MODEL_PATH environment variable or place yolo11s.pt in the backend directory."
        )
    return YOLO(model_path)


def resize_image_for_inference(img: Image.Image, max_size: int = 640) -> Image.Image:
    """Resize image preserving aspect ratio so the longest side == max_size."""
    w, h = img.size
    scale = min(max_size / float(w), max_size / float(h), 1.0)
    if scale == 1.0:
        return img
    new_w, new_h = int(w * scale), int(h * scale)
    return img.resize((new_w, new_h))


def detect_ingredients(img: Image.Image) -> List[str]:
    """
    Run YOLO on the given PIL image and return a list of normalized ingredient names
    (already mapped to Spoonacular-friendly terms).
    """
    try:
        model = get_model()
        resized = resize_image_for_inference(img)

        results = model(resized, verbose=False)[0]
        names = results.names

        raw_classes: List[str] = []
        for box in results.boxes:
            cls_idx = int(box.cls.item())
            raw_name = names.get(cls_idx, "").strip()
            if not raw_name:
                continue
            raw_classes.append(raw_name)

        normalized: List[str] = []
        for raw in raw_classes:
            key = raw.lower().replace(" ", "_")
            mapped = YOLO_TO_SPOONACULAR.get(key)
            if mapped:
                normalized.append(mapped)

        # Deduplicate while preserving order
        seen = set()
        unique_normalized: List[str] = []
        for ing in normalized:
            if ing not in seen:
                seen.add(ing)
                unique_normalized.append(ing)

        return unique_normalized
    except FileNotFoundError as e:
        raise RuntimeError(f"Model file error: {e}") from e
    except Exception as e:
        raise RuntimeError(f"Error during YOLO inference: {e}") from e
```

## HIGH PRIORITY FIXES

### 8. Split Large React Component - Create Component Files

Create `app/components/ImageUploader.js`:

```javascript:app/components/ImageUploader.js
"use client";

import { useState, useEffect } from "react";

export default function ImageUploader({ file, onFileChange, error }) {
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
      onFileChange(f);
    } else {
      setPreviewUrl(null);
      onFileChange(null);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-200">
        Ingredient photo
      </label>
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <label
          className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-600 bg-slate-900/60 px-4 py-3 text-sm font-medium text-slate-200 shadow-inner hover:border-sky-500 hover:bg-slate-900"
          aria-label="Choose ingredient image"
        >
          <span>Choose image</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            aria-describedby="image-upload-help"
          />
        </label>
        {file ? (
          <p className="text-xs text-slate-300">
            Selected:{" "}
            <span className="font-medium text-slate-100">{file.name}</span>
          </p>
        ) : (
          <p id="image-upload-help" className="text-xs text-slate-400">
            PNG, JPG up to a few MB. Processed only in-memory.
          </p>
        )}
      </div>
      {previewUrl && (
        <div className="mt-3 overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900/70">
          <img
            src={previewUrl}
            alt="Ingredient preview"
            className="max-h-64 w-full object-cover"
          />
        </div>
      )}
      {error && (
        <p className="rounded-lg border border-red-500/70 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {error}
        </p>
      )}
    </div>
  );
}
```

Create `app/components/IngredientInput.js`:

```javascript:app/components/IngredientInput.js
"use client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function IngredientInput({
  ingredientInput,
  setIngredientInput,
  extraIngredients,
  setExtraIngredients,
  setError,
  setMessage,
}) {
  const handleAddIngredient = async () => {
    const raw = ingredientInput.trim();
    if (!raw) return;

    try {
      // Call backend autocomplete to get canonical ingredient name
      const res = await fetch(
        `${API_BASE_URL}/ingredients/autocomplete?query=${encodeURIComponent(
          raw
        )}`
      );
      let canonical = raw;
      if (res.ok) {
        try {
          const data = await res.json();
          const suggestions = data?.suggestions || data;
          if (Array.isArray(suggestions) && suggestions.length > 0) {
            canonical = suggestions[0].name || raw;
          }
        } catch (err) {
          console.warn("Failed to parse autocomplete response:", err);
          // Fallback to raw input
        }
      } else {
        console.warn(`Autocomplete failed: ${res.status} ${res.statusText}`);
        // Fallback to raw input
      }

      setExtraIngredients((prev) => {
        const exists = prev.some(
          (ing) => ing.toLowerCase() === canonical.toLowerCase()
        );
        if (exists) {
          setError("Ingredient already added.");
          return prev;
        }
        return [...prev, canonical];
      });
      setIngredientInput("");
      setError("");
      setMessage("");
    } catch (err) {
      console.error("Error adding ingredient:", err);
      setError("Failed to add ingredient. Please try again.");
      // Fallback: just add raw text
      setExtraIngredients((prev) => {
        const exists = prev.some(
          (ing) => ing.toLowerCase() === raw.toLowerCase()
        );
        if (exists) return prev;
        return [...prev, raw];
      });
      setIngredientInput("");
    }
  };

  const handleRemoveIngredient = (name) => {
    setExtraIngredients((prev) =>
      prev.filter((ing) => ing.toLowerCase() !== name.toLowerCase())
    );
    setError("");
    setMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddIngredient();
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-slate-200">
        Add ingredients manually
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          placeholder="e.g. ginger, onion"
          value={ingredientInput}
          onChange={(e) => setIngredientInput(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 outline-none ring-sky-500/0 placeholder:text-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
          aria-label="Ingredient name input"
        />
        <button
          type="button"
          onClick={handleAddIngredient}
          className="inline-flex items-center justify-center rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/30 transition hover:bg-sky-400 disabled:opacity-50"
          disabled={!ingredientInput.trim()}
        >
          Add ingredient
        </button>
      </div>
      {extraIngredients.length > 0 && (
        <div className="flex flex-wrap gap-2" role="list" aria-label="Added ingredients">
          {extraIngredients.map((ing) => (
            <button
              key={ing}
              type="button"
              onClick={() => handleRemoveIngredient(ing)}
              className="group inline-flex items-center gap-1 rounded-full bg-slate-800/80 px-3 py-1 text-xs text-slate-100 ring-1 ring-slate-600/70 hover:bg-red-500/90 hover:text-white hover:ring-red-400"
              aria-label={`Remove ${ing}`}
            >
              <span>{ing}</span>
              <span className="text-slate-300 group-hover:text-white">×</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

Create `app/components/RecipeCard.js`:

```javascript:app/components/RecipeCard.js
"use client";

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function RecipeCard({ recipe }) {
  const coverage =
    typeof recipe.coverageScore === "number"
      ? Math.round(recipe.coverageScore * 100)
      : null;
  const usedCount = recipe.usedIngredientCount ?? 0;
  const missedCount = recipe.missedIngredientCount ?? 0;
  const url = `https://spoonacular.com/recipes/${slugify(
    recipe.title || "recipe"
  )}-${recipe.id}`;

  return (
    <article
      className="flex gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-3 shadow-sm"
    >
      {recipe.image && (
        <img
          src={recipe.image}
          alt={recipe.title}
          className="h-20 w-20 flex-none rounded-xl object-cover"
        />
      )}
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-50">
            {recipe.title}
          </h3>
          {coverage !== null && (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-200 ring-1 ring-emerald-500/40">
              {coverage}% match
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-300">
          Uses{" "}
          <span className="font-semibold text-emerald-300">{usedCount}</span> of
          your ingredients &middot; Missing{" "}
          <span className="font-semibold text-amber-200">{missedCount}</span>
        </p>
        <div className="mt-1 flex flex-wrap gap-1">
          {Array.isArray(recipe.usedIngredients) &&
            recipe.usedIngredients.slice(0, 5).map((ing, idx) => (
              <span
                key={`used-${ing.id || ing.name}-${idx}`}
                className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-100 ring-1 ring-emerald-500/40"
              >
                {ing.name}
              </span>
            ))}
          {Array.isArray(recipe.missedIngredients) &&
            recipe.missedIngredients.slice(0, 3).map((ing, idx) => (
              <span
                key={`missed-${ing.id || ing.name}-${idx}`}
                className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] text-amber-100 ring-1 ring-amber-500/40"
              >
                + {ing.name}
              </span>
            ))}
        </div>
        {recipe.description && (
          <p className="mt-1 text-[11px] text-slate-400">{recipe.description}</p>
        )}
        <div className="mt-2">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] font-medium text-sky-300 hover:text-sky-200"
          >
            View recipe details →
          </a>
        </div>
      </div>
    </article>
  );
}
```

Create `app/components/RecipeList.js`:

```javascript:app/components/RecipeList.js
"use client";

import RecipeCard from "./RecipeCard";

export default function RecipeList({
  recipes,
  mergedIngredients,
  fallback,
  loading,
  message,
}) {
  return (
    <section className="flex-1 rounded-3xl bg-slate-950/80 p-6 shadow-2xl ring-1 ring-slate-800/60 backdrop-blur">
      <h2 className="mb-3 text-lg font-semibold text-slate-50">
        Matching recipes
      </h2>

      {mergedIngredients.length > 0 && (
        <div className="mb-4">
          <p className="mb-1 text-xs font-medium text-slate-300">
            Using ingredients:
          </p>
          <div className="flex flex-wrap gap-1.5" role="list" aria-label="Detected ingredients">
            {mergedIngredients.map((ing) => (
              <span
                key={ing}
                className="inline-flex items-center rounded-full bg-slate-800/80 px-2.5 py-0.5 text-[11px] text-slate-100 ring-1 ring-slate-600/70"
              >
                {ing}
              </span>
            ))}
          </div>
        </div>
      )}

      {fallback && recipes.length > 0 && (
        <p className="mb-3 text-[11px] text-amber-200">
          No recipes met the &ldquo;max 5 missing ingredients&rdquo; rule.
          Showing the closest matches instead.
        </p>
      )}

      {recipes.length === 0 && !loading && !message && (
        <p className="mt-8 text-sm text-slate-400">
          Upload an image and optionally add ingredients to see recipe
          suggestions here.
        </p>
      )}

      {message && (
        <p className="mt-4 rounded-lg border border-amber-500/60 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          {message}
        </p>
      )}

      {recipes.length > 0 && (
        <div className="space-y-4 overflow-y-auto pt-1" role="list" aria-label="Recipe suggestions">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </section>
  );
}
```

### 9. Update `app/page.js` - Use New Components

```javascript:app/page.js
"use client";

import { useState } from "react";
import ImageUploader from "./components/ImageUploader";
import IngredientInput from "./components/IngredientInput";
import RecipeList from "./components/RecipeList";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function Home() {
  const [file, setFile] = useState(null);
  const [ingredientInput, setIngredientInput] = useState("");
  const [extraIngredients, setExtraIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [mergedIngredients, setMergedIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fallback, setFallback] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = (f) => {
    setError("");
    setMessage("");
    setRecipes([]);
    setFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setRecipes([]);
    setFallback(false);

    if (!file && extraIngredients.length === 0) {
      setError("Please upload an image or add at least one ingredient.");
      return;
    }

    if (!file) {
      setError("Image is required for ingredient detection.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    if (extraIngredients.length > 0) {
      formData.append("extra_ingredients", extraIngredients.join(","));
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/recommend`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        let errorMsg = `HTTP ${res.status}: `;
        try {
          const errorData = await res.json();
          errorMsg += errorData?.detail || errorData?.message || res.statusText;
        } catch {
          errorMsg += res.statusText || "Unknown error";
        }
        throw new Error(errorMsg);
      }

      const data = await res.json();

      setMergedIngredients(data.ingredients || []);
      setRecipes(data.recipes || []);
      setFallback(Boolean(data.fallback));
      if (data.message) {
        setMessage(data.message);
      }
    } catch (err) {
      console.error("Error fetching recipes:", err);
      setError(err.message || "Failed to fetch recipes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-slate-50">
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-10 lg:flex-row lg:py-16">
        <section className="flex-1 rounded-3xl bg-slate-950/70 p-6 shadow-2xl ring-1 ring-slate-800/60 backdrop-blur">
          <header className="mb-6 space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              AI Recipe Recommender
            </h1>
            <p className="max-w-xl text-sm text-slate-300">
              Upload a photo of your ingredients and optionally add more by
              typing. We&apos;ll detect what&apos;s in the image and suggest
              recipes that use at least most of what you have.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-5">
            <ImageUploader file={file} onFileChange={handleFileChange} error={error} />

            <IngredientInput
              ingredientInput={ingredientInput}
              setIngredientInput={setIngredientInput}
              extraIngredients={extraIngredients}
              setExtraIngredients={setExtraIngredients}
              setError={setError}
              setMessage={setMessage}
            />

            {message && (
              <p className="rounded-lg border border-amber-500/60 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !file}
              className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Finding recipes..." : "Find recipes"}
            </button>

            <p className="text-[11px] leading-relaxed text-slate-400">
              Your image is processed only in memory and never stored on the
              server. Recipe data is generated using AI.
            </p>
          </form>
        </section>

        <RecipeList
          recipes={recipes}
          mergedIngredients={mergedIngredients}
          fallback={fallback}
          loading={loading}
          message={message}
        />
      </main>
    </div>
  );
}
```

### 10. Create `README.md` - Project-Specific Documentation

```markdown:README.md
# AI Recipe Recommender

An AI-powered recipe recommendation system that detects ingredients from images using YOLO and generates recipe suggestions using Google's Gemini API.

## Features

- 📸 Image-based ingredient detection using YOLOv11
- 🤖 AI-powered recipe generation using Gemini API
- 🎯 Smart ingredient matching and coverage scoring
- 💻 Modern Next.js frontend with Tailwind CSS
- 🚀 FastAPI backend with async support

## Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- Gemini API key ([Get one here](https://ai.google.dev/))
- YOLOv11 model file (`yolo11s.pt`)

## Setup

### Backend Setup

1. Navigate to the backend directory:
cd backend2. Create a virtual environment:
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate3. Install dependencies:
pip install -r requirements.txt4. Create a `.env` file in the `backend` directory:
cp .env.example .env5. Edit `.env` and add your API key:v
GEMINI_API_KEY=your_actual_api_key_here
ALLOWED_ORIGINS=http://localhost:30006. Place the YOLOv11 model file (`yolo11s.pt`) in the `backend` directory, or set `MODEL_PATH` in `.env`.

7. Run the backend server:
uvicorn backend.main:app --reloadThe API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the project root:ash
cd ..
2. Install dependencies:sh
npm install3. Create a `.env.local` file (optional, defaults to `http://localhost:8000`):
NEXT_PUBLIC_API_BASE_URL=http://localhost:80004. Run the development server:
npm run devThe app will be available at `http://localhost:3000`

## Project Structure

```
my-app/
├── app/                    # Next.js frontend
│   ├── components/         # React components
│   ├── page.js  