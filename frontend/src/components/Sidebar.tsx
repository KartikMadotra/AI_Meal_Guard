import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ScanLine, Users, BookOpen,
  UtensilsCrossed, History, Settings, Lightbulb, FlaskConical,
} from 'lucide-react';

const NAV = [
  { to: '/',            icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/scan',        icon: ScanLine,        label: 'Scan Meal' },
  { to: '/students',    icon: Users,           label: 'Students' },
  { to: '/history',     icon: History,         label: 'Meal History' },
  { to: '/foods',       icon: UtensilsCrossed, label: 'Food Database' },
  { to: '/age-groups',  icon: BookOpen,        label: 'Age Requirements' },
  { to: '/what-if',     icon: FlaskConical,    label: 'What-If' },
  { to: '/settings',    icon: Settings,        label: 'Settings' },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0d1220] border-r border-white/[.06] flex flex-col z-50">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/[.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-white font-bold text-lg">
            M
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">MealGuard</h1>
            <p className="text-[11px] text-cyan-400/80 font-medium tracking-wide">SDG 2 • AI-Powered</p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
               ${isActive
                 ? 'bg-cyan-500/10 text-cyan-400 shadow-lg shadow-cyan-500/5'
                 : 'text-slate-400 hover:text-slate-200 hover:bg-white/[.04]'
               }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/[.06]">
        <div className="flex items-center gap-2">
          <Lightbulb size={14} className="text-amber-400" />
          <span className="text-xs text-slate-500">SDG 2 — Zero Hunger</span>
        </div>
      </div>
    </aside>
  );
}
