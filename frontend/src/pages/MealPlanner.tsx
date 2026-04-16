import { useState, useEffect } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { ChevronLeft, ChevronRight, Check, Plus, X, Loader2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { MealPlan, Recipe, updateMealPlan, assignRecipeToMealPlan } from '../utils/api';

const meals = ['breakfast', 'lunch', 'dinner'] as const;
const mealLabels: Record<string, string> = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐' };
const mealColors: Record<string, string> = {
  breakfast: 'from-orange-400 to-yellow-400',
  lunch: 'from-green-400 to-emerald-400',
  dinner: 'from-blue-400 to-indigo-400',
};

const MealPlanner = () => {
  const [weekStart, setWeekStart] = useState<Dayjs>(dayjs().startOf('week'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ day: Dayjs; meal: string } | null>(null);
  const { recipes, mealPlans, fetchMealPlans, updateMealPlanInState, fetchRecipes } = useAppContext();

  const days = Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day'));

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  useEffect(() => {
    const loadMealPlans = async () => {
      setLoading(true);
      setError(null);
      try {
        const startDate = weekStart.format('YYYY-MM-DD');
        const endDate = weekStart.add(6, 'day').format('YYYY-MM-DD');
        await fetchMealPlans(startDate, endDate);
      } catch (err) {
        setError('Failed to load meal plans');
      } finally {
        setLoading(false);
      }
    };
    loadMealPlans();
  }, [weekStart, fetchMealPlans]);

  const goToPrevWeek = () => setWeekStart(weekStart.subtract(7, 'day'));
  const goToNextWeek = () => setWeekStart(weekStart.add(7, 'day'));
  const goToToday = () => setWeekStart(dayjs().startOf('week'));

  const getMealPlan = (day: Dayjs, meal: string): MealPlan | undefined => {
    const dateStr = day.format('YYYY-MM-DD');
    return mealPlans.find(
      (mp) => mp.date === dateStr && mp.meal_type === meal
    );
  };

  const handleToggleComplete = async (mealPlan: MealPlan) => {
    try {
      const updated = await updateMealPlan(mealPlan.id, { completed: !mealPlan.completed });
      updateMealPlanInState(mealPlan.id, { completed: updated.completed });
    } catch (err) {
      console.error('Failed to update meal plan:', err);
      setError('更新失败');
    }
  };

  const handleSlotClick = (day: Dayjs, meal: string) => {
    const existingPlan = getMealPlan(day, meal);
    if (existingPlan) {
      // If already has a recipe, show options
      setSelectedSlot({ day, meal });
    } else {
      // Create new meal plan slot
      setSelectedSlot({ day, meal });
    }
  };

  const handleAssignRecipe = async (recipe: Recipe) => {
    if (!selectedSlot) return;

    const existingPlan = getMealPlan(selectedSlot.day, selectedSlot.meal);
    if (existingPlan) {
      try {
        const updated = await assignRecipeToMealPlan(existingPlan.id, recipe.id);
        updateMealPlanInState(existingPlan.id, { recipe_id: recipe.id, recipe });
      } catch (err) {
        console.error('Failed to assign recipe:', err);
        setError('分配菜谱失败');
      }
    }
    setSelectedSlot(null);
  };

  const handleRemoveRecipe = async (mealPlan: MealPlan) => {
    try {
      const updated = await updateMealPlan(mealPlan.id, { recipe_id: null });
      updateMealPlanInState(mealPlan.id, { recipe_id: null, recipe: undefined });
    } catch (err) {
      console.error('Failed to remove recipe:', err);
      setError('移除菜谱失败');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">执行中心</h2>
          <button
            onClick={goToToday}
            className="text-sm text-primary hover:underline"
          >
            今天
          </button>
        </div>

        <div className="flex items-center justify-between">
          <button onClick={goToPrevWeek} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-medium text-gray-600">
            {weekStart.format('MM/DD')} - {weekStart.add(6, 'day').format('MM/DD')}
          </span>
          <button onClick={goToNextWeek} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 mt-4">
          {days.map((day) => (
            <div key={day.format('YYYY-MM-DD')} className="text-center">
              <div className="font-medium text-gray-600">
                {day.format('ddd')}
              </div>
              <div className={`text-lg font-bold ${
                day.isSame(dayjs(), 'day') ? 'text-primary' : 'text-gray-800'
              }`}>
                {day.format('D')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="ml-3 text-gray-500">加载中...</span>
        </div>
      )}

      {/* Meal Planner Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {days.map((day) => (
          <div key={day.format('YYYY-MM-DD')} className="bg-white rounded-xl shadow-sm p-4">
            <div className="font-bold text-gray-800 mb-3 text-center text-sm">
              {day.format('MM/DD')} {day.format('ddd')}
            </div>
            <div className="space-y-3">
              {meals.map((meal) => {
                const mealPlan = getMealPlan(day, meal);
                const isCompleted = mealPlan?.completed;
                const hasRecipe = !!mealPlan?.recipe;

                return (
                  <div
                    key={meal}
                    className={`border-2 rounded-lg p-3 transition-all cursor-pointer hover:border-primary/50 ${
                      isCompleted ? 'border-green-400 bg-green-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-medium bg-gradient-to-r ${mealColors[meal]} text-white px-2 py-0.5 rounded`}>
                        {mealLabels[meal]}
                      </span>
                      {isCompleted && (
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>

                    {hasRecipe && mealPlan?.recipe ? (
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-800 truncate">
                          {mealPlan.recipe.name}
                        </div>
                        {mealPlan.recipe.nutrition_info?.calories && (
                          <div className="text-xs text-gray-500">
                            {mealPlan.recipe.nutrition_info.calories} 千卡
                          </div>
                        )}
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleComplete(mealPlan);
                            }}
                            className={`flex-1 py-1 rounded text-xs font-medium transition-colors ${
                              isCompleted
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {isCompleted ? '已完成' : '完成'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveRecipe(mealPlan);
                            }}
                            className="px-2 py-1 bg-red-50 text-red-500 rounded hover:bg-red-100 text-xs"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSlotClick(day, meal)}
                        className="w-full py-2 text-sm text-gray-400 hover:text-primary hover:bg-gray-50 rounded transition-colors flex items-center justify-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        添加
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Recipe Selection Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedSlot(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">
                选择菜谱
              </h3>
              <button
                onClick={() => setSelectedSlot(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {recipes.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>暂无菜谱，请先在菜谱库导入</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recipes.map((recipe) => (
                    <button
                      key={recipe.id}
                      onClick={() => handleAssignRecipe(recipe)}
                      className="w-full p-3 text-left border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {recipe.main_image ? (
                          <img
                            src={recipe.main_image}
                            alt={recipe.name}
                            className="w-12 h-12 rounded object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center">
                            <span className="text-gray-400 text-xs">无图</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-800 truncate">{recipe.name}</div>
                          {recipe.nutrition_info?.calories && (
                            <div className="text-xs text-gray-500">
                              {recipe.nutrition_info.calories} 千卡
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealPlanner;
