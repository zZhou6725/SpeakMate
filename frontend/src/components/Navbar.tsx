import { NavLink } from 'react-router-dom';

const links = [
  { to: '/home', label: '首页' },
  { to: '/practice', label: '练习' },
  { to: '/history', label: '历史' },
];

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-content mx-auto px-6 h-16 flex items-center justify-between">
        <a href="/home" className="text-xl font-bold text-primary tracking-tight">
          SpeakMate
        </a>
        <ul className="flex items-center gap-1">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-card text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-muted hover:text-text hover:bg-gray-100'
                  }`
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}