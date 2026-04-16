"""
MiniMax Vision Service
Uses MiniMax API for image understanding and nutrition extraction.
"""
import base64
import logging
import os
from typing import Optional

import httpx

from app.schemas import NutritionInfo

logger = logging.getLogger(__name__)

MINIMAX_API_KEY = os.getenv(
    "MINIMAX_API_KEY",
    "sk-cp-gOyvParIajLGZGd7ow4uf_39fDO37mv0wKr68T3cRF7oG0x42MJAIpu8xxrXihM2ucwN7b9R9J1OkwpV2oDlnYttC-8SYz_wOl-jFb9paPO_p7Rt41rpRns",
)

MINIMAX_BASE_URL = "https://api.minimax.chat/v1"


def _build_vision_prompt() -> str:
    return (
        "You are a nutrition analysis assistant. "
        "Analyze the food image and extract nutritional information. "
        "Return ONLY a valid JSON object with these exact fields (all numbers as floats, 0 if unknown):\n"
        '{\n  "calories": <number>,\n  "protein": <number>,\n  "fat": <number>,\n  "carbs": <number>,\n  "fiber": <number>,\n  "sodium": <number>,\n  "sugar": <number>\n}\n'
        "Do not include any explanation, only the JSON object."
    )


def _encode_image(image_source: str) -> tuple[str, str]:
    """
    Prepare image for MiniMax API.
    Returns (image_data, mime_type).
    - If image_source is a URL, fetches it.
    - If it's a file path, reads and encodes it.
    - If it's already base64 data URL, returns as-is.
    """
    if image_source.startswith("http://") or image_source.startswith("https://"):
        # Fetch from URL
        resp = httpx.get(image_source, timeout=15.0, follow_redirects=True)
        resp.raise_for_status()
        content = resp.content
        # Infer mime type
        content_type = resp.headers.get("content-type", "image/jpeg").split(";")[0].strip()
    elif image_source.startswith("data:"):
        # Already a data URL: data:image/jpeg;base64,xxxx
        meta, data = image_source.split(",", 1)
        content = base64.b64decode(data)
        content_type = meta.split(":")[1].split(";")[0]
    else:
        # Local file path
        with open(image_source, "rb") as f:
            content = f.read()
        content_type = "image/jpeg"

    return base64.b64encode(content).decode("utf-8"), content_type


async def extract_nutrition_from_url(image_url: str) -> Optional[NutritionInfo]:
    """Extract nutrition info by sending an image URL to MiniMax."""
    prompt = _build_vision_prompt()

    payload = {
        "model": "MiniMax-VL-01",
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": image_url}},
                ],
            }
        ],
        "temperature": 0.2,
    }

    headers = {
        "Authorization": f"Bearer {MINIMAX_API_KEY}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(base_url=MINIMAX_BASE_URL, timeout=60.0) as client:
            resp = await client.post("/text/chatcompletion_v2", json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
    except Exception as exc:
        logger.warning("[vision] MiniMax API request failed: %s", exc)
        return None

    # Parse response
    try:
        raw = data["choices"][0]["message"]["content"]
        # Strip markdown code fences if present
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        import json

        nutrition_data = json.loads(raw)

        logger.info(
            "[vision] Nutrition extracted: calories=%.1f, protein=%.1f",
            nutrition_data.get("calories", 0),
            nutrition_data.get("protein", 0),
        )

        return NutritionInfo(
            calories=float(nutrition_data.get("calories", 0)),
            protein=float(nutrition_data.get("protein", 0)),
            fat=float(nutrition_data.get("fat", 0)),
            carbs=float(nutrition_data.get("carbs", 0)),
            fiber=float(nutrition_data.get("fiber", 0)),
            sodium=float(nutrition_data.get("sodium", 0)),
            sugar=float(nutrition_data.get("sugar", 0)),
        )
    except (KeyError, IndexError, json.JSONDecodeError) as exc:
        logger.warning("[vision] Failed to parse MiniMax response: %s | Data: %s", exc, data)
        return None


async def extract_nutrition_from_file(file_path: str) -> Optional[NutritionInfo]:
    """Extract nutrition info from a local image file."""
    image_data, mime_type = _encode_image(file_path)
    data_url = f"data:{mime_type};base64,{image_data}"
    return await extract_nutrition_from_url(data_url)


async def extract_nutrition_from_base64(image_base64: str, mime_type: str = "image/jpeg") -> Optional[NutritionInfo]:
    """Extract nutrition info from a base64-encoded image."""
    data_url = f"data:{mime_type};base64,{image_base64}"
    return await extract_nutrition_from_url(data_url)
