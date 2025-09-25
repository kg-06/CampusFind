import React, { useEffect, useState } from 'react'
import { connectSocket, getSocket } from '../services/socket'
import { getToken } from '../services/auth'


export default function Chat({ matchId }) {
const [messages, setMessages] = useState([])
const [text, setText] = useState('')
useEffect(() => {
const socket = connectSocket()
if (!socket) return
socket.emit('join', { matchId })
socket.on('message:new', ({ msg }) => {
setMessages(prev => [...prev, msg])
})
return () => {
socket.off('message:new')
}
}, [matchId])


const send = () => {
const socket = getSocket()
if (!socket) return
socket.emit('message:send', { matchId, text })
setText('')
}


return (
<div className="max-w-3xl mx-auto mt-6 bg-white rounded shadow p-4">
<h3 className="font-semibold">Chat (match {matchId})</h3>
<div className="h-64 overflow-auto border p-2 my-2 bg-gray-50">
{messages.map((m, i) => (
<div key={i} className="p-1"><b>{m.sender}</b>: {m.text}</div>
))}
</div>
<div className="flex gap-2">
<input className="flex-1 p-2 border" value={text} onChange={e=>setText(e.target.value)} placeholder="Type a message" />
<button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={send}>Send</button>
</div>
</div>
)
}