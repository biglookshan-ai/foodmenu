import React from 'react';
import { X, Clock, Flame, Users, ChefHat } from 'lucide-react';
import { Recipe } from '../utils/api';

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
}

const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({ recipe, isOpen, onClose }) => {
  if (!isOpen || !recipe) return null;

  const nutrition = recipe.nutrition_info;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/90 rounded-full hover:bg-white transition-colors shadow-md"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[90vh]">
          {/* Hero Image */}
          {recipe.main_image ? (
            <div className="relative h-64 md:h-80">
              <img
                src={recipe.main_image}
                alt={recipe.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <h2 className="text-2xl md:text-3xl font-bold text-white">{recipe.name}</h2>
              </div>
            </div>
          ) : (
            <div className="h-32 bg-gradient-to-r from-primary to-accent flex items-center justify-center">
              <ChefHat className="w-16 h-16 text-white/50" />
            </div>
          )}

          <div className="p-6 space-y-6">
            {/* Description */}
            {recipe.description && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">简介</h3>
                <p className="text-gray-600 leading-relaxed">{recipe.description}</p>
              </div>
            )}

            {/* Nutrition Info */}
            {nutrition && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-primary" />
                  营养信息
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {nutrition.calories !== undefined && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{nutrition.calories}</div>
                      <div className="text-xs text-gray-500">千卡</div>
                    </div>
                  )}
                  {nutrition.protein !== undefined && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{nutrition.protein}g</div>
                      <div className="text-xs text-gray-500">蛋白质</div>
                    </div>
                  )}
                  {nutrition.fat !== undefined && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-500">{nutrition.fat}g</div>
                      <div className="text-xs text-gray-500">脂肪</div>
                    </div>
                  )}
                  {nutrition.carbohydrates !== undefined && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-500">{nutrition.carbohydrates}g</div>
                      <div className="text-xs text-gray-500">碳水</div>
                    </div>
                  )}
                  {nutrition.fiber !== undefined && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{nutrition.fiber}g</div>
                      <div className="text-xs text-gray-500">膳食纤维</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Ingredients */}
            {recipe.ingredients && recipe.ingredients.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  食材清单
                </h3>
                <div className="flex flex-wrap gap-2">
                  {recipe.ingredients.map((ingredient, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {ingredient}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Steps */}
            {recipe.steps && recipe.steps.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  烹饪步骤
                </h3>
                <div className="space-y-4">
                  {recipe.steps.map((step, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <p className="text-gray-600 leading-relaxed pt-1">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Source URL */}
            {recipe.source_url && (
              <div className="pt-4 border-t border-gray-200">
                <a
                  href={recipe.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline text-sm"
                >
                  来源: {recipe.source_url}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetailModal;
