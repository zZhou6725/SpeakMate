import { NavLink } from 'react-router-dom';

const links = [
  { to: '/home', label: '首页' },
  { to: '/practice', label: '练习' },
  { to: '/history', label: '历史' },
];

export default function Navbar() {
  return (
    <nav className="bg-nav-gradient backdrop-blur-md border-b border-white/10 shadow-sm sticky top-0 z-50">
      <div className="max-w-content mx-auto px-8 h-16 flex items-center justify-between">
        <a href="/home" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
          </div>
          <span className="text-xl font-bold text-blue-800 tracking-tight">SpeakMate</span>
        </a>
        <ul className="flex items-center gap-1">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  `px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-white/20 text-blue-800 shadow-sm'
                      : 'text-blue-800 hover:text-blue-800 hover:bg-white/10'
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