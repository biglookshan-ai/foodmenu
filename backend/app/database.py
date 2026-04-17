"""
Supabase database layer - replaces SQLAlchemy with Supabase REST API.
"""
import os
import requests
from typing import Optional, List, Dict, Any

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://uvfdmdhepemhospjvrsy.supabase.co")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2ZmRtZGhlcGVtaG9zcGp2cnN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjM2MDQxMywiZXhwIjoyMDkxOTM2NDEzfQ.Ocrpxwc8USooWXi_j6huvBkdlan3ZPdLFp0ukfjeiEY")

HEADERS = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}


def get_db():
    """Yields a database session (now just returns None since we use Supabase REST API)."""
    yield None


# ─── Recipe operations ─────────────────────────────────────────────────────────

def list_recipes(skip: int = 0, limit: int = 20) -> List[Dict[str, Any]]:
    """List all recipes with pagination."""
    params = {"offset": skip, "limit": limit, "select": "*"}
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/recipes",
        headers=HEADERS,
        params=params
    )
    r.raise_for_status()
    recipes = r.json()
    
    # Fetch ingredients and steps for each recipe
    for recipe in recipes:
        recipe["ingredients"] = get_ingredients(recipe["id"])
        recipe["steps"] = get_steps(recipe["id"])
    
    return recipes


def get_recipe(recipe_id: int) -> Optional[Dict[str, Any]]:
    """Get a single recipe with ingredients and steps."""
    params = {"id": f"eq.{recipe_id}", "select": "*"}
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/recipes",
        headers=HEADERS,
        params=params
    )
    r.raise_for_status()
    recipes = r.json()
    
    if not recipes:
        return None
    
    recipe = recipes[0]
    recipe["ingredients"] = get_ingredients(recipe["id"])
    recipe["steps"] = get_steps(recipe["id"])
    
    return recipe


def create_recipe(recipe_data: Dict[str, Any]) -> int:
    """Create a new recipe. Returns the new recipe ID."""
    # Extract nested data
    ingredients = recipe_data.pop("ingredients", [])
    steps = recipe_data.pop("steps", [])
    nutrition = recipe_data.pop("nutrition", None)
    
    if nutrition:
        recipe_data["nutrition"] = nutrition
    
    # Insert recipe
    r = requests.post(
        f"{SUPABASE_URL}/rest/v1/recipes",
        headers=HEADERS,
        json=recipe_data
    )
    r.raise_for_status()
    new_recipe = r.json()
    new_id = new_recipe[0]["id"] if isinstance(new_recipe, list) else new_recipe["id"]
    
    # Insert ingredients
    for ing in ingredients:
        ing_data = {"recipe_id": new_id, "name": ing["name"], "amount": ing.get("amount"), "unit": ing.get("unit")}
        requests.post(
            f"{SUPABASE_URL}/rest/v1/ingredients",
            headers=HEADERS,
            json=ing_data
        )
    
    # Insert steps
    for step in steps:
        step_data = {"recipe_id": new_id, "step_order": step["order"], "instruction": step["instruction"], "duration_min": step.get("duration_min")}
        requests.post(
            f"{SUPABASE_URL}/rest/v1/steps",
            headers=HEADERS,
            json=step_data
        )
    
    return new_id


