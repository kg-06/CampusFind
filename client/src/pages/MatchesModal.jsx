import React, { useState, useEffect } from 'react'
import { postJSON, getJSON } from '../services/api'
import { getToken } from '../services/auth'

export default function MatchesModal({ matches = [], onClose, onOpenChat, onRefetch }) {
  const token = getToken()
  const [meta, setMeta] = useState({}) // matchId -> meta

  useEffect(() => {
    let mounted = true
    const load = async () => {
      const ids = matches.map(m => m.matchId).filter(Boolean)
      const map = {}
      try {
        await Promise.all(ids.map(async (id) => {
          try {
            const m = await getJSON(`/api/matches/${id}`, token)
            if (mounted && m && m._id) map[id] = m
          } catch (e) {}
        }))
        if (mounted) setMeta(map)
      } catch (e) { console.error(e) }
    }
    load()
    return () => { mounted = false }
  }, [matches, token])

  const confirm = async (matchId) => {
    try {
      await postJSON(`/api/matches/${matchId}/confirm`, {}, token)
      alert('Confirmed. If both parties confirmed, match will be closed.')
      if (typeof onRefetch === 'function') onRefetch()
      // refresh this modal's meta
      const updated = await getJSON(`/api/matches/${matchId}`, token)
      setMeta(prev => ({ ...prev, [matchId]: updated }))
    } catch (err) {
      console.error('confirm failed', err)
      alert('Confirm failed: ' + (err.message || err))
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white max-w-2xl w-full p-6 rounded">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Potential Matches</h3>
          <button onClick={onClose} className="text-gray-500">Close</button>
        </div>
        {matches.length === 0 ? (
          <div className="p-8 text-center text-gray-600">No matches yet. We'll notify you when a match appears.</div>
        ) : (
          <div className="space-y-3">
            {matches.map(m => {
              const mm = meta[m.matchId] || {}
              const closed = mm.status === 'closed' || mm.status === 'verified'
              // We don't know which side we are in modal context; keep confirm enabled and let server decide authorization
              const confirmedByMe = (mm.lostConfirmed && mm.lostRequestId && mm.lostRequestId.owner === mm.currentUserId) || false
              // Simpler: disable if closed or if current user already set the corresponding flag; server enforces anyway
              return (
                <div key={m.matchId} className="p-3 border rounded flex justify-between items-center">
                  <div>
                    <div className="font-semibold">Score: {(m.score||0).toFixed(2)}</div>
                    <div className="text-sm text-gray-600">Matched Request ID: {m.matchedRequestId}</div>
                    {mm && (mm.lostConfirmed || mm.foundConfirmed) && !closed && (
                      <div className="inline-block mt-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded">Pending confirmation</div>
                    )}
                    {closed && <div className="inline-block mt-1 px-2 py-0.5 bg-gray-800 text-white text-xs rounded ml-2">CLOSED</div>}
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={() => onOpenChat(m.matchId)}>Open Chat</button>
                    <button
                      className="px-3 py-1 bg-gray-700 text-white rounded"
                      onClick={() => confirm(m.matchId)}
                      disabled={closed}
                      style={{ opacity: closed ? 0.5 : 1 }}
                    >Confirm</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
