import logging
import os
from functools import lru_cache
from typing import List

from PIL import Image
from ultralytics import YOLO

from ingredient_normalizer import normalize_ingredients_batch

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_model() -> YOLO:
    """
    Lazily load the custom YOLO model for ingredient detection.
    """
    model_path = os.environ.get("MODEL_PATH")
    
    # If MODEL_PATH is not set, try to find my_model.pt relative to this file
    if not model_path:
        # Get the directory where this file is located (backend/)
        current_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(current_dir, "my_model.pt")
    
    # Convert to absolute path
    model_path = os.path.abspath(model_path)
    
    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"Model file not found at {model_path}. "
            f"Please set MODEL_PATH environment variable or place my_model.pt in the backend directory."
        )
    
    try:
        model = YOLO(model_path)
        logger.info(f"YOLO model loaded: {len(model.names)} classes")
        return model
    except Exception as e:
        logger.error(f"Failed to load YOLO model: {e}")
        raise


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
    Run YOLO on the given PIL image and return a list of normalized ingredient names.
    """
    try:
        model = get_model()
        resized = resize_image_for_inference(img)

        # Run inference with confidence threshold (default 0.25 for YOLO)
        confidence_threshold = float(os.environ.get("YOLO_CONFIDENCE_THRESHOLD", "0.25"))
        results = model(resized, verbose=False, conf=confidence_threshold)[0]
        names = results.names

        raw_classes: List[str] = []
        for box in results.boxes:
            cls_idx = int(box.cls.item())
            raw_name = names.get(cls_idx, "").strip()
            if not raw_name:
                continue
            raw_classes.append(raw_name)
        
        if not raw_classes:
            logger.warning(f"No ingredients detected from image ({len(results.boxes)} boxes found)")
        
        logger.info(f"Detected {len(raw_classes)} ingredients: {raw_classes}")

        # IMPORTANT: Disable AI normalization by default to avoid rate limits
        # AI normalization can be enabled via ENABLE_AI_NORMALIZATION=true env var
        # Dictionary lookup handles most common ingredients without API calls
        try:
            # Default to False to avoid rate limits - dictionary lookup is sufficient for most cases
            use_ai_default = os.environ.get("ENABLE_AI_NORMALIZATION", "false").lower() == "true"
            normalized = normalize_ingredients_batch(raw_classes, use_ai=use_ai_default)
            return normalized
        except Exception as e:
            logger.error(f"Error during ingredient normalization: {e}")
            # Fallback: basic normalization without AI
            normalized = normalize_ingredients_batch(raw_classes, use_ai=False)
            return normalized
    except FileNotFoundError as e:
        raise RuntimeError(f"Model file error: {e}") from e
    except Exception as e:
        raise RuntimeError(f"Error during YOLO inference: {e}") from e


