import React, { useState, useEffect } from 'react'
import CreateRequest from './CreateRequest'
import MatchesModal from './MatchesModal'
import Chat from './Chat'
import { getToken } from '../services/auth'
import { getJSON } from '../services/api'

export default function Dashboard({ onLogout }) {
  const [showCreateKind, setShowCreateKind] = useState(null)
  const [matches, setMatches] = useState([])
  const [selectedMatchId, setSelectedMatchId] = useState(null)
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const token = getToken()

  const fetchMyRequests = async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await getJSON('/api/requests/me', token)
      if (res && res.requests) {
        setRequests(res.requests)
      } else {
        setRequests([])
      }
    } catch (err) {
      console.error('Failed to fetch requests', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMyRequests()
  }, []) 

  const handleCreated = async (createdRequest) => {
    await fetchMyRequests()
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-6 bg-white rounded shadow text-center">
            <h3 className="text-xl font-semibold mb-2">I Lost Something</h3>
            <p className="text-sm text-gray-500 mb-4">Report an item you lost. We will privately check for matches.</p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={()=>setShowCreateKind('lost')}>Report Lost</button>
          </div>
          <div className="p-6 bg-white rounded shadow text-center">
            <h3 className="text-xl font-semibold mb-2">I Found Something</h3>
            <p className="text-sm text-gray-500 mb-4">Report an item you found and we'll notify possible owners.</p>
            <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={()=>setShowCreateKind('found')}>Report Found</button>
          </div>
        </div>

        {showCreateKind && (
          <div className="mb-6">
            <CreateRequest kind={showCreateKind} onCreated={(req) => { handleCreated(req); setShowCreateKind(null); }} />
          </div>
        )}

        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-2">Your Requests</h4>
          {loading ? (
            <div className="p-4 bg-white rounded shadow text-sm text-gray-600">Loading...</div>
          ) : requests.length === 0 ? (
            <div className="p-4 bg-white rounded shadow text-sm text-gray-600">You have not created any requests yet.</div>
          ) : (
            <div className="space-y-3">
              {requests.map(r => (
                <div key={r._id} className="p-4 bg-white rounded shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm text-gray-500">{new Date(r.createdAt).toLocaleString()}</div>
                      <div className="font-semibold">{r.title || '(no title)'} <span className="ml-2 text-xs text-gray-500">[{r.kind}]</span></div>
                      <div className="text-sm text-gray-600">{r.description}</div>
                      <div className="text-xs text-gray-500 mt-1">Location: {r.locationText || '—'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">Status: <span className="font-medium">{r.status}</span></div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="text-sm font-medium mb-2">Matches:</div>
                    {(!r._matches || r._matches.length === 0) ? (
                      <div className="text-sm text-gray-500">No matches yet.</div>
                    ) : (
                      <div className="space-y-2">
                        {r._matches.map((m, idx) => (
                          <div key={idx} className="p-2 border rounded flex justify-between items-center">
                            <div>
                              <div className="text-sm font-semibold">{m.matchedRequest ? m.matchedRequest.title : 'No title'}</div>
                              <div className="text-xs text-gray-600">Category: {m.matchedRequest?.category || '—'} • Loc: {m.matchedRequest?.locationText || '—'}</div>
                              <div className="text-xs text-gray-500">Score: {m.score ? m.score.toFixed(2) : '—'}</div>
                            </div>
                            <div>
                              <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => setSelectedMatchId(m.matchId)}>Open Chat</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {selectedMatchId && <div className="mt-6"><Chat matchId={selectedMatchId} /></div>}
    </div>
  )
}
