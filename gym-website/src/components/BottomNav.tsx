import { NavLink } from 'react-router-dom'
import { mobileNavItems } from './navItems'

export default function BottomNav() {
  return (
    <nav className="bottomnav" aria-label="Main">
      {mobileNavItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            'bottomnav__link' + (isActive ? ' bottomnav__link--active' : '')
          }
        >
          <span className="bottomnav__icon">{item.icon}</span>
          <span className="bottomnav__label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
