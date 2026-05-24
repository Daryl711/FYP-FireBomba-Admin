import { useState, useEffect, useCallback, useMemo } from 'react'
import { Home, AlertCircle as AlertIcon, Video, Search, Filter, ChevronUp, ChevronDown, Check, Plus, Pencil, Trash2, AlertCircle, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { API_BASE_URL } from '../constants/api'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toISOString().slice(0, 10)
}

const EMPTY_FORM = { name: '', status: '0', cameraEnabled: false }

export default function Rooms() {
  const { user } = useApp()
  const authHeader = { Authorization: `Bearer ${user?.token}` }

  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [showSort, setShowSort] = useState(false)
  const [alertOnly, setAlertOnly] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/rooms`, { headers: authHeader })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch rooms')
      setRooms(data.rooms.map(r => ({
        id: r.room_id,
        name: r.name,
        isAlert: r.status === '1' || r.status === 1,
        cameraEnabled: r.camera_enabled === 1 || r.camera_enabled === true,
        lastUpdated: formatDate(r.last_updated),
      })))
    } catch (err) { alert(err.message) }
  }, [user?.token])

  useEffect(() => { fetchRooms().finally(() => setLoading(false)) }, [fetchRooms])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const res = rooms.filter(r => r.name.toLowerCase().includes(q) && (alertOnly ? r.isAlert : true))
    return [...res].sort((a, b) =>
      sortBy === 'updated' ? new Date(a.lastUpdated) - new Date(b.lastUpdated) : a.name.localeCompare(b.name)
    )
  }, [rooms, search, sortBy, alertOnly])

  const openAdd = () => { setEditingId(null); setForm(EMPTY_FORM); setFormError(''); setModalOpen(true) }
  const openEdit = (room) => { setEditingId(room.id); setForm({ name: room.name, status: room.isAlert ? '1' : '0', cameraEnabled: room.cameraEnabled }); setFormError(''); setModalOpen(true) }

  const handleSave = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!form.name.trim()) { setFormError('Room name is required.'); return }
    setSubmitting(true)
    try {
      const isEdit = editingId !== null
      const res = await fetch(isEdit ? `${API_BASE_URL}/api/rooms/${editingId}` : `${API_BASE_URL}/api/rooms`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ name: form.name.trim(), status: form.status, cameraEnabled: form.cameraEnabled }),
      })
      const data = await res.json()
      if (!res.ok) { setFormError(data.error || 'Failed to save room'); return }
      setModalOpen(false)
      await fetchRooms()
    } catch { setFormError('Unable to connect to server.') }
    finally { setSubmitting(false) }
  }

  const handleDelete = async (roomId, roomName) => {
    if (!window.confirm(`Delete ${roomName}? This cannot be undone.`)) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/rooms/${roomId}`, { method: 'DELETE', headers: authHeader })
      if (!res.ok) { alert('Failed to delete room'); return }
      setRooms(cur => cur.filter(r => r.id !== roomId))
    } catch { alert('Unable to connect to server.') }
  }

  const totalRooms = rooms.length
  const alertCount = rooms.filter(r => r.isAlert).length
  const cameraCount = rooms.filter(r => r.cameraEnabled).length

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-primary px-6 py-5">
        <h1 className="text-white text-2xl font-bold">Room Management</h1>
        <p className="text-white/75 text-sm mt-0.5 mb-4">Monitor and manage rooms</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { Icon: Home, count: totalRooms, label: 'Total Rooms' },
            { Icon: AlertIcon, count: alertCount, label: 'Alert' },
            { Icon: Video, count: cameraCount, label: 'Camera On' },
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
        <div className="mb-3 space-y-3">
          <div className="flex items-center bg-white border-2 border-gray-200 rounded-xl px-4 py-2.5 gap-2.5 shadow-sm focus-within:border-primary transition-colors">
            <Search size={16} className="text-gray-400 shrink-0" />
            <input className="flex-1 outline-none text-sm text-gray-900 placeholder-gray-400 bg-transparent"
              placeholder="Search by room name..." value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button onClick={() => setSearch('')}><X size={16} className="text-gray-400 hover:text-gray-600" /></button>}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <button onClick={() => setShowSort(v => !v)}
                  className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-2 rounded-xl text-sm font-semibold text-gray-700 min-w-[130px] shadow-sm">
                  <Filter size={14} className="text-gray-500" />
                  <span className="flex-1 text-left">{sortBy === 'updated' ? 'Sort by Date' : 'Sort by Name'}</span>
                  {showSort ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {showSort && <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowSort(false)} />
                  <div className="absolute top-11 left-0 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-[160px] py-1">
                    {[['name', 'Sort by Name'], ['updated', 'Sort by Date']].map(([val, label]) => (
                      <button key={val} onClick={() => { setSortBy(val); setShowSort(false) }}
                        className="flex items-center justify-between w-full px-4 py-2.5 text-sm hover:bg-gray-50">
                        <span className={sortBy === val ? 'text-primary font-semibold' : 'text-gray-700'}>{label}</span>
                        {sortBy === val && <Check size={15} className="text-primary" />}
                      </button>
                    ))}
                  </div>
                </>}
              </div>

              <button onClick={() => setAlertOnly(v => !v)}
                className={`px-3 py-2 rounded-xl border text-sm font-semibold transition-colors ${alertOnly ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-gray-200 text-gray-700'}`}>
                Alert Only
              </button>
            </div>

            <button onClick={openAdd}
              className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold text-sm px-4 py-2 rounded-xl transition-colors">
              <Plus size={16} />
              Add Room
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide w-[35%]">Room</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide w-[15%]">Status</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide w-[15%]">Camera</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide w-[20%]">Last Updated</th>
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
                  <Home size={40} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No rooms found.</p>
                </td></tr>
              ) : filtered.map((room, i) => (
                <tr key={room.id} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                        <Home size={15} className="text-gray-500" />
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{room.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${room.isAlert ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${room.isAlert ? 'bg-red-500' : 'bg-green-500'}`} />
                      {room.isAlert ? 'Alert' : 'Safe'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${room.cameraEnabled ? 'bg-sky-50 text-sky-700' : 'bg-gray-100 text-gray-500'}`}>
                      <Video size={11} />
                      {room.cameraEnabled ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center text-xs text-gray-400">{room.lastUpdated}</td>
                  <td className="px-4 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEdit(room)} className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(room.id, room.name)} className="p-1.5 bg-red-50 hover:bg-red-100 text-primary rounded-lg transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-5 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Room' : 'Add New Room'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={22} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Room Name</label>
                <input type="text" placeholder="e.g. Room 1"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 bg-gray-50 outline-none focus:border-primary transition-colors"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              {formError && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle size={14} className="shrink-0" />
                  <p className="text-sm">{formError}</p>
                </div>
              )}
              <button type="submit" disabled={submitting}
                className="w-full bg-primary hover:bg-primary-hover disabled:bg-red-300 text-white font-bold py-3 rounded-xl transition-colors">
                {submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" /> : editingId ? 'Save Changes' : 'Create Room'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
