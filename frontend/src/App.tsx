import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TopNav from './components/TopNav';
import Dashboard from './pages/Dashboard';
import ScanMeal from './pages/ScanMeal';
import MealHistory from './pages/MealHistory';
import StudentsPage from './pages/StudentsPage';
import FoodDatabase from './pages/FoodDatabase';
import AgeRequirements from './pages/AgeRequirements';
import WhatIfPage from './pages/WhatIfPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[var(--color-bg)]">
        <TopNav />
        <main className="max-w-[1180px] mx-auto px-6 py-7">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/scan" element={<ScanMeal />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/history" element={<MealHistory />} />
            <Route path="/foods" element={<FoodDatabase />} />
            <Route path="/age-groups" element={<AgeRequirements />} />
            <Route path="/what-if" element={<WhatIfPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
