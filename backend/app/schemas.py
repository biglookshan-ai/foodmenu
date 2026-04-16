"""
Shared Pydantic schemas for the FoodMenu API.
"""
from typing import List, Optional
from pydantic import BaseModel


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
