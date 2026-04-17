"""
Vercel Serverless Function - FoodMenu API
Each route is handled by the same function using path routing.
"""
import os
import json
import requests
from urllib.parse import urlparse, parse_qs

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://uvfdmdhepemhospjvrsy.supabase.co")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2ZmRtZGhlcGVtaG9zcGp2cnN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjM2MDQxMywiZXhwIjoyMDkxOTM2NDEzfQ.Ocrpxwc8USooWXi_j6huvBkdlan3ZPdLFp0ukfjeiEY")

HEADERS = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

# ─── Database Helpers ─────────────────────────────────────────────────────────

def get_recipes(skip=0, limit=20):
    params = {"offset": skip, "limit": limit, "select": "*"}
    r = requests.get(f"{SUPABASE_URL}/rest/v1/recipes", headers=HEADERS, params=params)
    r.raise_for_status()
    recipes = r.json()
    for recipe in recipes:
        recipe["ingredients"] = get_ingredients(recipe["id"])
        recipe["steps"] = get_steps(recipe["id"])
    return recipes

def get_recipe(recipe_id):
    params = {"id": f"eq.{recipe_id}", "select": "*"}
    r = requests.get(f"{SUPABASE_URL}/rest/v1/recipes", headers=HEADERS, params=params)
    r.raise_for_status()
    recipes = r.json()
    if not recipes:
        return None
    recipe = recipes[0]
    recipe["ingredients"] = get_ingredients(recipe["id"])
    recipe["steps"] = get_steps(recipe["id"])
    return recipe

def create_recipe(recipe_data):
    ingredients = recipe_data.pop("ingredients", [])
    steps = recipe_data.pop("steps", [])
    
    r = requests.post(f"{SUPABASE_URL}/rest/v1/recipes", headers=HEADERS, json=recipe_data)
    r.raise_for_status()
    new_recipe = r.json()
    new_id = new_recipe[0]["id"] if isinstance(new_recipe, list) else new_recipe["id"]
    
    for ing in ingredients:
        ing_data = {"recipe_id": new_id, "name": ing["name"], "amount": ing.get("amount"), "unit": ing.get("unit")}
        requests.post(f"{SUPABASE_URL}/rest/v1/ingredients", headers=HEADERS, json=ing_data)
    
    for step in steps:
        step_data = {"recipe_id": new_id, "step_order": step["order"], "instruction": step["instruction"], "duration_min": step.get("duration_min")}
        requests.post(f"{SUPABASE_URL}/rest/v1/steps", headers=HEADERS, json=step_data)
    
    return new_id

def update_recipe(recipe_id, recipe_data):
    ingredients = recipe_data.pop("ingredients", None)
    steps = recipe_data.pop("steps", None)
    
    if recipe_data:
        params = {"id": f"eq.{recipe_id}"}
        r = requests.patch(f"{SUPABASE_URL}/rest/v1/recipes", headers=HEADERS, params=params, json=recipe_data)
        r.raise_for_status()
    
    if ingredients is not None:
        requests.delete(f"{SUPABASE_URL}/rest/v1/ingredients?recipe_id=eq.{recipe_id}", headers=HEADERS)
        for ing in ingredients:
            ing_data = {"recipe_id": recipe_id, "name": ing["name"], "amount": ing.get("amount"), "unit": ing.get("unit")}
            requests.post(f"{SUPABASE_URL}/rest/v1/ingredients", headers=HEADERS, json=ing_data)
    
    if steps is not None:
        requests.delete(f"{SUPABASE_URL}/rest/v1/steps?recipe_id=eq.{recipe_id}", headers=HEADERS)
        for step in steps:
            step_data = {"recipe_id": recipe_id, "step_order": step["order"], "instruction": step["instruction"], "duration_min": step.get("duration_min")}
            requests.post(f"{SUPABASE_URL}/rest/v1/steps", headers=HEADERS, json=step_data)
    
    return True

def delete_recipe(recipe_id):
    params = {"id": f"eq.{recipe_id}"}
    r = requests.delete(f"{SUPABASE_URL}/rest/v1/recipes", headers=HEADERS, params=params)
    r.raise_for_status()
    return True

def get_ingredients(recipe_id):
    params = {"recipe_id": f"eq.{recipe_id}", "select": "*"}
    r = requests.get(f"{SUPABASE_URL}/rest/v1/ingredients", headers=HEADERS, params=params)
    r.raise_for_status()
    return r.json()

def get_steps(recipe_id):
    params = {"recipe_id": f"eq.{recipe_id}", "select": "*", "order": "step_order"}
    r = requests.get(f"{SUPABASE_URL}/rest/v1/steps", headers=HEADERS, params=params)
    r.raise_for_status()
    return r.json()

