import { NavLink } from 'react-router-dom'
import Logo from './Logo'
import { navItems } from './navItems'

export default function SideNav() {
  return (
    <aside className="sidenav">
      <div className="sidenav__brand">
        <Logo />
      </div>

      <nav className="sidenav__links" aria-label="Main">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              'sidenav__link' + (isActive ? ' sidenav__link--active' : '')
            }
          >
            <span className="sidenav__icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
