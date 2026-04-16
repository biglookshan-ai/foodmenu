from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import recipes, mealplans, nutrition

app = FastAPI(title="FoodMenu API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(recipes.router, prefix="/api/recipes", tags=["Recipes"])
app.include_router(mealplans.router, prefix="/api/mealplans", tags=["MealPlans"])
app.include_router(nutrition.router, prefix="/api/nutrition", tags=["Nutrition"])

@app.get("/")
async def root():
    return {"message": "FoodMenu API", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
