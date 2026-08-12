import { useState, useEffect, useCallback } from 'react'
import client from './client'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const res = await client.get('/auth/me')
      setUser(res.data)
    } catch {
      localStorage.removeItem('token')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchMe() }, [fetchMe])

  const login = async (email, password) => {
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)
    const res = await client.post('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    localStorage.setItem('token', res.data.access_token)
    await fetchMe()
  }

  const register = async (email, password, full_name) => {
    await client.post('/auth/register', { email, password, full_name })
    await login(email, password)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  return { user, loading, login, register, logout }
}
