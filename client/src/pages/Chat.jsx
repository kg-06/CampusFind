import React, { useEffect, useState, useRef } from 'react'
import { connectSocket, getSocket } from '../services/socket'
import { getToken } from '../services/auth'
import { getJSON } from '../services/api'

export default function Chat({ matchId, onClose }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const listRef = useRef(null)
  const token = getToken()

  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (!matchId) return
    setError(null)
    setLoading(true)

    const socketWrapper = connectSocket()
    if (!socketWrapper) {
      setError('Socket not available. Are you signed in?')
      setLoading(false)
      return
    }

    const socket = (typeof socketWrapper.on === 'function') ? socketWrapper : (socketWrapper && socketWrapper.socket && typeof socketWrapper.socket.on === 'function' ? socketWrapper.socket : socketWrapper)
    if (!socket) {
      console.error('Chat: invalid socket object', socketWrapper)
      setError('Socket connection error (invalid socket object).')
      setLoading(false)
      return
    }

    function handleConnect() { console.log('socket connected', socket.id) }
    function handleDisconnect(reason) { console.log('socket disconnected', reason) }
    function handleConnectError(err) { console.log('socket connect_error', err && err.message); }
    function handleMessageNew(payload) {
      const msg = payload && payload.msg ? payload.msg : payload
      setMessages(prev => [...prev, msg])
    }

    function handleMatchCancelled(payload) {
      if (!payload) return
      if (payload.matchId === matchId || payload.lostRequestId === matchId || payload.foundRequestId === matchId) {
        // match cancelled/affected -> notify user and close
        setError('This match was cancelled or closed. Chat is no longer available.')
        setTimeout(() => {
          if (typeof onClose === 'function') onClose()
          else setVisible(false)
        }, 1200)
      }
    }

    function handleMatchUpdated(payload) {
      if (!payload) return
      if (payload.matchId === matchId && payload.status && payload.status !== 'open') {
        setError('This match status changed — chat will close.')
        setTimeout(() => {
          if (typeof onClose === 'function') onClose()
          else setVisible(false)
        }, 1200)
      }
    }

    if (typeof socket.on === 'function') {
      socket.on('connect', handleConnect)
      socket.on('disconnect', handleDisconnect)
      socket.on('connect_error', handleConnectError)
      socket.on('message:new', handleMessageNew)
      socket.on('match:cancelled', handleMatchCancelled)
      socket.on('match:updated', handleMatchUpdated)
      socket.on('match:closed', handleMatchCancelled)
      socket.on('error', (d) => {
        // server side socket errors sometimes arrive here
        console.warn('socket error event', d)
        const msg = (d && d.message) ? d.message : (typeof d === 'string' ? d : null)
        if (msg) setError(msg)
      })
    } else if (typeof socket.addEventListener === 'function') {
      socket.addEventListener('message:new', handleMessageNew)
      // addEventListener for custom events might not be available cross libs; keep minimum
    }

    try {
      if (typeof socket.emit === 'function') socket.emit('join', { matchId })
      else if (typeof socket.dispatchEvent === 'function') socket.dispatchEvent(new CustomEvent('join', { detail: { matchId } }))
    } catch (e) {
      console.error('emit join failed', e)
    }

    (async () => {
      try {
        const res = await getJSON(`/api/matches/${matchId}/messages`, token)
        if (!res) throw new Error('Empty response fetching messages')
        setMessages(res.messages || [])
      } catch (err) {
        console.error('Failed to load chat history', err)
        setError('Failed to load chat history: ' + (err.message || err))
      } finally {
        setLoading(false)
      }
    })()

    return () => {
      try {
        if (typeof socket.off === 'function') {
          socket.off('message:new', handleMessageNew)
          socket.off('connect', handleConnect)
          socket.off('disconnect', handleDisconnect)
          socket.off('connect_error', handleConnectError)
          socket.off('match:cancelled', handleMatchCancelled)
          socket.off('match:updated', handleMatchUpdated)
          socket.off('match:closed', handleMatchCancelled)
        } else if (typeof socket.removeEventListener === 'function') {
          socket.removeEventListener('message:new', handleMessageNew)
        }
      } catch (e) {}
    }
  }, [matchId, token])

  useEffect(() => {
    try { listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) } catch (e) {}
  }, [messages])

  const send = () => {
    if (!text || text.trim() === '') return
    const sock = getSocket()
    const realSock = (sock && typeof sock.emit === 'function') ? sock : (sock && sock.socket ? sock.socket : null)
    if (!realSock || !realSock.connected) {
      alert('Socket not connected — cannot send message')
      return
    }
    try {
      if (typeof realSock.emit === 'function') realSock.emit('message:send', { matchId, text })
      else if (typeof realSock.dispatchEvent === 'function') realSock.dispatchEvent(new CustomEvent('message:send', { detail: { matchId, text } }))
      else console.warn('Chat: cannot emit message:send on socket')
    } catch (e) {
      console.warn('message emit failed', e)
    }
    setText('')
  }

  const handleClose = () => {
    if (typeof onClose === 'function') onClose()
    else setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-white w-full max-w-2xl max-h-[80vh] rounded shadow-lg overflow-hidden">
        <div className="p-3 border-b flex justify-between items-center">
          <div className="font-semibold">Chat</div>
          <button className="text-sm text-gray-600" onClick={handleClose}>Close</button>
        </div>

        <div className="p-4 h-[60vh] overflow-auto bg-gray-50">
          {loading ? (
            <div className="text-center text-gray-500">Loading messages…</div>
          ) : error ? (
            <div className="p-3 bg-red-50 text-red-700 rounded">{error}</div>
          ) : (
            <div className="space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500">No messages yet — say hi 👋</div>
              ) : (
                messages.map((m, idx) => (
                  <div key={m._id || idx} className="p-2 rounded bg-white">
                    <div className="text-xs text-gray-500 mb-1">
                      <span className="font-medium">{m.sender?.name || m.sender?.email || (m.sender || 'User')}</span>
                      <span className="ml-2 text-xs text-gray-400">{new Date(m.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="text-sm">{m.text}</div>
                  </div>
                ))
              )}
              <div ref={listRef} />
            </div>
          )}
        </div>

        <div className="p-3 border-t flex gap-2">
          <input
            className="flex-1 p-2 border rounded"
            placeholder="Type a message"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send() }}
          />
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={send}>Send</button>
        </div>
      </div>
    </div>
  )
}
