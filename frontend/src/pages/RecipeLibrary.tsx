import { useState, useEffect } from 'react';
import { Search, Plus, Link as LinkIcon, Image, Video, ChefHat, Loader2 } from 'lucide-react';
import RecipeDetailModal from '../components/RecipeDetailModal';
import { useAppContext } from '../context/AppContext';
import { Recipe } from '../utils/api';

const RecipeLibrary = () => {
  const [searchUrl, setSearchUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { recipes, fetchRecipes, importRecipe, isLoading, error } = useAppContext();

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const handleImport = async () => {
    if (!searchUrl) return;

    // Validate URL format
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

    // Check if it's a supported site
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
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRecipe(null);
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white"
              >
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
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-1 truncate">{recipe.name}</h3>
                  {recipe.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                      {recipe.description}
                    </p>
                  )}
                  {(recipe.nutrition_info?.calories || recipe.nutrition?.calories) && (
                    <div className="text-xs text-primary mb-3">
                      {recipe.nutrition_info?.calories || recipe.nutrition?.calories} 千卡
                    </div>
                  )}
                  <button
                    onClick={() => handleViewDetails(recipe)}
                    className="w-full py-2 px-4 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium"
                  >
                    查看详情
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Recipe Detail Modal */}
      <RecipeDetailModal
        recipe={selectedRecipe}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default RecipeLibrary;
