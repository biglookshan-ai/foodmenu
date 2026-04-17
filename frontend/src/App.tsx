import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import RecipeLibrary from './pages/RecipeLibrary';
import MealPlanner from './pages/MealPlanner';
import NutritionReport from './pages/NutritionReport';
import Navbar from './components/Navbar';

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="container mx-auto px-4 py-6">
            <Routes>
              <Route path="/" element={<Navigate to="/recipes" replace />} />
              <Route path="/recipes" element={<RecipeLibrary />} />
              <Route path="/planner" element={<MealPlanner />} />
              <Route path="/nutrition" element={<NutritionReport />} />
            </Routes>
          </main>
        </div>
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
Build trigger at Fri Apr 17 09:01:19 AM CST 2026
