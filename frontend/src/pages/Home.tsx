import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChefHat, Plus, Calendar, TrendingUp, ArrowRight, Sparkles } from 'lucide-react'
import Button from '../components/Button'

const Home = () => {
  const navigate = useNavigate()
  const [loading] = useState(false)

  // Mock data - in real app would come from store/API
  const stats = {
    totalRecipes: 24,
    mealsThisWeek: 12,
    avgCalories: 1850,
    streakDays: 7,
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-green-400 rounded-3xl p-8 md:p-12 text-white">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
              <ChefHat className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">健康菜谱</h1>
              <p className="text-white/80 text-sm mt-1">科学搭配每一餐</p>
            </div>
          </div>
          <p className="text-white/90 text-lg max-w-xl leading-relaxed">
            智能菜谱管理，轻松规划每日营养摄入，让健康饮食成为习惯。
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Button
              variant="secondary"
              onClick={() => navigate('/recipes')}
              className="bg-white text-primary hover:bg-white/90 shadow-lg"
              icon={<Plus className="w-5 h-5" />}
            >
              添加菜谱
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/planner')}
              className="border-white/40 text-white hover:bg-white/10"
              icon={<Calendar className="w-5 h-5" />}
            >
              查看餐计划
            </Button>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -right-8 -top-8 w-48 h-48 bg-white/10 rounded-full" />
        <div className="absolute -right-4 bottom-0 w-32 h-32 bg-white/5 rounded-full" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<ChefHat className="w-6 h-6 text-primary" />}
          label="我的菜谱"
          value={stats.totalRecipes}
          suffix="个"
          color="bg-green-50"
        />
        <StatCard
          icon={<Calendar className="w-6 h-6 text-secondary" />}
          label="本周已计划"
          value={stats.mealsThisWeek}
          suffix="餐"
          color="bg-orange-50"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6 text-accent" />}
          label="日均热量"
          value={stats.avgCalories}
          suffix="千卡"
          color="bg-blue-50"
        />
        <StatCard
          icon={<Sparkles className="w-6 h-6 text-yellow-500" />}
          label="连续坚持"
          value={stats.streakDays}
          suffix="天"
          color="bg-yellow-50"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ActionCard
          title="导入新菜谱"
          description="从网页链接或图片识别菜谱"
          icon={<Plus className="w-6 h-6" />}
          gradient="from-green-400 to-primary"
          onClick={() => navigate('/recipes')}
        />
        <ActionCard
          title="查看营养报告"
          description="分析本周营养摄入趋势"
          icon={<TrendingUp className="w-6 h-6" />}
          gradient="from-orange-400 to-secondary"
          onClick={() => navigate('/nutrition')}
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">最近活动</h2>
          <button
            onClick={() => navigate('/planner')}
            className="text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1"
          >
            查看全部 <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          <ActivityItem
            time="今天 12:30"
            text="完成午餐：番茄炒蛋 + 米饭"
            completed
          />
          <ActivityItem
            time="今天 08:15"
            text="完成早餐：燕麦粥 + 牛奶"
            completed
          />
          <ActivityItem
            time="昨天 18:45"
            text="添加菜谱：红烧排骨"
          />
          <ActivityItem
            time="昨天 12:00"
            text="完成午餐：清炒西兰花 + 鸡胸肉"
            completed
          />
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, suffix, color }: {
  icon: React.ReactNode
  label: string
  value: number
  suffix: string
  color: string
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-800">{value}<span className="text-sm font-normal text-gray-400 ml-1">{suffix}</span></div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  )
}

function ActionCard({ title, description, icon, gradient, onClick }: {
  title: string
  description: string
  icon: React.ReactNode
  gradient: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="group bg-white rounded-2xl shadow-sm p-6 text-left hover:shadow-md transition-all duration-300 hover:-translate-y-1"
    >
      <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="font-bold text-gray-800 text-lg mb-1">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </button>
  )
}

function ActivityItem({ time, text, completed }: { time: string; text: string; completed?: boolean }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className={`w-2 h-2 rounded-full ${completed ? 'bg-primary' : 'bg-gray-300'}`} />
      <div className="flex-1">
        <span className="text-xs text-gray-400 mr-2">{time}</span>
        <span className="text-sm text-gray-700">{text}</span>
      </div>
      {completed && (
        <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">已完成</span>
      )}
    </div>
  )
}

export default Home
