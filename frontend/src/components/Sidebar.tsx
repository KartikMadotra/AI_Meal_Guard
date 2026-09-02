import { NavLink } from 'react-router-dom';

const NAV = [
  { to: '/',            label: 'Dashboard',          icon: <svg viewBox="0 0 20 20"><path d="M3 16V9M9 16V4M15 16v-6"/></svg> },
  { to: '/scan',        label: 'Scan meal',          icon: <svg viewBox="0 0 20 20"><rect x="2.5" y="6" width="15" height="10" rx="1.5"/><path d="M7 6l1.2-2h3.6L13 6"/><circle cx="10" cy="11" r="2.6"/></svg> },
  { to: '/nutrition',   label: 'Nutrition analysis',  icon: <svg viewBox="0 0 20 20"><path d="M15 3c1 5-1 10-6 12-3 1-6-1-6-4 2 1 4 0 5-2C4 8 4 5 6 3c1 3 3 3 4 1 1 2 3 1 5-1z"/></svg> },
  { to: '/students',    label: 'Students',           icon: <svg viewBox="0 0 20 20"><circle cx="7" cy="7" r="2.6"/><circle cx="14" cy="8" r="2.1"/><path d="M2.5 16c0-2.8 2-4.5 4.5-4.5s4.5 1.7 4.5 4.5M12 16c0-2.2 1.6-3.6 3.5-3.6s3.5 1.4 3.5 3.6"/></svg> },
  { to: '/age-groups',  label: 'Age requirements',   icon: <svg viewBox="0 0 20 20"><path d="M10 5C8 3.8 5 3.5 3 4v11c2-.5 5-.2 7 1 2-1.2 5-1.5 7-1V4c-2 .5-5 .8-7 2z"/><path d="M10 5v11"/></svg> },
  { to: '/foods',       label: 'Food database',      icon: <svg viewBox="0 0 20 20"><path d="M3 6h14M3 10h14M3 14h14"/></svg> },
  { to: '/history',     label: 'Meal history',       icon: <svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="7.2"/><path d="M10 6v4l3 2"/></svg> },
  { to: '/recs',        label: 'Recommendations',    icon: <svg viewBox="0 0 20 20"><path d="M10 3a4.5 4.5 0 0 1 2.5 8.2c-.4.3-.7.9-.7 1.5v.3h-3.6v-.3c0-.6-.3-1.2-.7-1.5A4.5 4.5 0 0 1 10 3z"/><path d="M8.3 15.5h3.4M9 17.3h2"/></svg> },
  { to: '/settings',    label: 'Settings',           icon: <svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="2.6"/><path d="M10 3v2M10 15v2M17 10h-2M5 10H3M14.9 5.1l-1.4 1.4M6.5 13.5l-1.4 1.4M14.9 14.9l-1.4-1.4M6.5 6.5L5.1 5.1"/></svg> },
];

export default function Sidebar() {
  return (
    <div className="sidebar">
      <div className="brand">AI MealGuard</div>
      <nav className="flex flex-col gap-px">
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            {icon}
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
