import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flame, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { API_BASE_URL } from '../constants/api'

export default function Login() {
  const { setUser } = useApp()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('Email and password are required.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed. Please try again.'); return }
      setUser({ ...data.user, token: data.token })
      navigate('/users', { replace: true })
    } catch {
      setError('Unable to connect to the server. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 w-full max-w-md">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-3">
            <Flame size={32} color="#fff" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">FireBomba</h1>
          <p className="text-sm text-gray-500 mt-1">Admin Portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
            <div className={`flex items-center border-2 rounded-xl px-3.5 bg-white transition-colors ${error ? 'border-red-200 bg-red-50' : 'border-gray-200 focus-within:border-primary'}`}>
              <Mail size={18} className="text-gray-400 shrink-0 mr-2.5" />
              <input
                type="email"
                className="flex-1 py-3.5 text-sm text-gray-900 bg-transparent outline-none placeholder-gray-400"
                placeholder="admin@firebomba.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError('') }}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
            <div className={`flex items-center border-2 rounded-xl px-3.5 bg-white transition-colors ${error ? 'border-red-200 bg-red-50' : 'border-gray-200 focus-within:border-primary'}`}>
              <Lock size={18} className="text-gray-400 shrink-0 mr-2.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="flex-1 py-3.5 text-sm text-gray-900 bg-transparent outline-none placeholder-gray-400"
                placeholder="Enter password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                disabled={loading}
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} className="p-1 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle size={15} className="shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover disabled:bg-red-300 text-white font-bold py-3.5 rounded-xl transition-colors mt-2"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Signing in...</span>
              </div>
            ) : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-7">FireBomba Admin © 2026</p>
      </div>
    </div>
  )
}
