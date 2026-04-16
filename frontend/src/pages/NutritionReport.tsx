import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { Flame, Zap, Droplets, Wheat, TrendingUp, TrendingDown, Minus } from 'lucide-react'

const COLORS = ['#4CAF50', '#FF9800', '#2196F3', '#9C27B0']

const NutritionReport = () => {
  const [weeklyData] = useState([
    { day: '周一', calories: 1800, protein: 65, fat: 55, carbs: 250 },
    { day: '周二', calories: 1950, protein: 70, fat: 60, carbs: 270 },
    { day: '周三', calories: 1700, protein: 60, fat: 50, carbs: 230 },
    { day: '周四', calories: 1850, protein: 68, fat: 58, carbs: 260 },
    { day: '周五', calories: 2000, protein: 75, fat: 65, carbs: 280 },
    { day: '周六', calories: 2100, protein: 80, fat: 70, carbs: 290 },
    { day: '周日', calories: 1900, protein: 72, fat: 62, carbs: 265 },
  ])

  const macroData = [
    { name: '蛋白质', value: 68, color: '#4CAF50' },
    { name: '脂肪', value: 58, color: '#FF9800' },
    { name: '碳水', value: 260, color: '#2196F3' },
  ]

  const todayNutrition = {
    calories: 1850,
    protein: 68,
    fat: 58,
    carbs: 260
  }

  const trends = [
    { label: '热量', value: '+5%', direction: 'up' as const },
    { label: '蛋白质', value: '+3%', direction: 'up' as const },
    { label: '脂肪', value: '-2%', direction: 'down' as const },
    { label: '碳水', value: '+8%', direction: 'up' as const },
  ]

  const avgCalories = Math.round(weeklyData.reduce((acc, d) => acc + d.calories, 0) / 7)

  return (
    <div className="space-y-6">
      {/* Today's Nutrition */}
      <div className="bg-gradient-to-br from-primary/5 via-white to-secondary/5 rounded-2xl shadow-sm p-6 border border-primary/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">今日营养摄入</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">实时更新</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <NutritionCard
            icon={<Flame className="w-6 h-6" />}
            value={todayNutrition.calories}
            unit="千卡"
            label="热量"
            color="from-orange-400 to-orange-500"
            bgColor="bg-orange-50"
          />
          <NutritionCard
            icon={<Zap className="w-6 h-6" />}
            value={todayNutrition.protein}
            unit="g"
            label="蛋白质"
            color="from-red-400 to-red-500"
            bgColor="bg-red-50"
          />
          <NutritionCard
            icon={<Droplets className="w-6 h-6" />}
            value={todayNutrition.fat}
            unit="g"
            label="脂肪"
            color="from-yellow-400 to-yellow-500"
            bgColor="bg-yellow-50"
          />
          <NutritionCard
            icon={<Wheat className="w-6 h-6" />}
            value={todayNutrition.carbs}
            unit="g"
            label="碳水"
            color="from-green-400 to-green-500"
            bgColor="bg-green-50"
          />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Calories Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800">本周热量趋势</h3>
              <p className="text-sm text-gray-500 mt-1">日均摄入 {avgCalories} 千卡</p>
            </div>
            <TrendBadge value="+3.2%" direction="up" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} domain={[1400, 2200]} />
                <Tooltip
                  contentStyle={{
                    background: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value: number) => [`${value} 千卡`, '摄入']}
                />
                <Bar dataKey="calories" fill="#4CAF50" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Macro Breakdown */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-2">营养素占比</h3>
          <p className="text-sm text-gray-500 mb-4">今日摄入营养素分布</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={macroData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {macroData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value: number, name: string) => [`${value}g`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {macroData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trends Section */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">本周变化趋势</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {trends.map((trend) => (
            <div key={trend.label} className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-sm text-gray-500 mb-2">{trend.label}</div>
              <div className="flex items-center justify-center gap-1">
                {trend.direction === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                {trend.direction === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
                {trend.direction === 'same' && <Minus className="w-4 h-4 text-gray-400" />}
                <span className={`font-bold text-lg ${trend.direction === 'up' ? 'text-green-500' : trend.direction === 'down' ? 'text-red-500' : 'text-gray-400'}`}>
                  {trend.value}
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-1">vs 上周</div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Summary */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">本周小结</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SummaryItem
            label="平均每日热量"
            value={avgCalories}
            unit="千卡"
            status="normal"
          />
          <SummaryItem
            label="平均蛋白质"
            value={70}
            unit="g"
            status="good"
          />
          <SummaryItem
            label="饮食均衡度"
            value={85}
            unit="%"
            status="good"
          />
        </div>
      </div>
    </div>
  )
}

function NutritionCard({
  icon,
  value,
  unit,
  label,
  color,
  bgColor,
}: {
  icon: React.ReactNode
  value: number
  unit: string
  label: string
  color: string
  bgColor: string
}) {
  return (
    <div className={`${bgColor} rounded-xl p-4 relative overflow-hidden group hover:shadow-md transition-shadow`}>
      <div className={`absolute -right-2 -bottom-2 w-20 h-20 bg-gradient-to-br ${color} rounded-full opacity-10 group-hover:opacity-20 transition-opacity`} />
      <div className="relative">
        <div className={`w-10 h-10 bg-gradient-to-br ${color} rounded-lg flex items-center justify-center text-white mb-3`}>
          {icon}
        </div>
        <div className="text-2xl font-bold text-gray-800">{value}</div>
        <div className="text-sm text-gray-500">{unit} · {label}</div>
      </div>
    </div>
  )
}

function TrendBadge({ value, direction }: { value: string; direction: 'up' | 'down' | 'same' }) {
  const colorClass = direction === 'up' ? 'bg-green-100 text-green-600' : direction === 'down' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
  return (
    <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${colorClass}`}>
      {direction === 'up' && <TrendingUp className="w-3 h-3" />}
      {direction === 'down' && <TrendingDown className="w-3 h-3" />}
      {direction === 'same' && <Minus className="w-3 h-3" />}
      {value}
    </span>
  )
}

function SummaryItem({ label, value, unit, status }: { label: string; value: number; unit: string; status: 'good' | 'normal' | 'warning' }) {
  const statusColor = {
    good: 'text-green-500',
    normal: 'text-yellow-500',
    warning: 'text-red-500',
  }[status]
  return (
    <div className="text-center">
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${statusColor}`}>{value}<span className="text-sm font-normal text-gray-400 ml-1">{unit}</span></div>
    </div>
  )
}

export default NutritionReport
