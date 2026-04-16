from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional
import logging
import json
import os

from app.models import Recipe, Ingredient, Step
from app.database import get_db
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


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _create_recipe_in_db(recipe_data: RecipeCreate, db: Session) -> int:
    """Persist a RecipeCreate model to the database. Returns recipe ID."""
    db_recipe = Recipe(
        name=recipe_data.name,
        main_image=recipe_data.main_image,
        description=recipe_data.description,
        source_type=recipe_data.source_type,
        source_url=recipe_data.source_url,
        nutrition_json=recipe_data.nutrition.model_dump_json() if recipe_data.nutrition else None,
    )
    db.add(db_recipe)
    db.commit()
    db.refresh(db_recipe)

    for ing in recipe_data.ingredients:
        db.add(Ingredient(recipe_id=db_recipe.id, **ing.model_dump()))
    for step in recipe_data.steps:
        db.add(Step(recipe_id=db_recipe.id, **step.model_dump()))

    db.commit()
    return db_recipe.id


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/", response_model=dict)
async def create_recipe(recipe: RecipeCreate, db: Session = Depends(get_db)):
    """Create a new recipe."""
    recipe_id = _create_recipe_in_db(recipe, db)
    logger.info("[recipes] Recipe created: id=%d name=%s", recipe_id, recipe.name)
    return {"id": recipe_id, "message": "Recipe created"}


@router.get("/", response_model=List[dict])
async def list_recipes(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    """List all recipes with pagination."""
    recipes = db.query(Recipe).offset(skip).limit(limit).all()
    return [
        {
            "id": r.id,
            "name": r.name,
            "main_image": r.main_image,
            "description": r.description,
            "source_type": r.source_type,
            "source_url": r.source_url,
        }
        for r in recipes
    ]


@router.get("/{recipe_id}")
async def get_recipe(recipe_id: int, db: Session = Depends(get_db)):
    """Get a single recipe with ingredients and steps."""
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    return {
        "id": recipe.id,
        "name": recipe.name,
        "main_image": recipe.main_image,
        "description": recipe.description,
        "source_type": recipe.source_type,
        "source_url": recipe.source_url,
        "nutrition": json.loads(recipe.nutrition_json) if recipe.nutrition_json else None,
        "ingredients": [
            {"id": i.id, "name": i.name, "amount": i.amount, "unit": i.unit}
            for i in recipe.ingredients
        ],
        "steps": [
            {"id": s.id, "order": s.order, "instruction": s.instruction, "duration_min": s.duration_min}
            for s in sorted(recipe.steps, key=lambda s: s.order)
        ],
    }


@router.post("/import")
async def import_recipe_alias(body: ImportFromUrlRequest, db: Session = Depends(get_db)):
    """Alias for /import-from-url for backwards compatibility."""
    return await import_recipe_from_url(body, db)


@router.post("/import-from-url")
async def import_recipe_from_url(body: ImportFromUrlRequest, db: Session = Depends(get_db)):
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

    recipe_id = _create_recipe_in_db(recipe_data, db)
    logger.info("[recipes] Recipe imported: id=%d name=%s", recipe_id, recipe_data.name)

    return JSONResponse(
        status_code=201,
        content={
            "id": recipe_id,
            "message": "Recipe imported successfully",
            "name": recipe_data.name,
            "scraped_ingredients": len(recipe_data.ingredients),
            "scraped_steps": len(recipe_data.steps),
            "nutrition": recipe_data.nutrition.model_dump() if recipe_data.nutrition else None,
        },
    )


@router.post("/recognize-from-image", response_model=NutritionResponse)
async def recognize_from_image(
    image_url: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    auto_nutrition: bool = Form(True),
    db: Session = Depends(get_db),
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
