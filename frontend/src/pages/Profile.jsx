import { useNavigate } from 'react-router-dom'
import { User, Mail, ShieldCheck, Flame, LogOut } from 'lucide-react'
import { useApp } from '../context/AppContext'

function getInitials(name) {
  if (!name) return 'A'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return parts[0].slice(0, 2).toUpperCase()
}

function InfoRow({ Icon, label, value }) {
  return (
    <div className="flex items-center gap-3.5 px-4 py-3.5">
      <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
        <Icon size={18} className="text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-gray-900 mt-0.5">{value || '—'}</p>
      </div>
    </div>
  )
}

export default function Profile() {
  const { user, setUser } = useApp()
  const navigate = useNavigate()

  const displayName = user?.fullName || user?.full_name || user?.name || 'Admin'
  const displayEmail = user?.email || '—'
  const displayRole = user?.role || 'Admin'
  const initials = getInitials(displayName)

  const handleLogout = () => {
    if (!window.confirm('Are you sure you want to sign out?')) return
    setUser(null)
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-auto">
      {/* Header */}
      <div className="bg-primary px-6 py-8 flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-white/25 border-4 border-white/40 flex items-center justify-center mb-3.5">
          <span className="text-white text-3xl font-bold">{initials}</span>
        </div>
        <h1 className="text-white text-xl font-bold">{displayName}</h1>
        <p className="text-white/75 text-sm mt-1">{displayEmail}</p>
        <div className="flex items-center gap-1.5 mt-2.5 bg-white/15 border border-white/20 rounded-full px-3 py-1.5">
          <ShieldCheck size={13} className="text-red-200" />
          <span className="text-red-200 text-xs font-semibold">{displayRole}</span>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-xl w-full mx-auto px-4 pt-6 pb-10">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Account Information</p>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          <InfoRow Icon={User} label="Full Name" value={displayName} />
          <div className="h-px bg-gray-100 ml-[68px]" />
          <InfoRow Icon={Mail} label="Email Address" value={displayEmail} />
          <div className="h-px bg-gray-100 ml-[68px]" />
          <InfoRow Icon={ShieldCheck} label="Role" value={displayRole} />
        </div>

        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">About</p>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="flex items-center gap-3.5 px-4 py-3.5">
            <div className="w-9 h-9 rounded-xl bg-primary-light flex items-center justify-center shrink-0">
              <Flame size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">FireBomba Admin</p>
              <p className="text-xs text-gray-400 mt-0.5">Version 1.0.0</p>
            </div>
          </div>
        </div>

        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-primary-light border border-red-200 hover:bg-red-100 text-primary font-bold py-3.5 rounded-xl transition-colors">
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  )
}
