import { useState, useEffect, useCallback, useMemo } from 'react'
import { Droplets, Power, Search, Filter, ChevronUp, ChevronDown, Check, Plus, AlertCircle, X, Home, CheckCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { API_BASE_URL } from '../constants/api'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toISOString().slice(0, 10)
}

export default function Waterpump() {
  const { user } = useApp()
  const authHeader = { Authorization: `Bearer ${user?.token}` }

  const [actuators, setActuators] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('id')
  const [showSort, setShowSort] = useState(false)
  const [activeOnly, setActiveOnly] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [roomsWithout, setRoomsWithout] = useState([])
  const [loadingRooms, setLoadingRooms] = useState(false)
  const [selectedRoomId, setSelectedRoomId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchActuators = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/actuators`, { headers: authHeader })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch actuators')
      setActuators(data.actuators.map(a => ({
        id: a.actuator_id,
        roomId: a.room_id,
        roomName: a.room_name,
        waterpumpEnabled: a.waterpump_enabled === 1 || a.waterpump_enabled === true,
        isActive: a.activated_status === 1 || a.activated_status === true,
        lastUpdated: formatDate(a.last_updated),
      })))
    } catch (err) { alert(err.message) }
  }, [user?.token])

  useEffect(() => { fetchActuators().finally(() => setLoading(false)) }, [fetchActuators])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const res = actuators.filter(a =>
      (String(a.id).includes(q) || String(a.roomId).includes(q) || a.roomName.toLowerCase().includes(q)) &&
      (activeOnly ? a.isActive : true)
    )
    return [...res].sort((a, b) => sortBy === 'room' ? a.roomId - b.roomId : a.id - b.id)
  }, [actuators, search, sortBy, activeOnly])

  const openAddModal = async () => {
    setSelectedRoomId(null)
    setFormError('')
    setModalOpen(true)
    setLoadingRooms(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/actuators/rooms-without`, { headers: authHeader })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch rooms')
      setRoomsWithout(data.rooms)
    } catch (err) { setFormError(err.message) }
    finally { setLoadingRooms(false) }
  }

  const handleAddWaterpump = async (e) => {
    e.preventDefault()
    if (!selectedRoomId) { setFormError('Please select a room.'); return }
    setSubmitting(true)
    setFormError('')
    try {
      const res = await fetch(`${API_BASE_URL}/api/actuators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ room_id: selectedRoomId }),
      })
      const data = await res.json()
      if (!res.ok) { setFormError(data.error || 'Failed to add waterpump'); return }
      setModalOpen(false)
      await fetchActuators()
    } catch { setFormError('Unable to connect to server.') }
    finally { setSubmitting(false) }
  }

  const total = actuators.length
  const pumpOnCount = actuators.filter(a => a.waterpumpEnabled).length
  const activeCount = actuators.filter(a => a.isActive).length

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-primary px-6 py-5">
        <h1 className="text-white text-2xl font-bold">Waterpump Management</h1>
        <p className="text-white/75 text-sm mt-0.5 mb-4">Monitor actuator and waterpump status</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { Icon: Droplets, count: total, label: 'Total' },
            { Icon: Droplets, count: pumpOnCount, label: 'Pump Yes' },
            { Icon: Power, count: activeCount, label: 'Active' },
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
              placeholder="Search by ID or room..." value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button onClick={() => setSearch('')}><X size={16} className="text-gray-400 hover:text-gray-600" /></button>}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <button onClick={() => setShowSort(v => !v)}
                  className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-2 rounded-xl text-sm font-semibold text-gray-700 min-w-[130px] shadow-sm">
                  <Filter size={14} className="text-gray-500" />
                  <span className="flex-1 text-left">{sortBy === 'room' ? 'Sort by Room' : 'Sort by ID'}</span>
                  {showSort ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {showSort && <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowSort(false)} />
                  <div className="absolute top-11 left-0 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-[160px] py-1">
                    {[['id', 'Sort by ID'], ['room', 'Sort by Room']].map(([val, label]) => (
                      <button key={val} onClick={() => { setSortBy(val); setShowSort(false) }}
                        className="flex items-center justify-between w-full px-4 py-2.5 text-sm hover:bg-gray-50">
                        <span className={sortBy === val ? 'text-primary font-semibold' : 'text-gray-700'}>{label}</span>
                        {sortBy === val && <Check size={15} className="text-primary" />}
                      </button>
                    ))}
                  </div>
                </>}
              </div>

              <button onClick={() => setActiveOnly(v => !v)}
                className={`px-3 py-2 rounded-xl border text-sm font-semibold transition-colors ${activeOnly ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-700'}`}>
                Active Only
              </button>
            </div>

            <button onClick={openAddModal}
              className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold text-sm px-4 py-2 rounded-xl transition-colors">
              <Plus size={16} />
              Add Waterpump
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-center px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide w-[10%]">ID</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide w-[30%]">Room</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide w-[20%]">Waterpump</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide w-[20%]">Status</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide w-[20%]">Last Update</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12">
                  <Droplets size={40} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No actuators found.</p>
                </td></tr>
              ) : filtered.map((a, i) => (
                <tr key={a.id} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <td className="px-4 py-3.5 text-center">
                    <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2.5 py-1 rounded-lg">#{a.id}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-semibold text-gray-900">{a.roomName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Room #{a.roomId}</p>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${a.waterpumpEnabled ? 'bg-sky-50 text-sky-700' : 'bg-gray-100 text-gray-500'}`}>
                      <Droplets size={11} />
                      {a.waterpumpEnabled ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${a.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${a.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {a.isActive ? 'On' : 'Off'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center text-xs text-gray-400">{a.lastUpdated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Waterpump Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-5 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Add Waterpump</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={22} /></button>
            </div>

            <form onSubmit={handleAddWaterpump}>
              <p className="text-sm font-semibold text-gray-700 mb-2.5">Select Room</p>

              {loadingRooms ? (
                <div className="flex justify-center py-6">
                  <div className="w-7 h-7 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : roomsWithout.length === 0 ? (
                <div className="flex items-center gap-2.5 py-4 text-green-700">
                  <CheckCircle size={22} className="text-green-600 shrink-0" />
                  <p className="text-sm font-medium">All rooms already have a waterpump.</p>
                </div>
              ) : (
                <div className="space-y-2 mb-4">
                  {roomsWithout.map(room => (
                    <button key={room.room_id} type="button" onClick={() => setSelectedRoomId(room.room_id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-colors text-left ${selectedRoomId === room.room_id ? 'border-primary bg-primary-light' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}>
                      <div className="flex items-center gap-2.5">
                        <Home size={16} className={selectedRoomId === room.room_id ? 'text-primary' : 'text-gray-400'} />
                        <span className={`text-sm font-medium ${selectedRoomId === room.room_id ? 'text-primary font-semibold' : 'text-gray-700'}`}>{room.name}</span>
                      </div>
                      {selectedRoomId === room.room_id && <Check size={16} className="text-primary" />}
                    </button>
                  ))}
                </div>
              )}

              {formError && (
                <div className="flex items-center gap-2 text-red-600 mb-3">
                  <AlertCircle size={14} className="shrink-0" />
                  <p className="text-sm">{formError}</p>
                </div>
              )}

              {roomsWithout.length > 0 && (
                <button type="submit" disabled={submitting || !selectedRoomId}
                  className="w-full bg-primary hover:bg-primary-hover disabled:bg-red-300 text-white font-bold py-3 rounded-xl transition-colors">
                  {submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" /> : 'Add Waterpump'}
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
