from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import date
from app.models import MealPlan, Recipe
from app.database import get_db

router = APIRouter()

class MealPlanCreate(BaseModel):
    date: date
    meal_type: str
    recipe_id: int
    completed: bool = False

class MealPlanUpdate(BaseModel):
    completed: Optional[bool] = None

@router.post("/")
async def create_mealplan(mealplan: MealPlanCreate, db: Session = Depends(get_db)):
    db_mealplan = MealPlan(**mealplan.model_dump())
    db.add(db_mealplan)
    db.commit()
    db.refresh(db_mealplan)
    return {"id": db_mealplan.id}

@router.get("/")
async def get_mealplans(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(MealPlan)
    if start_date:
        query = query.filter(MealPlan.date >= start_date)
    if end_date:
        query = query.filter(MealPlan.date <= end_date)
    return query.all()

@router.patch("/{mealplan_id}")
async def update_mealplan(mealplan_id: int, update: MealPlanUpdate, db: Session = Depends(get_db)):
    mealplan = db.query(MealPlan).filter(MealPlan.id == mealplan_id).first()
    if not mealplan:
        raise HTTPException(status_code=404, detail="MealPlan not found")
    if update.completed is not None:
        mealplan.completed = update.completed
    db.commit()
    return {"message": "Updated"}
