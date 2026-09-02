import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ScanMeal from './pages/ScanMeal';
import NutritionAnalysis from './pages/NutritionAnalysis';
import MealHistory from './pages/MealHistory';
import StudentsPage from './pages/StudentsPage';
import FoodDatabase from './pages/FoodDatabase';
import AgeRequirements from './pages/AgeRequirements';
import Recommendations from './pages/Recommendations';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="shell">
        <Sidebar />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/scan" element={<ScanMeal />} />
            <Route path="/nutrition" element={<NutritionAnalysis />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/age-groups" element={<AgeRequirements />} />
            <Route path="/foods" element={<FoodDatabase />} />
            <Route path="/history" element={<MealHistory />} />
            <Route path="/recs" element={<Recommendations />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
