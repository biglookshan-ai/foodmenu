"""
Recipe Scraper Service
Scrapes recipes from xiachufang.com (mobile) and meishichina.com
Uses JSON-LD structured data when available for more reliable parsing.
"""
import re
import json
import logging
from typing import Optional
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup

from app.schemas import RecipeCreate, IngredientCreate, StepCreate

logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
        "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 "
        "Mobile/15E148 Safari/604.1"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9",
}


def _normalize_url(url: str) -> str:
    """Convert desktop URL to mobile URL for supported sites."""
    parsed = urlparse(url)
    host = parsed.netloc.lower()

    if "xiachufang.com" in host and "m." not in host:
        return url.replace("://www.", "://m.", 1)
    if "meishichina.com" in host and "home.meishichina.com" not in host:
        return url
    return url


def _extract_number_amount(text: str) -> tuple[Optional[str], Optional[str]]:
    """Try to extract a numeric amount from ingredient text like '200g', '2勺'."""
    m = re.match(r"^([\d./]+)\s*([a-zA-Z\u4e00-\u9fff%℃]*)", text.strip())
    if m:
        return m.group(1), m.group(2)
    return None, None


def _parse_ingredient_text(text: str) -> tuple[Optional[str], Optional[str], Optional[str]]:
    """Parse ingredient text like '200g 面粉' into (amount, unit, name)."""
    text = text.strip()
    if not text:
        return None, None, None
    # Remove leading # comments (used in xiachufang for section headers)
    if text.startswith("#"):
        return None, None, None
    # Try to extract number at start
    m = re.match(r"^([\d./]+)\s*([a-zA-Z\u4e00-\u9fff%℃]*?)\s+(.+)", text)
    if m:
        return m.group(1), m.group(2), m.group(3)
    return None, None, text


def _parse_steps_from_text(text: str) -> list[StepCreate]:
    """Parse recipe instructions text into steps."""
    steps = []
    # Split by numbered steps (0. 1. 2. or 0、1、2、)
    parts = re.split(r"(?:\d+[.、]\s*)", text)
    for i, part in enumerate(parts):
        part = part.strip()
        if part:
            steps.append(StepCreate(order=i + 1, instruction=part))
    return steps


async def _scrape_xiachufang(url: str) -> Optional[RecipeCreate]:
    """Scrape a recipe from m.xiachufang.com using JSON-LD when available."""
    async with httpx.AsyncClient(headers=HEADERS, timeout=30.0, follow_redirects=True) as client:
        try:
            resp = await client.get(url)
            resp.raise_for_status()
        except Exception as exc:
            logger.warning("[scraper] xiachufang request failed: %s", exc)
            return None

    soup = BeautifulSoup(resp.text, "html.parser")

    # Try JSON-LD structured data first (most reliable)
    json_ld = soup.find("script", type="application/ld+json")
    if json_ld:
        try:
            data = json.loads(json_ld.string)
            name = data.get("name", "")
            image = data.get("image")
            if isinstance(image, list):
                image = image[0]
            elif isinstance(image, dict):
                image = image.get("url", "")

            ingredients = []
            raw_ingredients = data.get("recipeIngredient") or []
            for ing_text in raw_ingredients:
                ing_text = str(ing_text).strip()
                if not ing_text or ing_text.startswith("#"):
                    continue
                amount, unit, ing_name = _parse_ingredient_text(ing_text)
                ingredients.append(IngredientCreate(
                    name=ing_name or ing_text,
                    amount=amount,
                    unit=unit
                ))

            steps = []
            raw_instructions = data.get("recipeInstructions")
            if isinstance(raw_instructions, str):
                steps = _parse_steps_from_text(raw_instructions)
            elif isinstance(raw_instructions, list):
                for i, inst in enumerate(raw_instructions):
                    if isinstance(inst, str):
                        text = re.sub(r"^\d+[.、]\s*", "", inst.strip())
                        if text:
                            steps.append(StepCreate(order=i + 1, instruction=text))
                    elif isinstance(inst, dict):
                        text = inst.get("text", "") or inst.get("name", "")
                        text = text.strip()
                        if text:
                            steps.append(StepCreate(order=i + 1, instruction=text))

            description = data.get("description", "")

            if name:
                logger.info("[scraper] xiachufang JSON-LD success: %s (ingredients=%d, steps=%d)",
                            name, len(ingredients), len(steps))
                return RecipeCreate(
                    name=name,
                    main_image=image,
                    description=description,
                    source_type="link",
                    source_url=url,
                    ingredients=ingredients,
                    steps=steps,
                )
        except Exception as exc:
            logger.warning("[scraper] JSON-LD parse failed: %s", exc)

    # Fallback: HTML parsing
    name_tag = soup.select_one(".recipe-title, .recipe-name, h1")
    name = name_tag.get_text(strip=True) if name_tag else ""

    img_tag = soup.select_one(".recipe-cover img, .cover-img img, img.recipe-cover")
    main_image = img_tag.get("src") or img_tag.get("data-src") if img_tag else None

    ingredients: list[IngredientCreate] = []
    ing_rows = soup.select(".ingredient-item, .ingredient-row, .ing-row, tr.ingredient-item")
    for row in ing_rows:
        amount_el = row.select_one(".amount, .ing-amount, .amount-num")
        name_el = row.select_one(".name, .ing-name, .ingredient-name")
        amount = amount_el.get_text(strip=True) if amount_el else None
        ing_name = name_el.get_text(strip=True) if name_el else row.get_text(strip=True)
        if ing_name:
            num_amt, unit = _extract_number_amount(amount or "")
            ingredients.append(IngredientCreate(name=ing_name, amount=num_amt or amount, unit=unit))

    steps: list[StepCreate] = []
    step_els = soup.select(".step-item, .step-row, .recipe-step, li.step-item")
    for i, el in enumerate(step_els, start=1):
        text = el.get_text(strip=True)
        text = re.sub(r"^\d+[.、)\s]*", "", text)
        if text:
            steps.append(StepCreate(order=i, instruction=text))

    tips_tag = soup.select_one(".tips, .recipe-tip, .cooking-tip")
    tips = tips_tag.get_text(strip=True) if tips_tag else None

    if not name:
        logger.warning("[scraper] Could not parse recipe name from xiachufang: %s", url)
        return None

    logger.info("[scraper] xiachufang HTML fallback: %s (ingredients=%d, steps=%d)",
                name, len(ingredients), len(steps))
    return RecipeCreate(
        name=name,
        main_image=main_image,
        description=tips,
        source_type="link",
        source_url=url,
        ingredients=ingredients,
        steps=steps,
    )


