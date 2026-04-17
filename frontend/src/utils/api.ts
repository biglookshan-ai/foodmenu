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

export const importRecipeFromUrl = async (url: string): Promise<Recipe> => {
  // TODO: Implement with scraping service or Supabase Edge Function
  throw new Error('Import from URL not yet implemented. Please add recipes manually.');
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

export const getNutrition = async (recipeId?: number): Promise<NutritionInfo> => {
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
