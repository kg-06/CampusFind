import React from 'react'
import { clearToken, getToken } from '../services/auth'

export default function NavBar({ onLogout }) {
  const token = getToken()

  const handleLogout = () => {
    clearToken()
    if (typeof onLogout === 'function') onLogout()
  }

  return (
    <div className="bg-white shadow p-4 flex items-center justify-between">
      <div className="text-xl font-semibold">CampusFind</div>
      <div className="flex items-center gap-3">
        {token ? (
          <button
            className="px-3 py-1 rounded bg-red-500 text-white"
            onClick={handleLogout}
          >
            Logout
          </button>
        ) : null}
      </div>
    </div>
  )
}
