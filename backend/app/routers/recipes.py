from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Optional
import logging
import os

from app.database import (
    list_recipes, get_recipe, create_recipe, 
    update_recipe, delete_recipe, get_mealplans,
    create_mealplan, update_mealplan, delete_mealplan
)
from app.schemas import RecipeCreate, IngredientCreate, StepCreate, NutritionInfo
from app.services.scraper import scrape_recipe
from app.services.vision import extract_nutrition_from_url, extract_nutrition_from_file

logger = logging.getLogger(__name__)

router = APIRouter()


# ─── Endpoint-specific schemas ───────────────────────────────────────────────

class ImportFromUrlRequest(BaseModel):
    url: str = Field(..., description="Recipe URL from xiachufang.com or meishichina.com")
    auto_nutrition: bool = Field(False, description="Whether to auto-extract nutrition via AI from the recipe image")


class RecognizeFromImageRequest(BaseModel):
    image_url: Optional[str] = None
    auto_nutrition: bool = Field(True, description="Whether to extract nutrition info from the image")


class NutritionResponse(BaseModel):
    source: str  # "ai_minimax" or "manual"
    nutrition: NutritionInfo


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/", response_model=dict)
async def create_recipe_endpoint(recipe: RecipeCreate):
    """Create a new recipe."""
    recipe_data = recipe.model_dump()
    recipe_id = create_recipe(recipe_data)
    logger.info("[recipes] Recipe created: id=%d name=%s", recipe_id, recipe.name)
    return {"id": recipe_id, "message": "Recipe created"}


@router.get("/", response_model=List[dict])
async def list_recipes_endpoint(skip: int = 0, limit: int = 20):
    """List all recipes with pagination."""
    recipes = list_recipes(skip=skip, limit=limit)
    return recipes


@router.get("/{recipe_id}")
async def get_recipe_endpoint(recipe_id: int):
    """Get a single recipe with ingredients and steps."""
    recipe = get_recipe(recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return recipe


@router.patch("/{recipe_id}")
async def update_recipe_endpoint(recipe_id: int, recipe: RecipeCreate):
    """Update a recipe."""
    recipe_data = recipe.model_dump()
    success = update_recipe(recipe_id, recipe_data)
    if not success:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return {"id": recipe_id, "message": "Recipe updated"}


@router.delete("/{recipe_id}")
async def delete_recipe_endpoint(recipe_id: int):
    """Delete a recipe."""
    success = delete_recipe(recipe_id)
    if not success:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return {"message": "Recipe deleted"}


@router.post("/import")
async def import_recipe_alias(body: ImportFromUrlRequest):
    """Alias for /import-from-url for backwards compatibility."""
    return await import_recipe_from_url(body)


@router.post("/import-from-url")
async def import_recipe_from_url(body: ImportFromUrlRequest):
    """
    Scrape a recipe from a URL (xiachufang.com or meishichina.com)
    and save it to the database.
    """
    logger.info("[recipes] import-from-url: %s", body.url)

    recipe_data = await scrape_recipe(body.url)
    if recipe_data is None:
        raise HTTPException(
            status_code=422,
            detail=(
                "Failed to scrape recipe from the provided URL. "
                "Supported sites: xiachufang.com, meishichina.com"
            ),
        )

    # Auto-extract nutrition from the recipe image if requested
    if body.auto_nutrition and recipe_data.main_image:
        nutrition = await extract_nutrition_from_url(recipe_data.main_image)
        if nutrition:
            recipe_data.nutrition = nutrition
            logger.info("[recipes] Nutrition auto-extracted for: %s", recipe_data.name)

    # Convert to dict for database
    recipe_dict = recipe_data.model_dump()
    recipe_id = create_recipe(recipe_dict)
    logger.info("[recipes] Recipe imported: id=%d name=%s", recipe_id, recipe_data.name)

    # Fetch the full recipe to return
    recipe = get_recipe(recipe_id)
    return JSONResponse(
        status_code=201,
        content=recipe
    )


@router.post("/recognize-from-image", response_model=NutritionResponse)
async def recognize_from_image(
    image_url: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    auto_nutrition: bool = Form(True),
):
    """
    Extract nutrition information from a food image.
    Accepts either an image URL (image_url) or an uploaded file (file).
    """
    nutrition: Optional[NutritionInfo] = None

    if image_url:
        logger.info("[recipes] recognize-from-image URL: %s", image_url)
        nutrition = await extract_nutrition_from_url(image_url)
    elif file:
        # Save uploaded file to temp location
        temp_dir = "/tmp/foodmenu_uploads"
        os.makedirs(temp_dir, exist_ok=True)
        temp_path = os.path.join(temp_dir, f"vision_{os.urandom(8).hex()}_{file.filename or 'upload.jpg'}")

        content = await file.read()
        with open(temp_path, "wb") as f:
            f.write(content)

        logger.info("[recipes] recognize-from-image file: %s", temp_path)
        nutrition = await extract_nutrition_from_file(temp_path)

        # Clean up temp file
        try:
            os.remove(temp_path)
        except OSError:
            pass
    else:
        raise HTTPException(status_code=400, detail="Either image_url or file must be provided")

    if nutrition is None:
        raise HTTPException(
            status_code=502,
            detail="Failed to extract nutrition from image. Please try again or provide nutrition manually.",
        )

    logger.info(
        "[recipes] Nutrition recognized: calories=%.1f protein=%.1f fat=%.1f carbs=%.1f",
        nutrition.calories, nutrition.protein, nutrition.fat, nutrition.carbs,
    )

    return NutritionResponse(source="ai_minimax", nutrition=nutrition)