async def _scrape_meishichina(url: str) -> Optional[RecipeCreate]:
    """Scrape a recipe from meishichina.com."""
    async with httpx.AsyncClient(headers=HEADERS, timeout=30.0, follow_redirects=True) as client:
        try:
            resp = await client.get(url)
            resp.raise_for_status()
        except Exception as exc:
            logger.warning("[scraper] meishichina request failed: %s", exc)
            return None

    soup = BeautifulSoup(resp.text, "html.parser")

    # Try JSON-LD first
    json_ld = soup.find("script", type="application/ld+json")
    if json_ld:
        try:
            data = json.loads(json_ld.string)
            name = data.get("name", "")
            image = data.get("image")
            if isinstance(image, list):
                image = image[0]
            elif isinstance(image, dict):
                image = image.get("url", "")

            ingredients = []
            raw_ingredients = data.get("recipeIngredient") or []
            for ing_text in raw_ingredients:
                ing_text = str(ing_text).strip()
                if not ing_text or ing_text.startswith("#"):
                    continue
                amount, unit, ing_name = _parse_ingredient_text(ing_text)
                ingredients.append(IngredientCreate(
                    name=ing_name or ing_text,
                    amount=amount,
                    unit=unit
                ))

            steps = []
            raw_instructions = data.get("recipeInstructions")
            if isinstance(raw_instructions, str):
                steps = _parse_steps_from_text(raw_instructions)
            elif isinstance(raw_instructions, list):
                for i, inst in enumerate(raw_instructions):
                    if isinstance(inst, str):
                        text = re.sub(r"^\d+[.、]\s*", "", inst.strip())
                        if text:
                            steps.append(StepCreate(order=i + 1, instruction=text))
                    elif isinstance(inst, dict):
                        text = inst.get("text", "") or inst.get("name", "")
                        text = text.strip()
                        if text:
                            steps.append(StepCreate(order=i + 1, instruction=text))

            description = data.get("description", "")

            if name:
                logger.info("[scraper] meishichina JSON-LD success: %s", name)
                return RecipeCreate(
                    name=name,
                    main_image=image,
                    description=description,
                    source_type="link",
                    source_url=url,
                    ingredients=ingredients,
                    steps=steps,
                )
        except Exception as exc:
            logger.warning("[scraper] meishichina JSON-LD parse failed: %s", exc)

    # Fallback HTML parsing
    name_tag = soup.select_one(".recipe-title, .recipe-name, .recipe-header h1, h1")
    name = name_tag.get_text(strip=True) if name_tag else ""

    img_tag = soup.select_one(".recipe-cover img, .recipe-img img, .cover-img img")
    main_image = img_tag.get("src") or img_tag.get("data-src") if img_tag else None

    ingredients: list[IngredientCreate] = []
    ing_rows = soup.select(".ingredient-item, .ing-row, .ingredient-row, ul.ingredient-list li")
    for row in ing_rows:
        amount_el = row.select_one(".amount, .ing-amount, .num")
        name_el = row.select_one(".name, .ing-name")
        amount = amount_el.get_text(strip=True) if amount_el else None
        ing_name = name_el.get_text(strip=True) if name_el else row.get_text(strip=True)
        if ing_name:
            num_amt, unit = _extract_number_amount(amount or "")
            ingredients.append(IngredientCreate(name=ing_name, amount=num_amt or amount, unit=unit))

    steps: list[StepCreate] = []
    step_els = soup.select(".step-item, .step-row, .recipe-step, .step-con")
    for i, el in enumerate(step_els, start=1):
        text = el.get_text(strip=True)
        text = re.sub(r"^\d+[.、)\s]*", "", text)
        if text:
            steps.append(StepCreate(order=i, instruction=text))

    tips_tag = soup.select_one(".tips, .recipe-tip, .cooking-tip")
    tips = tips_tag.get_text(strip=True) if tips_tag else None

    if not name:
        logger.warning("[scraper] Could not parse recipe name from meishichina: %s", url)
        return None

    logger.info("[scraper] meishichina HTML fallback: %s", name)
    return RecipeCreate(
        name=name,
        main_image=main_image,
        description=tips,
        source_type="link",
        source_url=url,
        ingredients=ingredients,
        steps=steps,
    )


async def scrape_recipe(url: str) -> Optional[RecipeCreate]:
    """
    Dispatch to the correct scraper based on the URL domain.
    Returns RecipeCreate or None on failure.
    """
    normalized = _normalize_url(url)
    parsed = urlparse(normalized)
    host = parsed.netloc.lower()

    logger.info("[scraper] Scraping URL: %s (host: %s)", normalized, host)

    if "xiachufang.com" in host:
        return await _scrape_xiachufang(normalized)
    elif "meishichina.com" in host:
        return await _scrape_meishichina(normalized)
    else:
        logger.warning("[scraper] Unsupported domain: %s", host)
        return None
