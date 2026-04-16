import { ChefHat, BookOpen, Calendar, BarChart3, Plus, Search, Image, Video } from 'lucide-react'
import Button from './Button'

type EmptyStateVariant = 'recipes' | 'planner' | 'nutrition' | 'search' | 'custom'

interface EmptyStateProps {
  variant?: EmptyStateVariant
  icon?: React.ReactNode
  title?: string
  message?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

const variantConfig: Record<EmptyStateVariant, { icon: React.ReactNode; title: string; message: string }> = {
  recipes: {
    icon: <ChefHat className="w-12 h-12" />,
    title: '暂无菜谱',
    message: '导入第一个菜谱，开始您的健康饮食之旅',
  },
  planner: {
    icon: <Calendar className="w-12 h-12" />,
    title: '本周暂无计划',
    message: '开始规划您的每日餐食吧',
  },
  nutrition: {
    icon: <BarChart3 className="w-12 h-12" />,
    title: '暂无营养数据',
    message: '记录餐食后即可查看营养报告',
  },
  search: {
    icon: <Search className="w-12 h-12" />,
    title: '没有找到相关结果',
    message: '尝试搜索其他关键词',
  },
  custom: {
    icon: <BookOpen className="w-12 h-12" />,
    title: '暂无内容',
    message: '这里还没有任何内容',
  },
}

const EmptyState = ({
  variant = 'custom',
  icon,
  title,
  message,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) => {
  const config = variantConfig[variant]

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      {/* Decorative background circle */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/5 rounded-full scale-150" />
        <div className="relative w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
          <div className="text-primary/60">
            {icon || config.icon}
          </div>
        </div>
      </div>

      <h3 className="text-xl font-bold text-gray-800 mb-2">
        {title || config.title}
      </h3>
      
      <p className="text-gray-500 max-w-sm leading-relaxed mb-6">
        {message || config.message}
      </p>

      {actionLabel && onAction && (
        <Button onClick={onAction} icon={<Plus className="w-5 h-5" />}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

export default EmptyState
