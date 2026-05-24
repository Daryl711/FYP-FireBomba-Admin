import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Flame, Users, Home, Activity, Bell, Droplets, User, LogOut } from 'lucide-react'
import { useApp } from '../context/AppContext'

const NAV_ITEMS = [
  { to: '/users',     label: 'Users',        Icon: Users },
  { to: '/rooms',     label: 'Rooms',        Icon: Home },
  { to: '/sensors',   label: 'Sensor Status',Icon: Activity },
  { to: '/alerts',    label: 'Alert History',Icon: Bell },
  { to: '/waterpump', label: 'Waterpump',    Icon: Droplets },
  { to: '/profile',   label: 'Profile',      Icon: User },
]

export default function Layout() {
  const { setUser } = useApp()
  const navigate = useNavigate()

  const handleLogout = () => {
    setUser(null)
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-white border-r border-gray-100 flex flex-col py-6 px-4">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
            <Flame size={20} color="#fff" />
          </div>
          <div>
            <p className="text-base font-bold text-gray-900 leading-tight">FireBomba</p>
            <p className="text-xs text-gray-500 mt-0.5">Admin Panel</p>
          </div>
        </div>

        <div className="h-px bg-gray-100 mb-4" />

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-light text-primary'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} className={isActive ? 'text-primary' : 'text-gray-400'} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors w-full text-left"
        >
          <LogOut size={20} className="text-gray-400" />
          Logout
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
