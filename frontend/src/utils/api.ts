import axios from 'axios';

// Supabase configuration - direct API calls
const SUPABASE_URL = 'https://uvfdmdhepemhospjvrsy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2ZmRtZGhlcGVtaG9zcGp2cnN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNjA0MTMsImV4cCI6MjA5MTkzNjQxM30.0X_9cvSXZGoAn3XVvQZz1cbee7o9f952x20Dkp_e_Uc';

const supabaseClient = axios.create({
  baseURL: `${SUPABASE_URL}/rest/v1`,
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Prefer': 'return=representation'
  },
});

// Types
export interface Ingredient {
  id?: number;
  name: string;
  amount?: string;
  unit?: string;
}

export interface Step {
  id?: number;
  order: number;
  instruction: string;
  duration_min?: number;
}

export interface NutritionInfo {
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  fiber?: number;
  sodium?: number;
  sugar?: number;
}

export interface Recipe {
  id: number;
  name: string;
  description?: string;
  main_image?: string;
  ingredients?: Ingredient[];
  steps?: Step[];
  nutrition_info?: NutritionInfo;
  nutrition?: NutritionInfo;
  source_url?: string;
  source_type?: string;
  created_at?: string;
}

export interface MealPlan {
  id: number;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner';
  recipe_id?: number;
  recipe?: Recipe;
  completed: boolean;
  user_id?: number;
}

export interface User {
  id: number;
  name: string;
  email?: string;
}

// API Functions - direct Supabase REST API calls
export const getRecipes = async (): Promise<Recipe[]> => {
  const response = await supabaseClient.get('/recipes?select=*');
  // Fetch ingredients and steps for each recipe
  const recipes = response.data;
  for (const recipe of recipes) {
    const [ingResp, stepResp] = await Promise.all([
      supabaseClient.get(`/ingredients?recipe_id=eq.${recipe.id}&select=*`),
      supabaseClient.get(`/steps?recipe_id=eq.${recipe.id}&select=*&order=step_order`)
    ]);
    recipe.ingredients = ingResp.data;
    recipe.steps = stepResp.data;
  }
  return recipes;
};

const SCRAPE_API_URL = ''; // Empty means same origin (Vercel)

interface ScrapeResult {
  name: string;
  description?: string;
  main_image?: string;
  source_type: string;
  source_url: string;
  ingredients: { name: string; amount?: string }[];
  steps: { order: number; instruction: string; image?: string }[];
}

export const importRecipeFromUrl = async (url: string): Promise<Recipe> => {
  // Step 1: Call scraper API
  const scrapeResp = await fetch(`${SCRAPE_API_URL}/api/scrape`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  
  if (!scrapeResp.ok) {
    const err = await scrapeResp.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || 'Scraping failed');
  }
  
  const scraped: ScrapeResult = await scrapeResp.json();
  
  // Step 2: Create recipe in Supabase
  const recipeData = {
    name: scraped.name,
    description: scraped.description || '',
    main_image: scraped.main_image || '',
    source_type: scraped.source_type,
    source_url: scraped.source_url,
    nutrition: null
  };
  
  // Insert recipe
  const insertResp = await supabaseClient.post('/recipes', recipeData);
  const newRecipe = insertResp.data?.[0] || insertResp.data;
  const newId = newRecipe.id;
  
  // Insert ingredients
  for (const ing of scraped.ingredients || []) {
    await supabaseClient.post('/ingredients', {
      recipe_id: newId,
      name: ing.name,
      amount: ing.amount || ''
    });
  }
  
  // Insert steps
  for (const step of scraped.steps || []) {
    await supabaseClient.post('/steps', {
      recipe_id: newId,
      step_order: step.order,
      instruction: step.instruction
    });
  }
  
  // Return the created recipe
  return getRecipeById(newId);
};

export const getMealPlans = async (startDate?: string, endDate?: string): Promise<MealPlan[]> => {
  const params: Record<string, string> = {};
  if (startDate) params['date'] = `gte.${startDate}`;
  if (endDate) params['date'] = `lte.${endDate}`;
  params['select'] = '*';
  params['order'] = 'date';
  
  const response = await supabaseClient.get('/mealplans', { params });
  return response.data;
};

export const updateMealPlan = async (id: number, data: Partial<MealPlan>): Promise<MealPlan> => {
  const response = await supabaseClient.patch(`/mealplans?id=eq.${id}`, data);
  return response.data;
};

export const assignRecipeToMealPlan = async (mealPlanId: number, recipeId: number): Promise<MealPlan> => {
  const response = await supabaseClient.patch(`/mealplans?id=eq.${mealPlanId}`, { recipe_id: recipeId });
  return response.data;
};

export const getNutrition = async (_recipeId?: number): Promise<NutritionInfo> => {
  // Placeholder - would need backend for real nutrition calculation
  return { calories: 0, protein: 0, fat: 0, carbs: 0 };
};

export const getRecipeById = async (id: number): Promise<Recipe> => {
  const response = await supabaseClient.get(`/recipes?id=eq.${id}&select=*`);
  const recipe = response.data[0];
  if (recipe) {
    const [ingResp, stepResp] = await Promise.all([
      supabaseClient.get(`/ingredients?recipe_id=eq.${recipe.id}&select=*`),
      supabaseClient.get(`/steps?recipe_id=eq.${recipe.id}&select=*&order=step_order`)
    ]);
    recipe.ingredients = ingResp.data;
    recipe.steps = stepResp.data;
  }
  return recipe;
};

export const deleteRecipe = async (id: number): Promise<void> => {
  await supabaseClient.delete(`/recipes?id=eq.${id}`);
};

export const updateRecipe = async (id: number, data: Partial<Recipe>): Promise<Recipe> => {
  // Extract nested data
  const { ingredients, steps, ...recipeData } = data;
  
  // Update recipe
  if (Object.keys(recipeData).length > 0) {
    await supabaseClient.patch(`/recipes?id=eq.${id}`, recipeData);
  }
  
  // Update ingredients if provided
  if (ingredients !== undefined) {
    await supabaseClient.delete(`/ingredients?recipe_id=eq.${id}`);
    for (const ing of ingredients) {
      await supabaseClient.post('/ingredients', { recipe_id: id, name: ing.name, amount: ing.amount, unit: ing.unit });
    }
  }
  
  // Update steps if provided
  if (steps !== undefined) {
    await supabaseClient.delete(`/steps?recipe_id=eq.${id}`);
    for (const step of steps) {
      await supabaseClient.post('/steps', { recipe_id: id, step_order: step.order, instruction: step.instruction, duration_min: step.duration_min });
    }
  }
  
  return getRecipeById(id);
};

export const createMealPlan = async (data: { date: string; meal_type: string; recipe_id: number }): Promise<MealPlan> => {
  const response = await supabaseClient.post('/mealplans', { ...data, completed: false });
  return response.data;
};

export default supabaseClient;
// Updated: direct Supabase REST API (no backend server needed)
