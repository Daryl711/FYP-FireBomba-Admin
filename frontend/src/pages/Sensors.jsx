import { useState, useEffect, useCallback, useMemo } from 'react'
import { Cpu, CheckCircle, XCircle, Search, Filter, ChevronUp, ChevronDown, Check, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { API_BASE_URL } from '../constants/api'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toISOString().slice(0, 10)
}

export default function Sensors() {
  const { user } = useApp()
  const authHeader = { Authorization: `Bearer ${user?.token}` }

  const [sensors, setSensors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('id')
  const [showSort, setShowSort] = useState(false)
  const [offlineOnly, setOfflineOnly] = useState(false)

  const fetchSensors = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/sensors`, { headers: authHeader })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch sensors')
      setSensors(data.sensors.map(s => ({
        id: s.sensor_id,
        roomId: s.room_id,
        roomName: s.room_name,
        type: s.sensor_type,
        isOnline: s.status === 1 || s.status === true,
        lastUpdated: formatDate(s.last_updated),
      })))
    } catch (err) { alert(err.message) }
  }, [user?.token])

  useEffect(() => { fetchSensors().finally(() => setLoading(false)) }, [fetchSensors])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const res = sensors.filter(s =>
      (s.type.toLowerCase().includes(q) || s.roomName.toLowerCase().includes(q)) &&
      (offlineOnly ? !s.isOnline : true)
    )
    return [...res].sort((a, b) => {
      if (sortBy === 'type') return a.type.localeCompare(b.type)
      if (sortBy === 'room') return a.roomId - b.roomId
      return a.id - b.id
    })
  }, [sensors, search, sortBy, offlineOnly])

  const total = sensors.length
  const onlineCount = sensors.filter(s => s.isOnline).length
  const offlineCount = sensors.filter(s => !s.isOnline).length

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-primary px-6 py-5">
        <h1 className="text-white text-2xl font-bold">Sensor Management</h1>
        <p className="text-white/75 text-sm mt-0.5 mb-4">Monitor sensor status across all rooms</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { Icon: Cpu, count: total, label: 'Total' },
            { Icon: CheckCircle, count: onlineCount, label: 'Online' },
            { Icon: XCircle, count: offlineCount, label: 'Offline' },
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
              placeholder="Search by sensor type or room..." value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button onClick={() => setSearch('')}><X size={16} className="text-gray-400 hover:text-gray-600" /></button>}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setShowSort(v => !v)}
                className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-2 rounded-xl text-sm font-semibold text-gray-700 min-w-[130px] shadow-sm">
                <Filter size={14} className="text-gray-500" />
                <span className="flex-1 text-left">
                  {sortBy === 'type' ? 'Sort by Type' : sortBy === 'room' ? 'Sort by Room' : 'Sort by ID'}
                </span>
                {showSort ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {showSort && <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSort(false)} />
                <div className="absolute top-11 left-0 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-[160px] py-1">
                  {[['id', 'Sort by ID'], ['room', 'Sort by Room'], ['type', 'Sort by Type']].map(([val, label]) => (
                    <button key={val} onClick={() => { setSortBy(val); setShowSort(false) }}
                      className="flex items-center justify-between w-full px-4 py-2.5 text-sm hover:bg-gray-50">
                      <span className={sortBy === val ? 'text-primary font-semibold' : 'text-gray-700'}>{label}</span>
                      {sortBy === val && <Check size={15} className="text-primary" />}
                    </button>
                  ))}
                </div>
              </>}
            </div>

            <button onClick={() => setOfflineOnly(v => !v)}
              className={`px-3 py-2 rounded-xl border text-sm font-semibold transition-colors ${offlineOnly ? 'bg-yellow-50 border-yellow-300 text-yellow-800' : 'bg-white border-gray-200 text-gray-700'}`}>
              Offline Only
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-center px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide w-[10%]">ID</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide w-[30%]">Sensor</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide w-[15%]">Room</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide w-[20%]">Status</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide w-[20%]">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12">
                  <Cpu size={40} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No sensors found.</p>
                </td></tr>
              ) : filtered.map((s, i) => (
                <tr key={s.id} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <td className="px-4 py-3.5 text-center">
                    <span className="inline-block bg-gray-100 text-gray-700 text-xs font-bold px-2.5 py-1 rounded-lg">#{s.id}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-semibold text-gray-900">{s.type}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.roomName}</p>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2.5 py-1 rounded-lg">#{s.roomId}</span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.isOnline ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {s.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center text-xs text-gray-400">{s.lastUpdated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
