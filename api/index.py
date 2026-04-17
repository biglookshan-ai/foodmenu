"""
Vercel Serverless Functions - Flask API for FoodMenu
"""
import os
import json
import requests
from flask import Flask, request, jsonify, Response
from datetime import datetime

app = Flask(__name__)

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

# ─── CORS Helper ─────────────────────────────────────────────────────────────

def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PATCH, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response

# ─── Routes ───────────────────────────────────────────────────────────────────

@app.route("/api/recipes/", methods=["GET", "OPTIONS"])
def list_recipes():
    if request.method == "OPTIONS":
        return add_cors_headers(Response())
    try:
        skip = int(request.args.get("skip", 0))
        limit = int(request.args.get("limit", 20))
        recipes = get_recipes(skip=skip, limit=limit)
        return add_cors_headers(jsonify(recipes))
    except Exception as e:
        return add_cors_headers(jsonify({"error": str(e)})), 500

@app.route("/api/recipes/<int:recipe_id>/", methods=["GET", "PATCH", "DELETE", "OPTIONS"])
def recipe_detail(recipe_id):
    if request.method == "OPTIONS":
        return add_cors_headers(Response())
    try:
        if request.method == "GET":
            recipe = get_recipe(recipe_id)
            if not recipe:
                return add_cors_headers(jsonify({"error": "Recipe not found"})), 404
            return add_cors_headers(jsonify(recipe))
        
        elif request.method == "PATCH":
            data = request.get_json()
            update_recipe(recipe_id, data)
            recipe = get_recipe(recipe_id)
            return add_cors_headers(jsonify(recipe))
        
        elif request.method == "DELETE":
            delete_recipe(recipe_id)
            return add_cors_headers(jsonify({"message": "Recipe deleted"}))
    except Exception as e:
        return add_cors_headers(jsonify({"error": str(e)})), 500

@app.route("/api/recipes/import-from-url/", methods=["POST", "OPTIONS"])
def import_recipe():
    if request.method == "OPTIONS":
        return add_cors_headers(Response())
    try:
        data = request.get_json()
        url = data.get("url")
        if not url:
            return add_cors_headers(jsonify({"error": "URL required"})), 400
        
        # Import from URL - for now, just return an error since scraper is not available
        # In production, you would call the scraper service here
        return add_cors_headers(jsonify({"error": "Import from URL not yet implemented in serverless mode"})), 501
        
    except Exception as e:
        return add_cors_headers(jsonify({"error": str(e)})), 500

@app.route("/api/mealplans/", methods=["GET", "POST", "OPTIONS"])
def mealplans():
    if request.method == "OPTIONS":
        return add_cors_headers(Response())
    try:
        if request.method == "GET":
            start = request.args.get("start_date")
            end = request.args.get("end_date")
            plans = get_mealplans(start_date=start, end_date=end)
            return add_cors_headers(jsonify(plans))
        
        elif request.method == "POST":
            data = request.get_json()
            plan_id = create_mealplan(data)
            return add_cors_headers(jsonify({"id": plan_id})), 201
    except Exception as e:
        return add_cors_headers(jsonify({"error": str(e)})), 500

@app.route("/api/mealplans/<int:plan_id>/", methods=["PATCH", "DELETE", "OPTIONS"])
def mealplan_detail(plan_id):
    if request.method == "OPTIONS":
        return add_cors_headers(Response())
    try:
        if request.method == "PATCH":
            data = request.get_json()
            update_mealplan(plan_id, data)
            return add_cors_headers(jsonify({"message": "Updated"}))
        
        elif request.method == "DELETE":
            params = {"id": f"eq.{plan_id}"}
            r = requests.delete(f"{SUPABASE_URL}/rest/v1/mealplans", headers=HEADERS, params=params)
            return add_cors_headers(jsonify({"message": "Deleted"}))
    except Exception as e:
        return add_cors_headers(jsonify({"error": str(e)})), 500

@app.route("/api/nutrition/", methods=["GET", "OPTIONS"])
@app.route("/api/nutrition/<int:recipe_id>/", methods=["GET", "OPTIONS"])
def nutrition(recipe_id=None):
    if request.method == "OPTIONS":
        return add_cors_headers(Response())
    # Return placeholder nutrition data
    return add_cors_headers(jsonify({
        "calories": 0,
        "protein": 0,
        "fat": 0,
        "carbs": 0,
        "source": "placeholder"
    }))

@app.route("/api/health/", methods=["GET", "OPTIONS"])
def health():
    if request.method == "OPTIONS":
        return add_cors_headers(Response())
    return add_cors_headers(jsonify({"status": "healthy"}))

# Vercel handler
def handle(request_data, context):
    return app(request_data, context)
