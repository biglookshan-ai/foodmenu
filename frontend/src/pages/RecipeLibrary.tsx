import { useState, useEffect } from 'react';
import { Search, Plus, Link as LinkIcon, Image, Video, ChefHat, Loader2, Trash2, CalendarPlus, Edit3, Lightbulb, Clock, Users } from 'lucide-react';
import RecipeDetailModal from '../components/RecipeDetailModal';
import RecipeEditModal from '../components/RecipeEditModal';
import AddToMealPlanModal from '../components/AddToMealPlanModal';
import { useAppContext } from '../context/AppContext';
import { Recipe, deleteRecipe } from '../utils/api';

const RecipeLibrary = () => {
  const [searchUrl, setSearchUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddToPlanModalOpen, setIsAddToPlanModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { recipes, fetchRecipes, importRecipe, setRecipes, isLoading, error } = useAppContext();

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const handleImport = async () => {
    if (!searchUrl) return;

    const isValidUrl = (url: string) => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    };

    if (!isValidUrl(searchUrl)) {
      alert('请输入有效的网址');
      return;
    }

    const supportedSites = ['xiachufang.com', 'meishichina.com'];
    const isSupported = supportedSites.some(site => searchUrl.includes(site));

    if (!isSupported) {
      alert('目前仅支持：下厨房 (xiachufang.com) 和 美食天下 (meishichina.com)');
      return;
    }

    setImporting(true);
    try {
      await importRecipe(searchUrl);
      setSearchUrl('');
      alert('菜谱导入成功！');
    } catch (err) {
      console.error('Import failed:', err);
      alert('导入失败，请检查网址或稍后重试');
    } finally {
      setImporting(false);
    }
  };

  const handleViewDetails = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedRecipe(null);
  };

  const handleEdit = (recipe: Recipe, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedRecipe(recipe);
    setIsEditModalOpen(true);
  };

  const handleAddToPlan = (recipe: Recipe, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedRecipe(recipe);
    setIsAddToPlanModalOpen(true);
  };

  const handleDelete = async (recipe: Recipe, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm(`确定要删除"${recipe.name}"吗？此操作不可恢复。`)) {
      return;
    }

    setDeletingId(recipe.id);
    try {
      await deleteRecipe(recipe.id);
      setRecipes(recipes.filter((r) => r.id !== recipe.id));
    } catch (err) {
      console.error('Failed to delete recipe:', err);
      alert('删除失败，请稍后重试');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRecipeUpdated = (updatedRecipe: Recipe) => {
    setRecipes(recipes.map((r) => (r.id === updatedRecipe.id ? updatedRecipe : r)));
  };

  const handleMealPlanAdded = () => {
    alert('已添加到用餐计划！');
  };

  return (
    <div className="space-y-6">
      {/* Import Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">导入菜谱</h2>

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="粘贴菜谱链接（支持下厨房、美食天下）..."
              value={searchUrl}
              onChange={(e) => setSearchUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleImport()}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            onClick={handleImport}
            disabled={!searchUrl || importing}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            {importing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                导入中...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                导入
              </>
            )}
          </button>
        </div>

        <div className="flex gap-4 mt-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <LinkIcon className="w-4 h-4" /> 网页链接
          </span>
          <span className="flex items-center gap-1">
            <Image className="w-4 h-4" /> 图片识别
          </span>
          <span className="flex items-center gap-1">
            <Video className="w-4 h-4" /> 视频识别
          </span>
        </div>
      </div>

      {/* Recipe List Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">我的菜谱</h2>
          <span className="text-sm text-gray-500">
            共 {recipes.length} 个菜谱
          </span>
        </div>

        {isLoading && recipes.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="ml-3 text-gray-500">加载中...</span>
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <ChefHat className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>暂无菜谱，导入一个开始吧</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onViewDetails={handleViewDetails}
                onEdit={handleEdit}
                onAddToPlan={handleAddToPlan}
                onDelete={handleDelete}
                isDeleting={deletingId === recipe.id}
              />
            ))}
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Modals */}
      <RecipeDetailModal
        recipe={selectedRecipe}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
      />

      <RecipeEditModal
        recipe={selectedRecipe}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleRecipeUpdated}
      />

      <AddToMealPlanModal
        recipe={selectedRecipe}
        isOpen={isAddToPlanModalOpen}
        onClose={() => setIsAddToPlanModalOpen(false)}
        onSuccess={handleMealPlanAdded}
      />
    </div>
  );
};

