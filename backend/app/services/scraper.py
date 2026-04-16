"""
Recipe Scraper Service
Scrapes recipes from xiachufang.com (mobile) and meishichina.com
"""
import re
import logging
from typing import Optional
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup

from app.schemas import RecipeCreate, IngredientCreate, StepCreate

logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (iPhone; CPU iPhone OS_17_0 like Mac OS X) "
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
        # meishichina recipe URLs typically go to home.meishichina.com
        return url
    return url


def _extract_number_amount(text: str) -> tuple[Optional[str], Optional[str]]:
    """Try to extract a numeric amount from ingredient text like '200g', '2勺'."""
    m = re.match(r"^([\d./]+)\s*([a-zA-Z\u4e00-\u9fff%℃℃]*)", text.strip())
    if m:
        return m.group(1), m.group(2)
    return None, None


async def _scrape_xiachufang(url: str) -> Optional[RecipeCreate]:
    """Scrape a recipe from m.xiachufang.com."""
    async with httpx.AsyncClient(headers=HEADERS, timeout=30.0, follow_redirects=True) as client:
        try:
            resp = await client.get(url)
            resp.raise_for_status()
        except Exception as exc:
            logger.warning("[scraper] xiachufang request failed: %s", exc)
            return None

    soup = BeautifulSoup(resp.text, "html.parser")

    # Name
    name_tag = soup.select_one(".recipe-title, .recipe-name, h1")
    name = name_tag.get_text(strip=True) if name_tag else ""

    # Main image
    img_tag = soup.select_one(".recipe-cover img, .cover-img img, img.recipe-cover")
    main_image = img_tag.get("src") or img_tag.get("data-src") if img_tag else None

    # Ingredients
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

    # Steps
    steps: list[StepCreate] = []
    step_els = soup.select(".step-item, .step-row, .recipe-step, li.step-item")
    for i, el in enumerate(step_els, start=1):
        text = el.get_text(strip=True)
        text = re.sub(r"^\d+[.、)]\s*", "", text)
        if text:
            steps.append(StepCreate(order=i, instruction=text))

    # Tips
    tips_tag = soup.select_one(".tips, .recipe-tip, .cooking-tip")
    tips = tips_tag.get_text(strip=True) if tips_tag else None

    if not name:
        logger.warning("[scraper] Could not parse recipe name from xiachufang: %s", url)
        return None

    logger.info("[scraper] xiachufang success: %s", name)
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

    # Name
    name_tag = soup.select_one(".recipe-title, .recipe-name, .recipe-header h1, h1")
    name = name_tag.get_text(strip=True) if name_tag else ""

    # Main image
    img_tag = soup.select_one(".recipe-cover img, .recipe-img img, .cover-img img")
    main_image = img_tag.get("src") or img_tag.get("data-src") if img_tag else None

    # Ingredients
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

    # Steps
    steps: list[StepCreate] = []
    step_els = soup.select(".step-item, .step-row, .recipe-step, .step-con")
    for i, el in enumerate(step_els, start=1):
        text = el.get_text(strip=True)
        text = re.sub(r"^\d+[.、)]\s*", "", text)
        if text:
            steps.append(StepCreate(order=i, instruction=text))

    # Tips
    tips_tag = soup.select_one(".tips, .recipe-tip, .cooking-tip")
    tips = tips_tag.get_text(strip=True) if tips_tag else None

    if not name:
        logger.warning("[scraper] Could not parse recipe name from meishichina: %s", url)
        return None

    logger.info("[scraper] meishichina success: %s", name)
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
