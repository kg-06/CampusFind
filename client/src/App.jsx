import React, { useState } from 'react'
import NavBar from './components/NavBar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import { getToken } from './services/auth'
import './index.css'


export default function App() {
const [user, setUser] = useState(null)
const token = getToken()


return (
<div className="min-h-screen flex flex-col">
<NavBar onLogout={() => setUser(null)} />
<main className="flex-1">
{!token ? (
<Login onLogin={(u)=>setUser(u)} />
) : (
<Dashboard onLogout={() => setUser(null)} />
)}
</main>
</div>
)
}