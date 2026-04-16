import { useState } from 'react'
import { Search, Plus, Link as LinkIcon, Image, Video } from 'lucide-react'

const RecipeLibrary = () => {
  const [searchUrl, setSearchUrl] = useState('')
  const [recipes, setRecipes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const handleImport = async () => {
    if (!searchUrl) return
    setLoading(true)
    // TODO: Call backend API to import recipe from URL
    setTimeout(() => {
      setLoading(false)
      alert('菜谱导入功能开发中...')
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">导入菜谱</h2>
        
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="粘贴菜谱链接..."
              value={searchUrl}
              onChange={(e) => setSearchUrl(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            onClick={handleImport}
            disabled={!searchUrl || loading}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {loading ? '导入中...' : '导入'}
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

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">我的菜谱</h2>
        {recipes.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <ChefHat className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>暂无菜谱，导入一个开始吧</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {recipes.map((recipe) => (
              <div key={recipe.id} className="border rounded-lg overflow-hidden hover:shadow-md">
                {recipe.main_image && (
                  <img src={recipe.main_image} alt={recipe.name} className="w-full h-40 object-cover" />
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800">{recipe.name}</h3>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default RecipeLibrary
