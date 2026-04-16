import { Clock, Flame, Zap } from 'lucide-react'

export interface Recipe {
  id: string
  name: string
  description?: string
  mainImage?: string
  cookingTime?: number // in minutes
  calories?: number
  protein?: number
  fat?: number
  carbs?: number
  tags?: string[]
}

interface RecipeCardProps {
  recipe: Recipe
  onClick?: (recipe: Recipe) => void
  compact?: boolean
  selected?: boolean
}

const RecipeCard = ({ recipe, onClick, compact = false, selected = false }: RecipeCardProps) => {
  const {
    name,
    description,
    mainImage,
    cookingTime,
    calories,
    protein,
  } = recipe

  const placeholderImage = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop'

  if (compact) {
    return (
      <button
        onClick={() => onClick?.(recipe)}
        className={`
          w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200
          text-left hover:shadow-md hover:-translate-y-0.5
          ${selected ? 'border-primary bg-primary/5 shadow-md' : 'border-gray-100 bg-white hover:border-primary/30'}
        `}
      >
        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
          <img
            src={mainImage || placeholderImage}
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 text-sm truncate">{name}</h3>
          {cookingTime && (
            <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
              <Clock className="w-3 h-3" />
              <span>{cookingTime}分钟</span>
            </div>
          )}
        </div>
        {selected && (
          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </button>
    )
  }

  return (
    <div
      onClick={() => onClick?.(recipe)}
      className={`
        group bg-white rounded-2xl shadow-sm overflow-hidden cursor-pointer
        transition-all duration-300 hover:shadow-xl hover:-translate-y-1
        ${selected ? 'ring-2 ring-primary ring-offset-2' : ''}
      `}
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={mainImage || placeholderImage}
          alt={name}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Cooking time badge */}
        {cookingTime && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5 shadow-sm">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-gray-700">{cookingTime}分钟</span>
          </div>
        )}

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="absolute bottom-3 left-3 flex gap-1.5">
            {recipe.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="bg-primary/80 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-gray-800 text-lg mb-1.5 group-hover:text-primary transition-colors line-clamp-1">
          {name}
        </h3>
        
        {description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-3 leading-relaxed">
            {description}
          </p>
        )}

        {/* Nutrition summary */}
        {(calories || protein) && (
          <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
            {calories && (
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-semibold text-gray-700">{calories}</span>
                <span className="text-xs text-gray-400">千卡</span>
              </div>
            )}
            {protein && (
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-red-500" />
                <span className="text-sm font-semibold text-gray-700">{protein}g</span>
                <span className="text-xs text-gray-400">蛋白质</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default RecipeCard
