import { NavLink, useLocation } from 'react-router-dom';

const NAV = [
  { to: '/',            label: 'Dashboard' },
  { to: '/scan',        label: 'Scan Meal' },
  { to: '/students',    label: 'Students' },
  { to: '/history',     label: 'History' },
  { to: '/foods',       label: 'Foods' },
  { to: '/age-groups',  label: 'Age Groups' },
  { to: '/what-if',     label: 'What-If' },
  { to: '/settings',    label: 'Settings' },
];

export default function TopNav() {
  const location = useLocation();

  return (
    <header className="border-b border-[var(--color-line)] bg-[var(--color-panel)]">
      <div className="max-w-[1180px] mx-auto px-6">
        {/* Top: Brand */}
        <div className="flex items-baseline justify-between py-5 border-b border-[var(--color-line)]">
          <div>
            <NavLink to="/" className="no-underline">
              <h1 className="heading-serif text-[26px] text-[var(--color-ink)] m-0 leading-none">
                AI MealGuard
              </h1>
            </NavLink>
            <p className="text-[12px] text-[var(--color-ink-soft)] mt-1 tracking-wide">
              AI-powered nutrition assessment · SDG 2
            </p>
          </div>
          <div className="text-right text-[12.5px] text-[var(--color-ink-soft)]">
            Demo Mode
            <span className="block text-[var(--color-ink)] font-semibold text-[13.5px]">
              {getPageTitle(location.pathname)}
            </span>
          </div>
        </div>

        {/* Bottom: Nav links */}
        <nav className="flex gap-0 overflow-x-auto -mb-px">
          {NAV.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `px-4 py-3 text-[13px] font-medium border-b-2 transition-colors whitespace-nowrap no-underline
                ${isActive
                  ? 'border-[var(--color-ink)] text-[var(--color-ink)]'
                  : 'border-transparent text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:border-[var(--color-line)]'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}

function getPageTitle(path: string): string {
  const map: Record<string, string> = {
    '/': 'Dashboard',
    '/scan': 'Scan Meal',
    '/students': 'Students',
    '/history': 'Meal History',
    '/foods': 'Food Database',
    '/age-groups': 'Age Groups',
    '/what-if': 'What-If Simulator',
    '/settings': 'Settings',
  };
  return map[path] || 'MealGuard';
}