// Recipe Card Component with new layout
interface RecipeCardProps {
  recipe: Recipe;
  onViewDetails: (recipe: Recipe) => void;
  onEdit: (recipe: Recipe, e?: React.MouseEvent) => void;
  onAddToPlan: (recipe: Recipe, e?: React.MouseEvent) => void;
  onDelete: (recipe: Recipe, e?: React.MouseEvent) => void;
  isDeleting: boolean;
}

const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  onViewDetails,
  onEdit,
  onAddToPlan,
  onDelete,
  isDeleting,
}) => {
  const steps = recipe.steps || [];
  const ingredients = recipe.ingredients || [];
  const previewSteps = steps.slice(0, 3);

  return (
    <div
      onClick={() => onViewDetails(recipe)}
      className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer bg-white"
    >
      {/* Top: Image + Name/Action buttons */}
      <div className="relative h-40 bg-gray-100">
        {recipe.main_image ? (
          <img
            src={recipe.main_image}
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ChefHat className="w-12 h-12 text-gray-300" />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        
        {/* Name and Action buttons overlay */}
        <div className="absolute top-0 left-0 right-0 p-3 flex items-start justify-between">
          <h3 className="font-bold text-white text-lg drop-shadow-md line-clamp-1 flex-1 mr-3">
            {recipe.name}
          </h3>
          <div className="flex gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => onAddToPlan(recipe, e)}
              className="p-2 bg-white/90 hover:bg-white rounded-full shadow transition-colors"
              title="加入计划"
            >
              <CalendarPlus className="w-4 h-4 text-primary" />
            </button>
            <button
              onClick={(e) => onDelete(recipe, e)}
              disabled={isDeleting}
              className="p-2 bg-white/90 hover:bg-red-50 rounded-full shadow transition-colors disabled:opacity-50"
              title="删除"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 text-red-500" />
              )}
            </button>
          </div>
        </div>

        {/* Calories badge */}
        {(recipe.nutrition_info?.calories || recipe.nutrition?.calories) && (
          <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1 shadow-sm">
            <span className="text-xs font-medium text-gray-700">
              {recipe.nutrition_info?.calories || recipe.nutrition?.calories} 千卡
            </span>
          </div>
        )}
      </div>

      {/* Middle: Steps (left) + Ingredients (right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
        {/* Left: Steps preview */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-semibold text-gray-700">步骤预览</h4>
          </div>
          {previewSteps.length > 0 ? (
            <div className="space-y-2">
              {previewSteps.map((step, index) => (
                <div key={index} className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                    {step.order || index + 1}
                  </span>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {step.instruction}
                  </p>
                </div>
              ))}
              {steps.length > 3 && (
                <p className="text-xs text-gray-400 pl-7">+ 还有 {steps.length - 3} 个步骤</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">暂无步骤信息</p>
          )}

          {/* Description */}
          {recipe.description && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-sm text-gray-500 line-clamp-2">{recipe.description}</p>
            </div>
          )}
        </div>

        {/* Right: Ingredients */}
        <div className="p-4 bg-gray-50/50">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-semibold text-gray-700">食材清单</h4>
          </div>
          {ingredients.length > 0 ? (
            <div className="space-y-1.5">
              {ingredients.map((ing, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/50 flex-shrink-0" />
                  <span className="text-gray-600">
                    {ing.amount} {ing.unit} {ing.name}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">暂无食材信息</p>
          )}
        </div>
      </div>

      {/* Bottom: AI Suggestions + Edit button */}
      <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border-t border-amber-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-700 truncate">
            AI建议功能待配置
          </p>
        </div>
        <button
          onClick={(e) => onEdit(recipe, e)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 hover:text-primary transition-colors flex-shrink-0"
        >
          <Edit3 className="w-3.5 h-3.5" />
          编辑
        </button>
      </div>
    </div>
  );
};

export default RecipeLibrary;
