import axios from 'axios';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
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

// API Functions
export const getRecipes = async (): Promise<Recipe[]> => {
  const response = await api.get('/api/recipes');
  return response.data;
};

export const importRecipeFromUrl = async (url: string): Promise<Recipe> => {
  const response = await api.post('/api/recipes/import-from-url', { url });
  return response.data;
};

export const getMealPlans = async (startDate?: string, endDate?: string): Promise<MealPlan[]> => {
  const params: Record<string, string> = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  const response = await api.get('/api/mealplans', { params });
  return response.data;
};

export const updateMealPlan = async (id: number, data: Partial<MealPlan>): Promise<MealPlan> => {
  const response = await api.patch(`/api/mealplans/${id}`, data);
  return response.data;
};

export const assignRecipeToMealPlan = async (mealPlanId: number, recipeId: number): Promise<MealPlan> => {
  const response = await api.patch(`/api/mealplans/${mealPlanId}`, { recipe_id: recipeId });
  return response.data;
};

export const getNutrition = async (recipeId?: number): Promise<NutritionInfo> => {
  const endpoint = recipeId ? `/api/nutrition/${recipeId}` : '/api/nutrition';
  const response = await api.get(endpoint);
  return response.data;
};

export const getRecipeById = async (id: number): Promise<Recipe> => {
  const response = await api.get(`/api/recipes/${id}`);
  return response.data;
};

export const deleteRecipe = async (id: number): Promise<void> => {
  await api.delete(`/api/recipes/${id}`);
};

export const updateRecipe = async (id: number, data: Partial<Recipe>): Promise<Recipe> => {
  const response = await api.patch(`/api/recipes/${id}`, data);
  return response.data;
};

export const createMealPlan = async (data: { date: string; meal_type: string; recipe_id: number }): Promise<MealPlan> => {
  const response = await api.post('/api/mealplans/', data);
  return response.data;
};

export default api;
