import io
import os
import logging
import re
from typing import List, Optional

import requests

from fastapi import FastAPI, File, HTTPException, UploadFile, Form  # type: ignore[import]
from fastapi.middleware.cors import CORSMiddleware  # type: ignore[import]
from fastapi.responses import JSONResponse  # type: ignore[import]
from PIL import Image
from PIL import UnidentifiedImageError

from .gemini_client import GeminiClient
from .model import detect_ingredients

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Recipe Recommender API")

# CORS configuration - use environment variable for production
allowed_origins = os.environ.get("ALLOWED_ORIGINS", "*").split(",")
if allowed_origins == ["*"]:
    # Development mode - allow all origins
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
    )
else:
    # Production mode - specific origins only
    # Clean up origins (remove empty strings from split)
    allowed_origins = [origin.strip() for origin in allowed_origins if origin.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
    )


@app.get("/")
def root() -> dict:
    return {"message": "Recipe Recommender API", "endpoints": ["/health", "/recommend"]}


@app.get("/health")
def health_check() -> dict:
    return {"status": "ok"}


@app.options("/recommend")
async def recommend_recipes_options():
    """Handle CORS preflight requests."""
    return JSONResponse(
        status_code=200,
        content={},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        },
    )


@app.post("/recommend")
async def recommend_recipes(
    file: Optional[UploadFile] = File(None),
    extra_ingredients: Optional[str] = Form(None),
    dietary_preferences: Optional[str] = Form(None),
) -> JSONResponse:
    """
    Main endpoint:
    - Accepts an optional image file and optional comma-separated extra ingredients.
    - Detects ingredients via YOLO if image is provided.
    - Merges + deduplicates all ingredients.
    - Queries Gemini to generate recipe ideas.
    """
    detected_ingredients: List[str] = []
    
    # 1) YOLO ingredient detection (only if image is provided)
    if file:
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Uploaded file must be an image.")
        
        # Read file contents to check size and process
        contents = await file.read()
        MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
        if len(contents) > MAX_FILE_SIZE:
            size_mb = len(contents) / (1024 * 1024)
            raise HTTPException(
                status_code=400,
                detail=f"File is too large ({size_mb:.2f}MB). Maximum size is 10MB."
            )

        # Process image fully in-memory with optimization
        try:
            img = Image.open(io.BytesIO(contents)).convert("RGB")
            # Resize large images early to reduce memory usage and processing time
            # YOLO model works best with 640px max dimension anyway
            w, h = img.size
            max_dimension = 1920  # Resize if larger than 1920px to reduce processing overhead
            if w > max_dimension or h > max_dimension:
                scale = min(max_dimension / float(w), max_dimension / float(h))
                new_w, new_h = int(w * scale), int(h * scale)
                img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        except UnidentifiedImageError as exc:
            raise HTTPException(
                status_code=400,
                detail="Unable to read image file. The file may be corrupted or not a valid image format. Please try a different image."
            ) from exc
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(
                status_code=400,
                detail=f"Unable to process image file: {str(exc)}. Please ensure the file is a valid image and try again."
            ) from exc

        # Run YOLO detection
        detected_ingredients = []
        try:
            detected_ingredients = detect_ingredients(img)
        except FileNotFoundError as exc:
            logger.error(f"Model file not found: {exc}", exc_info=True)
            # Continue with manual ingredients if available
            detected_ingredients = []
        except RuntimeError as exc:
            error_msg = str(exc).lower()
            if "cuda" in error_msg or "gpu" in error_msg:
                logger.warning(f"GPU/CUDA error during detection (falling back to CPU or manual input): {exc}")
            else:
                logger.error(f"Runtime error during ingredient detection: {exc}", exc_info=True)
            # Continue with manual ingredients if available
            detected_ingredients = []
        except Exception as exc:  # noqa: BLE001
            logger.error(f"Unexpected error during ingredient detection: {exc}", exc_info=True)
            # Don't fail completely if YOLO fails, just log and continue
            detected_ingredients = []

    # 2) Parse & normalize user-typed ingredients
    user_ingredients: List[str] = []
    if extra_ingredients:
        for token in extra_ingredients.split(","):
            name = token.strip()
            if name:
                # Validate ingredient name
                if len(name) < 2:
                    continue
                if len(name) > 50:
                    name = name[:50]
                # Sanitize: allow letters, numbers, spaces, hyphens, apostrophes
                name = re.sub(r"[^a-zA-Z0-9\s\-']", "", name)
                if name and name.strip():
                    user_ingredients.append(name.strip())

    # If nothing at all, ask user to add something
    if not detected_ingredients and not user_ingredients:
        message = "No ingredients detected from the image. Please add ingredients manually or try uploading a clearer image with visible ingredients."
        if file:
            message = "No ingredients were detected in your image. Please add ingredients manually or try uploading a different image with clearly visible ingredients."
        return JSONResponse(
            status_code=200,
            content={
                "ingredients": [],
                "detectedIngredients": [],
                "manualIngredients": [],
                "recipes": [],
                "message": message,
            },
        )
    
    # Provide helpful message if YOLO failed but user has manual ingredients
    yolo_failed_message = None
    if file and not detected_ingredients and user_ingredients:
        yolo_failed_message = "Could not detect ingredients from the image, but using your manually added ingredients."

    # 3) Merge + deduplicate
    # Track which ingredients came from which source for better UX
    merged: List[str] = []
    detected_set = {ing.lower() for ing in detected_ingredients}
    user_set = {ing.lower() for ing in user_ingredients}
    seen = set()
    
    # First add detected ingredients, then user ingredients
    # This preserves order: detected first, then manually added
    for ing in detected_ingredients:
        key = ing.lower()
        if key not in seen:
            seen.add(key)
            merged.append(ing)
    
    for ing in user_ingredients:
        key = ing.lower()
        if key not in seen:
            seen.add(key)
            merged.append(ing)
    

    # 4) Parse dietary preferences
    dietary_list: List[str] = []
    if dietary_preferences:
        dietary_list = [p.strip() for p in dietary_preferences.split(",") if p.strip()]
    
    # 5) Query Gemini to generate recipe ideas based on ingredients
    try:
        client = GeminiClient()
        raw_recipes = client.generate_recipes(merged, dietary_preferences=dietary_list)
    except RuntimeError as exc:
        error_msg = str(exc).lower()
        if "timeout" in error_msg or "timed out" in error_msg:
            detail = "Recipe generation timed out. Please try again with fewer ingredients or try again later."
        elif "rate limit" in error_msg or "quota" in error_msg:
            detail = "API rate limit exceeded. Please wait a moment and try again."
        elif "api key" in error_msg or "authentication" in error_msg:
            detail = "API authentication failed. Please contact support."
        else:
            detail = f"Recipe generation service error: {exc}. Please try again."
        raise HTTPException(
            status_code=502,
            detail=detail,
        ) from exc
    except requests.exceptions.Timeout as exc:
        raise HTTPException(
            status_code=504,
            detail="Request to recipe service timed out. Please try again.",
        ) from exc
    except requests.exceptions.ConnectionError as exc:
        raise HTTPException(
            status_code=503,
            detail="Unable to connect to recipe service. Please check your connection and try again.",
        ) from exc
    except Exception as exc:  # noqa: BLE001
        logger.error(f"Unexpected error while generating recipes: {exc}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while generating recipes. Please try again.",
        ) from exc

    if not raw_recipes:
        return JSONResponse(
            status_code=200,
            content={
                "ingredients": merged,
                "detectedIngredients": detected_ingredients,
                "manualIngredients": user_ingredients,
                "recipes": [],
                "message": "No recipes found for these ingredients.",
            },
        )
    
    # Gemini client already returns normalized recipes, with coverageScore etc.
    top5 = raw_recipes[:5]

    response_content = {
        "ingredients": merged,
        "detectedIngredients": detected_ingredients,
        "manualIngredients": user_ingredients,
        "recipes": top5,
        "fallback": False,
    }
    
    if yolo_failed_message:
        response_content["message"] = yolo_failed_message
    
    return JSONResponse(
        status_code=200,
        content=response_content,
    )


