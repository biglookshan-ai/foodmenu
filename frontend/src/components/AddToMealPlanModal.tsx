import React, { useState } from 'react';
import { X, Calendar, Loader2 } from 'lucide-react';
import { Recipe, createMealPlan } from '../utils/api';

interface AddToMealPlanModalProps {
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const mealTypes = [
  { value: 'breakfast', label: '早餐' },
  { value: 'lunch', label: '午餐' },
  { value: 'dinner', label: '晚餐' },
];

const AddToMealPlanModal: React.FC<AddToMealPlanModalProps> = ({ recipe, isOpen, onClose, onSuccess }) => {
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [mealType, setMealType] = useState('lunch');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !recipe) return null;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await createMealPlan({
        date,
        meal_type: mealType,
        recipe_id: recipe.id,
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to add to meal plan:', err);
      alert('添加失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">加入用餐计划</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Recipe Info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            {recipe.main_image ? (
              <img
                src={recipe.main_image}
                alt={recipe.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                <span className="text-xl">🍽️</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 truncate">{recipe.name}</p>
              {recipe.nutrition_info?.calories && (
                <p className="text-xs text-gray-500">{recipe.nutrition_info.calories} 千卡</p>
              )}
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4" />
              选择日期
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Meal Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">用餐类型</label>
            <div className="grid grid-cols-3 gap-2">
              {mealTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setMealType(type.value)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    mealType === type.value
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-5 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={loading}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            确认添加
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddToMealPlanModal;
