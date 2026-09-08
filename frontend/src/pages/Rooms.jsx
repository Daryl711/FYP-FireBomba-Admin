import { useState, useEffect, useCallback, useMemo } from 'react'
import { Home, AlertCircle as AlertIcon, Video, Search, Filter, ChevronUp, ChevronDown, Check, Plus, Pencil, Trash2, AlertCircle, X, Building2, DoorOpen } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { API_BASE_URL } from '../constants/api'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toISOString().slice(0, 10)
}

const SPACE_TYPES = [
  ['BILIK_ROOM', 'Bilik Room'],
  ['RUAI', 'Ruai'],
  ['TANJU', 'Tanju'],
]

const EMPTY_ROOM_FORM = { name: '', status: '0', cameraEnabled: false, spaceType: 'BILIK_ROOM', bilikId: '' }
const EMPTY_BILIK_FORM = { bilikNumber: '', householdName: '' }

function RoomTable({ rooms, onEdit, onDelete, emptyMessage }) {
  if (rooms.length === 0) {
    return <p className="text-center text-sm text-gray-400 py-6">{emptyMessage}</p>
  }
  return (
    <table className="w-full">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-400 uppercase tracking-wide w-[35%]">Room</th>
          <th className="text-center px-4 py-2.5 text-xs font-bold text-gray-400 uppercase tracking-wide w-[15%]">Status</th>
          <th className="text-center px-4 py-2.5 text-xs font-bold text-gray-400 uppercase tracking-wide w-[15%]">Camera</th>
          <th className="text-center px-4 py-2.5 text-xs font-bold text-gray-400 uppercase tracking-wide w-[20%]">Last Updated</th>
          <th className="text-center px-4 py-2.5 text-xs font-bold text-gray-400 uppercase tracking-wide w-[15%]">Actions</th>
        </tr>
      </thead>
      <tbody>
        {rooms.map((room, i) => (
          <tr key={room.id} className={`border-b border-gray-100 last:border-b-0 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                  <DoorOpen size={15} className="text-gray-500" />
                </div>
                <span className="text-sm font-semibold text-gray-900">{room.name}</span>
              </div>
            </td>
            <td className="px-4 py-3 text-center">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${room.isAlert ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${room.isAlert ? 'bg-red-500' : 'bg-green-500'}`} />
                {room.isAlert ? 'Alert' : 'Safe'}
              </span>
            </td>
            <td className="px-4 py-3 text-center">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${room.cameraEnabled ? 'bg-sky-50 text-sky-700' : 'bg-gray-100 text-gray-500'}`}>
                <Video size={11} />
                {room.cameraEnabled ? 'Yes' : 'No'}
              </span>
            </td>
            <td className="px-4 py-3 text-center text-xs text-gray-400">{room.lastUpdated}</td>
            <td className="px-4 py-3 text-center">
              <div className="flex items-center justify-center gap-2">
                <button onClick={() => onEdit(room)} className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg transition-colors">
                  <Pencil size={14} />
                </button>
                <button onClick={() => onDelete(room.id, room.name)} className="p-1.5 bg-red-50 hover:bg-red-100 text-primary rounded-lg transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default function Rooms() {
  const { user } = useApp()
  const authHeader = { Authorization: `Bearer ${user?.token}` }

  const [rooms, setRooms] = useState([])
  const [biliks, setBiliks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [showSort, setShowSort] = useState(false)
  const [alertOnly, setAlertOnly] = useState(false)

  const [roomModalOpen, setRoomModalOpen] = useState(false)
  const [editingRoomId, setEditingRoomId] = useState(null)
  const [roomForm, setRoomForm] = useState(EMPTY_ROOM_FORM)
  const [roomFormError, setRoomFormError] = useState('')
  const [submittingRoom, setSubmittingRoom] = useState(false)

  const [bilikModalOpen, setBilikModalOpen] = useState(false)
  const [editingBilikId, setEditingBilikId] = useState(null)
  const [bilikForm, setBilikForm] = useState(EMPTY_BILIK_FORM)
  const [bilikFormError, setBilikFormError] = useState('')
  const [submittingBilik, setSubmittingBilik] = useState(false)

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
        spaceType: r.space_type,
        bilikId: r.bilik_id,
        bilikNumber: r.bilik_number,
      })))
    } catch (err) { alert(err.message) }
  }, [user?.token])

  const fetchBiliks = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/biliks`, { headers: authHeader })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch biliks')
      setBiliks(data.biliks.map(b => ({
        id: b.bilik_id,
        number: b.bilik_number,
        householdName: b.household_name,
      })))
    } catch (err) { alert(err.message) }
  }, [user?.token])

  useEffect(() => { Promise.all([fetchRooms(), fetchBiliks()]).finally(() => setLoading(false)) }, [fetchRooms, fetchBiliks])

  const q = search.trim().toLowerCase()

  const sortRooms = useCallback((list) => [...list].sort((a, b) =>
    sortBy === 'updated' ? new Date(a.lastUpdated) - new Date(b.lastUpdated) : a.name.localeCompare(b.name)
  ), [sortBy])

  const roomMatches = useCallback((room) =>
    room.name.toLowerCase().includes(q) && (alertOnly ? room.isAlert : true)
  , [q, alertOnly])

  const sharedRooms = useMemo(() =>
    sortRooms(rooms.filter(r => r.spaceType !== 'BILIK_ROOM' && roomMatches(r)))
  , [rooms, roomMatches, sortRooms])

  const bilikGroups = useMemo(() => {
    return [...biliks]
      .sort((a, b) => a.number.localeCompare(b.number))
      .map(bilik => {
        const bilikRooms = sortRooms(rooms.filter(r => r.bilikId === bilik.id && roomMatches(r)))
        const bilikNameMatches = q === '' || bilik.number.toLowerCase().includes(q) || (bilik.householdName ?? '').toLowerCase().includes(q)
        return { bilik, rooms: bilikRooms, visible: bilikNameMatches || bilikRooms.length > 0 }
      })
      .filter(group => group.visible)
  }, [biliks, rooms, roomMatches, sortRooms, q])

  const hasAnyResults = sharedRooms.length > 0 || bilikGroups.length > 0

  const totalRooms = rooms.length
  const totalBiliks = biliks.length
  const alertCount = rooms.filter(r => r.isAlert).length
  const cameraCount = rooms.filter(r => r.cameraEnabled).length

  // --- Room modal ---
  const openAddRoom = () => { setEditingRoomId(null); setRoomForm(EMPTY_ROOM_FORM); setRoomFormError(''); setRoomModalOpen(true) }
  const openEditRoom = (room) => {
    setEditingRoomId(room.id)
    setRoomForm({
      name: room.name,
      status: room.isAlert ? '1' : '0',
      cameraEnabled: room.cameraEnabled,
      spaceType: room.spaceType,
      bilikId: room.bilikId ?? '',
    })
    setRoomFormError('')
    setRoomModalOpen(true)
  }

  const handleSaveRoom = async (e) => {
    e.preventDefault()
    setRoomFormError('')
    if (!roomForm.name.trim()) { setRoomFormError('Room name is required.'); return }
    if (roomForm.spaceType === 'BILIK_ROOM' && !roomForm.bilikId) { setRoomFormError('Please select a Bilik.'); return }
    setSubmittingRoom(true)
    try {
      const isEdit = editingRoomId !== null
      const res = await fetch(isEdit ? `${API_BASE_URL}/api/rooms/${editingRoomId}` : `${API_BASE_URL}/api/rooms`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({
          name: roomForm.name.trim(),
          status: roomForm.status,
          cameraEnabled: roomForm.cameraEnabled,
          spaceType: roomForm.spaceType,
          bilikId: roomForm.spaceType === 'BILIK_ROOM' ? roomForm.bilikId : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setRoomFormError(data.error || 'Failed to save room'); return }
      setRoomModalOpen(false)
      await fetchRooms()
    } catch { setRoomFormError('Error: Unable to connect to server.') }
    finally { setSubmittingRoom(false) }
  }
``
  const handleDeleteRoom = async (roomId, roomName) => {
    if (!window.confirm(`Delete ${roomName}? This cannot be undone.`)) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/rooms/${roomId}`, { method: 'DELETE', headers: authHeader })
      if (!res.ok) { alert('Failed to delete room'); return }
      setRooms(cur => cur.filter(r => r.id !== roomId))
    } catch { alert('Error: Unable to connect to server.') }
  }

  // --- Bilik modal ---
  const openAddBilik = () => { setEditingBilikId(null); setBilikForm(EMPTY_BILIK_FORM); setBilikFormError(''); setBilikModalOpen(true) }
  const openEditBilik = (bilik) => {
    setEditingBilikId(bilik.id)
    setBilikForm({ bilikNumber: bilik.number, householdName: bilik.householdName ?? '' })
    setBilikFormError('')
    setBilikModalOpen(true)
  }

  const handleSaveBilik = async (e) => {
    e.preventDefault()
    setBilikFormError('')
    if (!bilikForm.bilikNumber.trim()) { setBilikFormError('Bilik number is required.'); return }
    setSubmittingBilik(true)
    try {
      const isEdit = editingBilikId !== null
      const res = await fetch(isEdit ? `${API_BASE_URL}/api/biliks/${editingBilikId}` : `${API_BASE_URL}/api/biliks`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ bilikNumber: bilikForm.bilikNumber.trim(), householdName: bilikForm.householdName.trim() || null }),
      })
      const data = await res.json()
      if (!res.ok) { setBilikFormError(data.error || 'Failed to save Bilik'); return }
      setBilikModalOpen(false)
      await fetchBiliks()
    } catch { setBilikFormError('Unable to connect to server.') }
    finally { setSubmittingBilik(false) }
  }

  const handleDeleteBilik = async (bilikId, bilikNumber) => {
    const roomCount = rooms.filter(r => r.bilikId === bilikId).length
    const warning = roomCount > 0
      ? `Delete ${bilikNumber}? This will also delete its ${roomCount} room(s) and all their sensors, actuators, and alerts. This cannot be undone.`
      : `Delete ${bilikNumber}? This cannot be undone.`
    if (!window.confirm(warning)) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/biliks/${bilikId}`, { method: 'DELETE', headers: authHeader })
      if (!res.ok) { alert('Failed to delete Bilik'); return }
      setBiliks(cur => cur.filter(b => b.id !== bilikId))
      setRooms(cur => cur.filter(r => r.bilikId !== bilikId))
    } catch { alert('Unable to connect to server.') }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-primary px-6 py-5">
        <h1 className="text-white text-2xl font-bold">Room Management</h1>
        <p className="text-white/75 text-sm mt-0.5 mb-4">Monitor and manage the longhouse's Bilik and shared spaces</p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { Icon: Building2, count: totalBiliks, label: 'Bilik' },
            { Icon: Home, count: totalRooms, label: 'Total Rooms' },
            { Icon: AlertIcon, count: alertCount, label: 'Alert' },
            { Icon: Video, count: cameraCount, label: 'Camera On' },
          ].map(({ Icon, count, label }) => (
            <div key={label} className="bg-white/15 border border-white/10 rounded-xl p-2.5 text-center">
              <Icon size={18} className="text-white/90 mx-auto mb-1" />
              <div className="text-white text-xl font-bold">{count}</div>
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
              placeholder="Search by room or Bilik name..." value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button onClick={() => setSearch('')}><X size={16} className="text-gray-400 hover:text-gray-600" /></button>}
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2">
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

            <div className="flex items-center gap-2">
              <button onClick={openAddBilik}
                className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-sm px-4 py-2 rounded-xl transition-colors">
                <Plus size={16} />
                Add Bilik
              </button>
              <button onClick={openAddRoom}
                className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold text-sm px-4 py-2 rounded-xl transition-colors">
                <Plus size={16} />
                Add Room
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !hasAnyResults ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm py-12 text-center">
            <Home size={40} className="text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No rooms found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sharedRooms.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <DoorOpen size={16} className="text-gray-500" />
                  <h2 className="text-sm font-bold text-gray-800">Shared Spaces</h2>
                  <span className="text-xs text-gray-400">Ruai &amp; Tanju — shared by the whole longhouse</span>
                </div>
                <RoomTable rooms={sharedRooms} onEdit={openEditRoom} onDelete={handleDeleteRoom} emptyMessage="No shared spaces found." />
              </div>
            )}

            {bilikGroups.map(({ bilik, rooms: bilikRooms }) => (
              <div key={bilik.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-gray-500" />
                    <h2 className="text-sm font-bold text-gray-800">{bilik.number}</h2>
                    {bilik.householdName && <span className="text-xs text-gray-400">{bilik.householdName}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEditBilik(bilik)} className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => handleDeleteBilik(bilik.id, bilik.number)} className="p-1.5 bg-red-50 hover:bg-red-100 text-primary rounded-lg transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <RoomTable rooms={bilikRooms} onEdit={openEditRoom} onDelete={handleDeleteRoom} emptyMessage="No rooms in this Bilik yet." />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Room Modal */}
      {roomModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-5 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">{editingRoomId ? 'Edit Room' : 'Add New Room'}</h2>
              <button onClick={() => setRoomModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={22} /></button>
            </div>
            <form onSubmit={handleSaveRoom} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Room Name</label>
                <input type="text" placeholder="e.g. Kitchen"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 bg-gray-50 outline-none focus:border-primary transition-colors"
                  value={roomForm.name} onChange={e => setRoomForm(f => ({ ...f, name: e.target.value }))} />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Space Type</label>
                <div className="flex gap-2">
                  {SPACE_TYPES.map(([val, label]) => (
                    <button key={val} type="button"
                      onClick={() => setRoomForm(f => ({ ...f, spaceType: val, bilikId: val === 'BILIK_ROOM' ? f.bilikId : '' }))}
                      className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${roomForm.spaceType === val ? 'border-primary bg-primary-light text-primary' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {roomForm.spaceType === 'BILIK_ROOM' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bilik</label>
                  <select
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 bg-gray-50 outline-none focus:border-primary transition-colors"
                    value={roomForm.bilikId} onChange={e => setRoomForm(f => ({ ...f, bilikId: e.target.value }))}>
                    <option value="">Select Bilik</option>
                    {biliks.map(b => (
                      <option key={b.id} value={b.id}>{b.number}{b.householdName ? ` (${b.householdName})` : ''}</option>
                    ))}
                  </select>
                  {biliks.length === 0 && <p className="text-xs text-gray-400 mt-1.5">No Bilik yet — add one first.</p>}
                </div>
              )}

              {roomFormError && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle size={14} className="shrink-0" />
                  <p className="text-sm">{roomFormError}</p>
                </div>
              )}
              <button type="submit" disabled={submittingRoom}
                className="w-full bg-primary hover:bg-primary-hover disabled:bg-red-300 text-white font-bold py-3 rounded-xl transition-colors">
                {submittingRoom ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" /> : editingRoomId ? 'Save Changes' : 'Create Room'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bilik Modal */}
      {bilikModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-5 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">{editingBilikId ? 'Edit Bilik' : 'Add New Bilik'}</h2>
              <button onClick={() => setBilikModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={22} /></button>
            </div>
            <form onSubmit={handleSaveBilik} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bilik Number</label>
                <input type="text" placeholder="e.g. Bilik 3"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 bg-gray-50 outline-none focus:border-primary transition-colors"
                  value={bilikForm.bilikNumber} onChange={e => setBilikForm(f => ({ ...f, bilikNumber: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Household Name (optional)</label>
                <input type="text" placeholder="e.g. Family of Anak Bujang"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 bg-gray-50 outline-none focus:border-primary transition-colors"
                  value={bilikForm.householdName} onChange={e => setBilikForm(f => ({ ...f, householdName: e.target.value }))} />
              </div>
              {bilikFormError && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle size={14} className="shrink-0" />
                  <p className="text-sm">{bilikFormError}</p>
                </div>
              )}
              <button type="submit" disabled={submittingBilik}
                className="w-full bg-primary hover:bg-primary-hover disabled:bg-red-300 text-white font-bold py-3 rounded-xl transition-colors">
                {submittingBilik ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" /> : editingBilikId ? 'Save Changes' : 'Create Bilik'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
