import { useState, useEffect, useCallback, useMemo } from 'react'
import { Users as UsersIcon, ShieldCheck, User, Search, Filter, ChevronUp, ChevronDown, Check, UserPlus, Trash2, AlertCircle, X, Building2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { API_BASE_URL } from '../constants/api'

const AVATAR_COLORS = ['#7c3aed', '#0369a1', '#047857', '#b45309', '#be185d', '#0f766e']

function getAvatarColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getInitials(name) {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return parts[0].slice(0, 2).toUpperCase()
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toISOString().slice(0, 10)
}

const EMPTY_FORM = { fullName: '', email: '', password: '', role: 'User' }

export default function Users() {
  const { user } = useApp()
  const authHeader = { Authorization: `Bearer ${user?.token}` }

  const [users, setUsers] = useState([])
  const [biliks, setBiliks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [showSort, setShowSort] = useState(false)
  const [bilikFilter, setBilikFilter] = useState('all')
  const [showBilikFilter, setShowBilikFilter] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [assignUserId, setAssignUserId] = useState(null)
  const [assigning, setAssigning] = useState(false)

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/users`, { headers: authHeader })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch users')
      setUsers(data.users.map(u => ({
        id: u.user_id,
        name: u.full_name,
        email: u.email,
        role: u.role.toLowerCase(),
        created: formatDate(u.created_at),
        bilikId: u.bilik_id,
        bilikNumber: u.bilik_number,
      })))
    } catch (err) {
      alert(err.message)
    }
  }, [user?.token])

  const fetchBiliks = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/biliks`, { headers: authHeader })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch biliks')
      setBiliks(data.biliks.map(b => ({ id: b.bilik_id, number: b.bilik_number, householdName: b.household_name })))
    } catch (err) {
      alert(err.message)
    }
  }, [user?.token])

  useEffect(() => { Promise.all([fetchUsers(), fetchBiliks()]).finally(() => setLoading(false)) }, [fetchUsers, fetchBiliks])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const res = users
      .filter(u => `${u.name} ${u.email}`.toLowerCase().includes(q))
      .filter(u => bilikFilter === 'all' ? true : bilikFilter === 'unassigned' ? !u.bilikId : String(u.bilikId) === bilikFilter)
    return [...res].sort((a, b) =>
      sortBy === 'created'
        ? new Date(a.created) - new Date(b.created)
        : a.name.localeCompare(b.name)
    )
  }, [users, search, sortBy, bilikFilter])

  const assignTarget = users.find(u => u.id === assignUserId) ?? null

  const handleAssignBilik = async (bilikId) => {
    if (!assignTarget) return
    setAssigning(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/users/${assignTarget.id}/bilik`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ bilikId }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'Failed to assign Bilik'); return }
      const bilik = biliks.find(b => b.id === bilikId)
      setUsers(cur => cur.map(u => u.id === assignTarget.id ? { ...u, bilikId, bilikNumber: bilik?.number ?? null } : u))
      setAssignUserId(null)
    } catch { alert('Unable to connect to server.') }
    finally { setAssigning(false) }
  }

  const handleDelete = async (userId, userName) => {
    if (!window.confirm(`Delete ${userName}? This cannot be undone.`)) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/users/${userId}`, { method: 'DELETE', headers: authHeader })
      if (!res.ok) { const d = await res.json(); alert(d.error || 'Failed to delete user'); return }
      setUsers(cur => cur.filter(u => u.id !== userId))
    } catch { alert('Unable to connect to server.') }
  }

  const handleAddUser = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!form.fullName.trim() || !form.email.trim() || !form.password) {
      setFormError('Full name, email, and password are required.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/admin/add-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ fullName: form.fullName.trim(), email: form.email.trim().toLowerCase(), password: form.password, role: form.role }),
      })
      const data = await res.json()
      if (!res.ok) { setFormError(data.error || 'Failed to create user'); return }
      setModalOpen(false)
      await fetchUsers()
    } catch { setFormError('Unable to connect to server.') }
    finally { setSubmitting(false) }
  }

  const totalUsers = users.length
  const adminCount = users.filter(u => u.role === 'admin').length

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-primary px-6 py-5">
        <h1 className="text-white text-2xl font-bold">User Management</h1>
        <p className="text-white/75 text-sm mt-0.5 mb-4">Manage users and permissions</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { Icon: UsersIcon, count: totalUsers, label: 'Total Users' },
            { Icon: ShieldCheck, count: adminCount, label: 'Admins' },
            { Icon: User, count: totalUsers - adminCount, label: 'Normal Users' },
          ].map(({ Icon, count, label }) => (
            <div key={label} className="bg-white/15 border border-white/10 rounded-xl p-3 text-center">
              <Icon size={20} className="text-white/90 mx-auto mb-1" />
              <div className="text-white text-2xl font-bold">{count}</div>
              <div className="text-white/80 text-xs font-medium mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Toolbar */}
        <div className="mb-3 space-y-3">
          <div className="flex items-center bg-white border-2 border-gray-200 rounded-xl px-4 py-2.5 gap-2.5 shadow-sm focus-within:border-primary transition-colors">
            <Search size={16} className="text-gray-400 shrink-0" />
            <input
              className="flex-1 outline-none text-sm text-gray-900 placeholder-gray-400 bg-transparent"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button onClick={() => setSearch('')}><X size={16} className="text-gray-400 hover:text-gray-600" /></button>}
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowSort(v => !v)}
                  className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-2 rounded-xl text-sm font-semibold text-gray-700 min-w-[130px] shadow-sm"
                >
                  <Filter size={14} className="text-gray-500" />
                  <span className="flex-1 text-left">{sortBy === 'created' ? 'Sort by Date' : 'Sort by Name'}</span>
                  {showSort ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {showSort && <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowSort(false)} />
                  <div className="absolute top-11 left-0 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-[160px] py-1">
                    {[['name', 'Sort by Name'], ['created', 'Sort by Date']].map(([val, label]) => (
                      <button key={val} onClick={() => { setSortBy(val); setShowSort(false) }}
                        className="flex items-center justify-between w-full px-4 py-2.5 text-sm hover:bg-gray-50">
                        <span className={sortBy === val ? 'text-primary font-semibold' : 'text-gray-700'}>{label}</span>
                        {sortBy === val && <Check size={15} className="text-primary" />}
                      </button>
                    ))}
                  </div>
                </>}
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowBilikFilter(v => !v)}
                  className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-2 rounded-xl text-sm font-semibold text-gray-700 min-w-[150px] shadow-sm"
                >
                  <Building2 size={14} className="text-gray-500" />
                  <span className="flex-1 text-left truncate">
                    {bilikFilter === 'all' ? 'All Biliks' : bilikFilter === 'unassigned' ? 'Unassigned' : biliks.find(b => String(b.id) === bilikFilter)?.number ?? 'All Biliks'}
                  </span>
                  {showBilikFilter ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {showBilikFilter && <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowBilikFilter(false)} />
                  <div className="absolute top-11 left-0 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-[180px] py-1 max-h-64 overflow-auto">
                    {[['all', 'All Biliks'], ['unassigned', 'Unassigned']].map(([val, label]) => (
                      <button key={val} onClick={() => { setBilikFilter(val); setShowBilikFilter(false) }}
                        className="flex items-center justify-between w-full px-4 py-2.5 text-sm hover:bg-gray-50">
                        <span className={bilikFilter === val ? 'text-primary font-semibold' : 'text-gray-700'}>{label}</span>
                        {bilikFilter === val && <Check size={15} className="text-primary" />}
                      </button>
                    ))}
                    {biliks.map(b => (
                      <button key={b.id} onClick={() => { setBilikFilter(String(b.id)); setShowBilikFilter(false) }}
                        className="flex items-center justify-between w-full px-4 py-2.5 text-sm hover:bg-gray-50">
                        <span className={bilikFilter === String(b.id) ? 'text-primary font-semibold' : 'text-gray-700'}>{b.number}</span>
                        {bilikFilter === String(b.id) && <Check size={15} className="text-primary" />}
                      </button>
                    ))}
                  </div>
                </>}
              </div>
            </div>

            <button onClick={() => { setForm(EMPTY_FORM); setFormError(''); setModalOpen(true) }}
              className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold text-sm px-4 py-2 rounded-xl transition-colors">
              <UserPlus size={16} />
              Add User
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide w-[35%]">User</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide w-[15%]">Role</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide w-[20%]">Bilik</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide w-[15%]">Joined</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide w-[15%]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12">
                  <UsersIcon size={40} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No users found.</p>
                </td></tr>
              ) : filtered.map((item, i) => (
                <tr key={item.id} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
                        style={{ backgroundColor: getAvatarColor(item.name) }}>
                        {getInitials(item.name)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${item.role === 'admin' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                      {item.role}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <button onClick={() => setAssignUserId(item.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${item.bilikNumber ? 'bg-sky-50 text-sky-700 hover:bg-sky-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                      <Building2 size={11} />
                      {item.bilikNumber || 'Unassigned'}
                    </button>
                  </td>
                  <td className="px-4 py-3.5 text-center text-xs text-gray-400">{item.created}</td>
                  <td className="px-4 py-3.5 text-center">
                    <button onClick={() => handleDelete(item.id, item.name)}
                      className="p-1.5 bg-red-50 hover:bg-red-100 text-primary rounded-lg transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-5 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Add New User</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={22} /></button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              {[
                { label: 'Full Name', key: 'fullName', type: 'text', placeholder: 'John Doe' },
                { label: 'Email', key: 'email', type: 'email', placeholder: 'user@example.com' },
                { label: 'Password', key: 'password', type: 'password', placeholder: 'Password' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
                  <input type={type} placeholder={placeholder}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 bg-gray-50 outline-none focus:border-primary transition-colors"
                    value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Role</label>
                <div className="flex gap-3">
                  {['User', 'Admin'].map(r => (
                    <button key={r} type="button" onClick={() => setForm(f => ({ ...f, role: r }))}
                      className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${form.role === r ? 'border-primary bg-primary-light text-primary' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {formError && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle size={14} className="shrink-0" />
                  <p className="text-sm">{formError}</p>
                </div>
              )}

              <button type="submit" disabled={submitting}
                className="w-full bg-primary hover:bg-primary-hover disabled:bg-red-300 text-white font-bold py-3 rounded-xl transition-colors mt-2">
                {submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" /> : 'Create User'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Assign Bilik Modal */}
      {assignTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-5 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-gray-900">Assign to Bilik</h2>
              <button onClick={() => setAssignUserId(null)} className="text-gray-400 hover:text-gray-600"><X size={22} /></button>
            </div>
            <p className="text-sm text-gray-400 mb-5">{assignTarget.name}</p>

            <div className="space-y-1.5 max-h-72 overflow-auto">
              <button disabled={assigning} onClick={() => handleAssignBilik(null)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-colors text-left ${!assignTarget.bilikId ? 'border-primary bg-primary-light' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}>
                <span className={`text-sm font-medium ${!assignTarget.bilikId ? 'text-primary font-semibold' : 'text-gray-700'}`}>Unassigned</span>
                {!assignTarget.bilikId && <Check size={16} className="text-primary" />}
              </button>
              {biliks.map(b => (
                <button key={b.id} disabled={assigning} onClick={() => handleAssignBilik(b.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-colors text-left ${assignTarget.bilikId === b.id ? 'border-primary bg-primary-light' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}>
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className={assignTarget.bilikId === b.id ? 'text-primary' : 'text-gray-400'} />
                    <span className={`text-sm font-medium ${assignTarget.bilikId === b.id ? 'text-primary font-semibold' : 'text-gray-700'}`}>
                      {b.number}{b.householdName ? ` (${b.householdName})` : ''}
                    </span>
                  </div>
                  {assignTarget.bilikId === b.id && <Check size={16} className="text-primary" />}
                </button>
              ))}
              {biliks.length === 0 && <p className="text-xs text-gray-400 py-2">No Bilik available yet.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
