import { useState, useEffect, useCallback, useMemo } from 'react'
import { Bell, AlertCircle, CheckCircle, BellOff, Search, Filter, ChevronUp, ChevronDown, Check, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { API_BASE_URL } from '../constants/api'

function formatDateTime(d) {
  if (!d) return '—'
  const dt = new Date(d)
  return dt.toISOString().slice(0, 10) + '\n' + dt.toTimeString().slice(0, 5)
}

export default function Alerts() {
  const { user } = useApp()
  const authHeader = { Authorization: `Bearer ${user?.token}` }

  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [showSort, setShowSort] = useState(false)
  const [unreadOnly, setUnreadOnly] = useState(false)

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/alerts`, { headers: authHeader })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch alerts')
      setAlerts(data.alerts.map(a => ({
        id: a.alert_id,
        roomId: a.room_id,
        time: a.timestamp,
        title: a.warning_title,
        isRead: !!a.is_read,
      })))
    } catch (err) { alert(err.message) }
  }, [user?.token])

  useEffect(() => { fetchAlerts().finally(() => setLoading(false)) }, [fetchAlerts])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const res = alerts.filter(a =>
      ((a.title ?? '').toLowerCase().includes(q) || String(a.roomId).includes(q)) &&
      (unreadOnly ? !a.isRead : true)
    )
    return [...res].sort((a, b) => {
      const ta = new Date(a.time).getTime()
      const tb = new Date(b.time).getTime()
      return sortBy === 'oldest' ? ta - tb : tb - ta
    })
  }, [alerts, search, sortBy, unreadOnly])

  const total = alerts.length
  const unreadCount = alerts.filter(a => !a.isRead).length
  const readCount = alerts.filter(a => a.isRead).length

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-primary px-6 py-5">
        <h1 className="text-white text-2xl font-bold">Alert Notifications</h1>
        <p className="text-white/75 text-sm mt-0.5 mb-4">Monitor and acknowledge system alerts</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { Icon: Bell, count: total, label: 'Total' },
            { Icon: AlertCircle, count: unreadCount, label: 'Unread' },
            { Icon: CheckCircle, count: readCount, label: 'Acknowledged' },
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
              placeholder="Search by warning title or room ID..." value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button onClick={() => setSearch('')}><X size={16} className="text-gray-400 hover:text-gray-600" /></button>}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setShowSort(v => !v)}
                className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-2 rounded-xl text-sm font-semibold text-gray-700 min-w-[130px] shadow-sm">
                <Filter size={14} className="text-gray-500" />
                <span className="flex-1 text-left">{sortBy === 'oldest' ? 'Oldest First' : 'Newest First'}</span>
                {showSort ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {showSort && <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSort(false)} />
                <div className="absolute top-11 left-0 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-[160px] py-1">
                  {[['newest', 'Newest First'], ['oldest', 'Oldest First']].map(([val, label]) => (
                    <button key={val} onClick={() => { setSortBy(val); setShowSort(false) }}
                      className="flex items-center justify-between w-full px-4 py-2.5 text-sm hover:bg-gray-50">
                      <span className={sortBy === val ? 'text-primary font-semibold' : 'text-gray-700'}>{label}</span>
                      {sortBy === val && <Check size={15} className="text-primary" />}
                    </button>
                  ))}
                </div>
              </>}
            </div>

            <button onClick={() => setUnreadOnly(v => !v)}
              className={`px-3 py-2 rounded-xl border text-sm font-semibold transition-colors ${unreadOnly ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white border-gray-200 text-gray-700'}`}>
              Unread Only
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-center px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide w-[10%]">Room</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide w-[20%]">Time</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Warning Title</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="text-center py-12">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={3} className="text-center py-12">
                  <BellOff size={40} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No alerts found.</p>
                </td></tr>
              ) : filtered.map((a, i) => (
                <tr key={a.id} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <td className="px-4 py-3.5 text-center">
                    <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2.5 py-1 rounded-lg">#{a.roomId}</span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {formatDateTime(a.time).split('\n').map((line, idx) => (
                      <p key={idx} className="text-xs text-gray-400 leading-5">{line}</p>
                    ))}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${!a.isRead ? 'bg-primary' : 'bg-gray-300'}`} />
                      <span className="text-sm font-medium text-gray-900">{a.title}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
