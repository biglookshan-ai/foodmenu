from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date, timedelta
from typing import Optional
from app.models import MealPlan, Recipe
from app.database import get_db
import json

router = APIRouter()

@router.get("/daily")
async def get_daily_nutrition(
    target_date: date = Query(None),
    db: Session = Depends(get_db)
):
    if not target_date:
        target_date = date.today()
    
    mealplans = db.query(MealPlan).filter(
        MealPlan.date == target_date,
        MealPlan.completed == True
    ).all()
    
    total_nutrition = {
        "calories": 0, "protein": 0, "fat": 0,
        "carbs": 0, "fiber": 0, "sodium": 0, "sugar": 0
    }
    
    for mp in mealplans:
        if mp.recipe and mp.recipe.nutrition_json:
            nutrition = json.loads(mp.recipe.nutrition_json)
            for key in total_nutrition:
                total_nutrition[key] += nutrition.get(key, 0)
    
    return {
        "date": target_date.isoformat(),
        "nutrition": total_nutrition,
        "meal_count": len(mealplans)
    }

@router.get("/weekly")
async def get_weekly_nutrition(
    start_date: date = Query(None),
    db: Session = Depends(get_db)
):
    if not start_date:
        start_date = date.today() - timedelta(days=date.today().weekday())
    
    end_date = start_date + timedelta(days=6)
    
    daily_data = []
    for i in range(7):
        target_date = start_date + timedelta(days=i)
        mealplans = db.query(MealPlan).filter(
            MealPlan.date == target_date,
            MealPlan.completed == True
        ).all()
        
        day_nutrition = {"calories": 0, "protein": 0, "fat": 0, "carbs": 0}
        for mp in mealplans:
            if mp.recipe and mp.recipe.nutrition_json:
                nutrition = json.loads(mp.recipe.nutrition_json)
                for key in day_nutrition:
                    day_nutrition[key] += nutrition.get(key, 0)
        
        daily_data.append({
            "date": target_date.isoformat(),
            "nutrition": day_nutrition,
            "meal_count": len(mealplans)
        })
    
    return {
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "days": daily_data
    }