def update_recipe(recipe_id: int, recipe_data: Dict[str, Any]) -> bool:
    """Update a recipe."""
    # Extract nested data
    ingredients = recipe_data.pop("ingredients", None)
    steps = recipe_data.pop("steps", None)
    nutrition = recipe_data.pop("nutrition", None)
    
    if nutrition is not None:
        recipe_data["nutrition"] = nutrition
    
    # Update recipe fields
    if recipe_data:
        params = {"id": f"eq.{recipe_id}"}
        r = requests.patch(
            f"{SUPABASE_URL}/rest/v1/recipes",
            headers=HEADERS,
            params=params,
            json=recipe_data
        )
        r.raise_for_status()
    
    # Update ingredients if provided
    if ingredients is not None:
        # Delete existing ingredients
        requests.delete(
            f"{SUPABASE_URL}/rest/v1/ingredients?recipe_id=eq.{recipe_id}",
            headers=HEADERS
        )
        # Insert new ingredients
        for ing in ingredients:
            ing_data = {"recipe_id": recipe_id, "name": ing["name"], "amount": ing.get("amount"), "unit": ing.get("unit")}
            requests.post(
                f"{SUPABASE_URL}/rest/v1/ingredients",
                headers=HEADERS,
                json=ing_data
            )
    
    # Update steps if provided
    if steps is not None:
        # Delete existing steps
        requests.delete(
            f"{SUPABASE_URL}/rest/v1/steps?recipe_id=eq.{recipe_id}",
            headers=HEADERS
        )
        # Insert new steps
        for step in steps:
            step_data = {"recipe_id": recipe_id, "step_order": step["order"], "instruction": step["instruction"], "duration_min": step.get("duration_min")}
            requests.post(
                f"{SUPABASE_URL}/rest/v1/steps",
                headers=HEADERS,
                json=step_data
            )
    
    return True


def delete_recipe(recipe_id: int) -> bool:
    """Delete a recipe and its ingredients/steps (CASCADE)."""
    # Ingredients and steps will be deleted automatically due to CASCADE
    # (we need to add ON DELETE CASCADE to the foreign keys)
    params = {"id": f"eq.{recipe_id}"}
    r = requests.delete(
        f"{SUPABASE_URL}/rest/v1/recipes",
        headers=HEADERS,
        params=params
    )
    r.raise_for_status()
    return True


# ─── Ingredient operations ─────────────────────────────────────────────────────

def get_ingredients(recipe_id: int) -> List[Dict[str, Any]]:
    """Get all ingredients for a recipe."""
    params = {"recipe_id": f"eq.{recipe_id}", "select": "*"}
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/ingredients",
        headers=HEADERS,
        params=params
    )
    r.raise_for_status()
    return r.json()


# ─── Step operations ────────────────────────────────────────────────────────────

def get_steps(recipe_id: int) -> List[Dict[str, Any]]:
    """Get all steps for a recipe, ordered by step_order."""
    params = {"recipe_id": f"eq.{recipe_id}", "select": "*", "order": "step_order"}
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/steps",
        headers=HEADERS,
        params=params
    )
    r.raise_for_status()
    return r.json()


# ─── MealPlan operations ───────────────────────────────────────────────────────

def get_mealplans(start_date: str = None, end_date: str = None) -> List[Dict[str, Any]]:
    """Get meal plans, optionally filtered by date range."""
    params = {"select": "*", "order": "date"}
    if start_date:
        params["date"] = f"gte.{start_date}"
    if end_date:
        params["date"] = f"lte.{end_date}"
    
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/mealplans",
        headers=HEADERS,
        params=params
    )
    r.raise_for_status()
    return r.json()


def create_mealplan(mealplan_data: Dict[str, Any]) -> int:
    """Create a new meal plan."""
    r = requests.post(
        f"{SUPABASE_URL}/rest/v1/mealplans",
        headers=HEADERS,
        json=mealplan_data
    )
    r.raise_for_status()
    new_plan = r.json()
    return new_plan[0]["id"] if isinstance(new_plan, list) else new_plan["id"]


def update_mealplan(mealplan_id: int, mealplan_data: Dict[str, Any]) -> bool:
    """Update a meal plan."""
    params = {"id": f"eq.{mealplan_id}"}
    r = requests.patch(
        f"{SUPABASE_URL}/rest/v1/mealplans",
        headers=HEADERS,
        params=params,
        json=mealplan_data
    )
    r.raise_for_status()
    return True


def delete_mealplan(mealplan_id: int) -> bool:
    """Delete a meal plan."""
    params = {"id": f"eq.{mealplan_id}"}
    r = requests.delete(
        f"{SUPABASE_URL}/rest/v1/mealplans",
        headers=HEADERS,
        params=params
    )
    r.raise_for_status()
    return True


def init_db():
    """Initialize database tables (no-op since we use Supabase managed database)."""
    pass
