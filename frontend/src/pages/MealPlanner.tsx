import { useState } from 'react'
import dayjs from 'dayjs'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'

const meals = ['breakfast', 'lunch', 'dinner'] as const
const mealLabels = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐' }

const MealPlanner = () => {
  const [weekStart, setWeekStart] = useState(dayjs().startOf('week'))
  
  const days = Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day'))

  const goToPrevWeek = () => setWeekStart(weekStart.subtract(7, 'day'))
  const goToNextWeek = () => setWeekStart(weekStart.add(7, 'day'))

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">执行中心</h2>
          <div className="flex items-center gap-2">
            <button onClick={goToPrevWeek} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-medium text-gray-600">
              {weekStart.format('MM/DD')} - {weekStart.add(6, 'day').format('MM/DD')}
            </span>
            <button onClick={goToNextWeek} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => (
            <div key={day.format('YYYY-MM-DD')} className="text-center">
              <div className="font-medium text-gray-600 mb-2">
                {day.format('ddd')}
              </div>
              <div className={`text-lg font-bold ${day.isSame(dayjs(), 'day') ? 'text-primary' : 'text-gray-800'}`}>
                {day.format('D')}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {days.map((day) => (
          <div key={day.format('YYYY-MM-DD')} className="bg-white rounded-xl shadow-sm p-4">
            <div className="font-bold text-gray-800 mb-3 text-center">
              {day.format('MM/DD')} {day.format('ddd')}
            </div>
            <div className="space-y-3">
              {meals.map((meal) => (
                <div key={meal} className="border rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">{mealLabels[meal]}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">待添加</span>
                    <button className="w-6 h-6 rounded-full border-2 border-gray-200 hover:border-primary transition-colors">
                      <Check className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MealPlanner
