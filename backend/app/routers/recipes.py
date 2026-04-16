from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.models import Recipe, Ingredient, Step
from app.database import get_db
import json

router = APIRouter()

class IngredientCreate(BaseModel):
    name: str
    amount: Optional[str] = None
    unit: Optional[str] = None

class StepCreate(BaseModel):
    order: int
    instruction: str
    duration_min: Optional[int] = None

class NutritionInfo(BaseModel):
    calories: float = 0
    protein: float = 0
    fat: float = 0
    carbs: float = 0
    fiber: float = 0
    sodium: float = 0
    sugar: float = 0

class RecipeCreate(BaseModel):
    name: str
    main_image: Optional[str] = None
    description: Optional[str] = None
    source_type: str = "link"
    source_url: Optional[str] = None
    ingredients: List[IngredientCreate] = []
    steps: List[StepCreate] = []
    nutrition: Optional[NutritionInfo] = None

@router.post("/")
async def create_recipe(recipe: RecipeCreate, db: Session = Depends(get_db)):
    db_recipe = Recipe(
        name=recipe.name,
        main_image=recipe.main_image,
        description=recipe.description,
        source_type=recipe.source_type,
        source_url=recipe.source_url,
        nutrition_json=recipe.nutrition.model_dump_json() if recipe.nutrition else None
    )
    db.add(db_recipe)
    db.commit()
    db.refresh(db_recipe)
    
    for ing in recipe.ingredients:
        db_ing = Ingredient(recipe_id=db_recipe.id, **ing.model_dump())
        db.add(db_ing)
    
    for step in recipe.steps:
        db_step = Step(recipe_id=db_recipe.id, **step.model_dump())
        db.add(db_step)
    
    db.commit()
    return {"id": db_recipe.id, "message": "Recipe created"}

@router.get("/")
async def list_recipes(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    recipes = db.query(Recipe).offset(skip).limit(limit).all()
    return recipes

@router.get("/{recipe_id}")
async def get_recipe(recipe_id: int, db: Session = Depends(get_db)):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return recipe
