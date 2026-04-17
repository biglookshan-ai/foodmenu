from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from datetime import date
from app.database import get_mealplans, create_mealplan, update_mealplan

router = APIRouter()

class MealPlanCreate(BaseModel):
    date: date
    meal_type: str
    recipe_id: int
    completed: bool = False

class MealPlanUpdate(BaseModel):
    completed: Optional[bool] = None

@router.post("/")
async def create_mealplan_endpoint(mealplan: MealPlanCreate):
    mealplan_data = mealplan.model_dump()
    mealplan_data["date"] = str(mealplan_data["date"])  # Convert date to string
    mealplan_id = create_mealplan(mealplan_data)
    return {"id": mealplan_id}

@router.get("/")
async def get_mealplans_endpoint(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
):
    start_str = str(start_date) if start_date else None
    end_str = str(end_date) if end_date else None
    return get_mealplans(start_date=start_str, end_date=end_str)

@router.patch("/{mealplan_id}")
async def update_mealplan_endpoint(mealplan_id: int, update: MealPlanUpdate):
    update_data = {}
    if update.completed is not None:
        update_data["completed"] = update.completed
    success = update_mealplan(mealplan_id, update_data)
    if not success:
        raise HTTPException(status_code=404, detail="MealPlan not found")
    return {"message": "Updated"}
