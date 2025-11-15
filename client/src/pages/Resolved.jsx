import React, { useEffect, useState } from 'react'
import { getJSON } from '../services/api'
import { getToken } from '../services/auth'

export default function Resolved() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const token = getToken()

  useEffect(() => {
    (async () => {
      try {
        const res = await getJSON('/api/matches/resolved/all', token)
        if (res && res.matches) setMatches(res.matches)
      } catch (err) {
        console.error('Failed to load resolved matches', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [token])

  if (loading) return <div className="p-6">Loading...</div>
  if (!matches.length) return <div className="p-6 text-gray-600">No successful matches yet.</div>

  return (
    <div className="p-4 space-y-4">
      {matches.map((m) => (
        <div key={m._id} className="flex items-start gap-4">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-gray-500" />
            <div className="w-px flex-1 bg-gray-300" style={{ minHeight: 40 }} />
          </div>
          <div className="flex-1 bg-gray-100 p-4 rounded">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold text-gray-800">{m.lostRequestId?.title || 'Lost Item'}</div>
                <div className="text-sm text-gray-600">{m.lostRequestId?.locationText || ''} • {m.lostRequestId?.category || ''}</div>
                <div className="text-xs text-gray-500 mt-1">By: {m.lostRequestId?.owner?.name || m.lostRequestId?.owner?.email || 'Unknown'}</div>
              </div>
              <div className="text-right">
                <div className="inline-block px-2 py-1 text-xs bg-gray-800 text-white rounded">CLOSED</div>
                <div className="text-xs text-gray-500 mt-2">{m.closedAt ? new Date(m.closedAt).toLocaleString() : ''}</div>
              </div>
            </div>

            <div className="mt-3 border-t pt-3">
              <div className="text-sm font-semibold text-gray-800">Found item</div>
              <div className="text-sm text-gray-600">{m.foundRequestId?.title || 'Found Item'}</div>
              <div className="text-xs text-gray-500 mt-1">By: {m.foundRequestId?.owner?.name || m.foundRequestId?.owner?.email || 'Unknown'}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
