import React from 'react'
import { clearToken, getToken } from '../services/auth'


export default function NavBar({ onLogout }) {
const token = getToken()
return (
<div className="bg-white shadow p-4 flex items-center justify-between">
<div className="text-xl font-semibold">CampusFind</div>
<div className="flex items-center gap-3">
{token ? (
<button className="px-3 py-1 rounded bg-red-500 text-white" onClick={() => { clearToken(); onLogout && onLogout() }}>Logout</button>
) : null}
</div>
</div>
)
}