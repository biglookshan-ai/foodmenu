import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Flame, Zap, Droplets, Wheat } from 'lucide-react'

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

  const todayNutrition = {
    calories: 1850,
    protein: 68,
    fat: 58,
    carbs: 260
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">今日营养摄入</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <Flame className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-600">{todayNutrition.calories}</div>
            <div className="text-sm text-gray-500">千卡</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <Zap className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-red-600">{todayNutrition.protein}g</div>
            <div className="text-sm text-gray-500">蛋白质</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 text-center">
            <Droplets className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-yellow-600">{todayNutrition.fat}g</div>
            <div className="text-sm text-gray-500">脂肪</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <Wheat className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">{todayNutrition.carbs}g</div>
            <div className="text-sm text-gray-500">碳水</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">本周热量趋势</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="calories" fill="#4CAF50" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default NutritionReport
