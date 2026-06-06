import { useState, useEffect, useCallback, useMemo } from 'react'
import { ClipboardList, Search, X, Filter, ChevronUp, ChevronDown, Check, ToggleLeft, Trash2, AlertCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { API_BASE_URL } from '../constants/api'

function formatDateTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-MY', {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

const ACTION_STYLES = {
  'Sensor Enabled':  { bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500',  Icon: ToggleLeft },
  'Sensor Disabled': { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-400', Icon: ToggleLeft },
  'Sensor Deleted':  { bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-500',    Icon: Trash2    },
}

function ActionBadge({ action }) {
  const style = ACTION_STYLES[action] ?? { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400', Icon: AlertCircle }
  const { bg, text, dot } = style
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {action}
    </span>
  )
}

export default function AuditLog() {
  const { user } = useApp()
  const authHeader = { Authorization: `Bearer ${user?.token}` }

  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [showSort, setShowSort] = useState(false)
  const [actionFilter, setActionFilter] = useState('all')
  const [showActionFilter, setShowActionFilter] = useState(false)

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/audit-logs`, { headers: authHeader })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch audit logs')
      setLogs(data.logs)
    } catch (err) { alert(err.message) }
  }, [user?.token])

  useEffect(() => { fetchLogs().finally(() => setLoading(false)) }, [fetchLogs])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const result = logs.filter(l =>
      (l.performed_by?.toLowerCase().includes(q) ||
       l.action?.toLowerCase().includes(q) ||
       l.sensor_type?.toLowerCase().includes(q) ||
       l.room_name?.toLowerCase().includes(q) ||
       l.details?.toLowerCase().includes(q)) &&
      (actionFilter === 'all' || l.action === actionFilter)
    )
    return [...result].sort((a, b) => {
      const ta = new Date(a.timestamp).getTime()
      const tb = new Date(b.timestamp).getTime()
      return sortBy === 'oldest' ? ta - tb : tb - ta
    })
  }, [logs, search, sortBy, actionFilter])

  const totalLogs = logs.length
  const enabledCount = logs.filter(l => l.action === 'Sensor Enabled').length
  const disabledCount = logs.filter(l => l.action === 'Sensor Disabled').length
  const deletedCount = logs.filter(l => l.action === 'Sensor Deleted').length

  const ACTION_OPTIONS = [
    ['all', 'All Actions'],
    ['Sensor Enabled', 'Sensor Enabled'],
    ['Sensor Disabled', 'Sensor Disabled'],
    ['Sensor Deleted', 'Sensor Deleted'],
  ]

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-primary px-6 py-5">
        <h1 className="text-white text-2xl font-bold">Audit Log</h1>
        <p className="text-white/75 text-sm mt-0.5 mb-4">Track all sensor actions performed by admins</p>
        <div className="grid grid-cols-4 gap-3">
          {[
            { count: totalLogs,    label: 'Total',    color: 'text-white' },
            { count: enabledCount, label: 'Enabled',  color: 'text-green-300' },
            { count: disabledCount,label: 'Disabled', color: 'text-yellow-300' },
            { count: deletedCount, label: 'Deleted',  color: 'text-red-300' },
          ].map(({ count, label, color }) => (
            <div key={label} className="bg-white/15 border border-white/10 rounded-xl p-3 text-center">
              <ClipboardList size={18} className="text-white/80 mx-auto mb-1" />
              <div className={`text-2xl font-bold ${color}`}>{count}</div>
              <div className="text-white/75 text-xs font-medium mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="mb-3 space-y-3">
          {/* Search */}
          <div className="flex items-center bg-white border-2 border-gray-200 rounded-xl px-4 py-2.5 gap-2.5 shadow-sm focus-within:border-primary transition-colors">
            <Search size={16} className="text-gray-400 shrink-0" />
            <input
              className="flex-1 outline-none text-sm text-gray-900 placeholder-gray-400 bg-transparent"
              placeholder="Search by admin, action, sensor or room..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button onClick={() => setSearch('')}><X size={16} className="text-gray-400 hover:text-gray-600" /></button>}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            {/* Sort */}
            <div className="relative">
              <button onClick={() => setShowSort(v => !v)}
                className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-2 rounded-xl text-sm font-semibold text-gray-700 min-w-[140px] shadow-sm">
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

            {/* Action filter */}
            <div className="relative">
              <button onClick={() => setShowActionFilter(v => !v)}
                className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-2 rounded-xl text-sm font-semibold text-gray-700 min-w-[150px] shadow-sm">
                <span className="flex-1 text-left">{ACTION_OPTIONS.find(([v]) => v === actionFilter)?.[1] ?? 'All Actions'}</span>
                {showActionFilter ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {showActionFilter && <>
                <div className="fixed inset-0 z-10" onClick={() => setShowActionFilter(false)} />
                <div className="absolute top-11 left-0 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-[180px] py-1">
                  {ACTION_OPTIONS.map(([val, label]) => (
                    <button key={val} onClick={() => { setActionFilter(val); setShowActionFilter(false) }}
                      className="flex items-center justify-between w-full px-4 py-2.5 text-sm hover:bg-gray-50">
                      <span className={actionFilter === val ? 'text-primary font-semibold' : 'text-gray-700'}>{label}</span>
                      {actionFilter === val && <Check size={15} className="text-primary" />}
                    </button>
                  ))}
                </div>
              </>}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-center px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide w-[6%]">#</th>
                <th className="text-left   px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide w-[18%]">Performed By</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide w-[18%]">Action</th>
                <th className="text-left   px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide w-[14%]">Sensor</th>
                <th className="text-left   px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide w-[14%]">Room</th>
                <th className="text-left   px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide w-[18%]">Details</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide w-[12%]">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12">
                  <ClipboardList size={40} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No audit logs found.</p>
                </td></tr>
              ) : filtered.map((log, i) => (
                <tr key={log.log_id} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <td className="px-4 py-3.5 text-center">
                    <span className="inline-block bg-gray-100 text-gray-700 text-xs font-bold px-2.5 py-1 rounded-lg">#{log.log_id}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-semibold text-gray-900">{log.performed_by ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <ActionBadge action={log.action} />
                  </td>
                  <td className="px-4 py-3.5 text-sm text-gray-700">
                    {log.sensor_type ? (
                      <>
                        <span className="font-medium">{log.sensor_type}</span>
                        <span className="text-gray-400 text-xs ml-1">#{log.sensor_id}</span>
                      </>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-gray-700">{log.room_name ?? '—'}</td>
                  <td className="px-4 py-3.5 text-xs text-gray-500">{log.details ?? '—'}</td>
                  <td className="px-4 py-3.5 text-center text-xs text-gray-400 whitespace-nowrap">{formatDateTime(log.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
