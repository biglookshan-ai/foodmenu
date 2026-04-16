import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Recipe, MealPlan, User, getRecipes, getMealPlans, importRecipeFromUrl as apiImportRecipe } from '../utils/api';

interface AppState {
  recipes: Recipe[];
  mealPlans: MealPlan[];
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
}

interface AppContextType extends AppState {
  setRecipes: (recipes: Recipe[]) => void;
  addRecipe: (recipe: Recipe) => void;
  setMealPlans: (mealPlans: MealPlan[]) => void;
  updateMealPlanInState: (id: number, updates: Partial<MealPlan>) => void;
  setCurrentUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchRecipes: () => Promise<void>;
  fetchMealPlans: (startDate?: string, endDate?: string) => Promise<void>;
  importRecipe: (url: string) => Promise<Recipe>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRecipes();
      setRecipes(data);
    } catch (err) {
      setError('Failed to fetch recipes');
      console.error('Error fetching recipes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMealPlans = useCallback(async (startDate?: string, endDate?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMealPlans(startDate, endDate);
      setMealPlans(data);
    } catch (err) {
      setError('Failed to fetch meal plans');
      console.error('Error fetching meal plans:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addRecipe = useCallback((recipe: Recipe) => {
    setRecipes(prev => [recipe, ...prev]);
  }, []);

  const importRecipe = useCallback(async (url: string): Promise<Recipe> => {
    setLoading(true);
    setError(null);
    try {
      const recipe = await apiImportRecipe(url);
      addRecipe(recipe);
      return recipe;
    } catch (err) {
      setError('Failed to import recipe');
      console.error('Error importing recipe:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addRecipe]);

  const updateMealPlanInState = useCallback((id: number, updates: Partial<MealPlan>) => {
    setMealPlans(prev =>
      prev.map(plan => (plan.id === id ? { ...plan, ...updates } : plan))
    );
  }, []);

  const value: AppContextType = {
    recipes,
    mealPlans,
    currentUser,
    isLoading,
    error,
    setRecipes,
    addRecipe,
    setMealPlans,
    updateMealPlanInState,
    setCurrentUser,
    setLoading,
    setError,
    fetchRecipes,
    fetchMealPlans,
    importRecipe,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