def get_mealplans(start_date=None, end_date=None):
    params = {"select": "*", "order": "date"}
    if start_date:
        params["date"] = f"gte.{start_date}"
    if end_date:
        params["date"] = f"lte.{end_date}"
    r = requests.get(f"{SUPABASE_URL}/rest/v1/mealplans", headers=HEADERS, params=params)
    r.raise_for_status()
    return r.json()

def create_mealplan(mealplan_data):
    r = requests.post(f"{SUPABASE_URL}/rest/v1/mealplans", headers=HEADERS, json=mealplan_data)
    r.raise_for_status()
    new_plan = r.json()
    return new_plan[0]["id"] if isinstance(new_plan, list) else new_plan["id"]

def update_mealplan(mealplan_id, mealplan_data):
    params = {"id": f"eq.{mealplan_id}"}
    r = requests.patch(f"{SUPABASE_URL}/rest/v1/mealplans", headers=HEADERS, params=params, json=mealplan_data)
    r.raise_for_status()
    return True

# ─── Response Helper ─────────────────────────────────────────────────────────

def make_response(body, status_code=200, headers=None):
    response = {
        "statusCode": status_code,
        "body": json.dumps(body),
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        }
    }
    if headers:
        response["headers"].update(headers)
    return response

# ─── Main Handler ─────────────────────────────────────────────────────────────

def handle(request_data, context):
    """Vercel Python serverless function handler."""
    path = request_data.get("path", "/")
    method = request_data.get("method", "GET")
    query = request_data.get("query", {})
    
    # Parse path to extract route and recipe_id
    parsed = urlparse(path)
    path_parts = [p for p in parsed.path.split("/") if p]
    
    # CORS preflight
    if method == "OPTIONS":
        return make_response({}, 200)
    
    # Route: /api/health
    if path == "/api/health" or path == "/api/health/":
        return make_response({"status": "healthy"})
    
    # Route: /api/recipes
    if path == "/api/recipes" or path == "/api/recipes/":
        if method == "GET":
            skip = int(query.get("skip", ["0"])[0]) if query.get("skip") else 0
            limit = int(query.get("limit", ["20"])[0]) if query.get("limit") else 20
            recipes = get_recipes(skip=skip, limit=limit)
            return make_response(recipes)
        elif method == "POST":
            body = json.loads(request_data.get("body", "{}"))
            recipe_id = create_recipe(body)
            return make_response({"id": recipe_id, "message": "Recipe created"}, 201)
    
    # Route: /api/recipes/{id}
    if len(path_parts) == 3 and path_parts[0] == "api" and path_parts[1] == "recipes":
        try:
            recipe_id = int(path_parts[2])
        except ValueError:
            return make_response({"error": "Invalid recipe ID"}, 400)
        
        if method == "GET":
            recipe = get_recipe(recipe_id)
            if not recipe:
                return make_response({"error": "Recipe not found"}, 404)
            return make_response(recipe)
        elif method == "PATCH":
            body = json.loads(request_data.get("body", "{}"))
            update_recipe(recipe_id, body)
            recipe = get_recipe(recipe_id)
            return make_response(recipe)
        elif method == "DELETE":
            delete_recipe(recipe_id)
            return make_response({"message": "Recipe deleted"})
    
    # Route: /api/recipes/import-from-url
    if path == "/api/recipes/import-from-url" or path == "/api/recipes/import-from-url/":
        if method == "POST":
            return make_response({"error": "Import not yet implemented in serverless mode"}, 501)
    
    # Route: /api/mealplans
    if path == "/api/mealplans" or path == "/api/mealplans/":
        if method == "GET":
            start = query.get("start_date", [None])[0]
            end = query.get("end_date", [None])[0]
            plans = get_mealplans(start_date=start, end_date=end)
            return make_response(plans)
        elif method == "POST":
            body = json.loads(request_data.get("body", "{}"))
            plan_id = create_mealplan(body)
            return make_response({"id": plan_id}, 201)
    
    # Route: /api/mealplans/{id}
    if len(path_parts) == 3 and path_parts[0] == "api" and path_parts[1] == "mealplans":
        try:
            plan_id = int(path_parts[2])
        except ValueError:
            return make_response({"error": "Invalid mealplan ID"}, 400)
        
        if method == "PATCH":
            body = json.loads(request_data.get("body", "{}"))
            update_mealplan(plan_id, body)
            return make_response({"message": "Updated"})
        elif method == "DELETE":
            params = {"id": f"eq.{plan_id}"}
            requests.delete(f"{SUPABASE_URL}/rest/v1/mealplans", headers=HEADERS, params=params)
            return make_response({"message": "Deleted"})
    
    # Route: /api/nutrition
    if path == "/api/nutrition" or path == "/api/nutrition/":
        return make_response({
            "calories": 0, "protein": 0, "fat": 0, "carbs": 0,
            "source": "placeholder"
        })
    
    # 404 fallback
    return make_response({"error": "Not found"}, 404)
