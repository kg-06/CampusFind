import React, { useState, useEffect } from 'react'
import CreateRequest from './CreateRequest'
import MatchesModal from './MatchesModal'
import Chat from './Chat'
import Resolved from './Resolved'
import { getToken } from '../services/auth'
import { getJSON, postJSON } from '../services/api'
import { getSocket, connectSocket } from '../services/socket'

export default function Dashboard({ onLogout }) {
  const [showCreateKind, setShowCreateKind] = useState(null)
  const [selectedMatchId, setSelectedMatchId] = useState(null)
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [showResolvedPage, setShowResolvedPage] = useState(false)
  const [matchMeta, setMatchMeta] = useState({}) // map matchId -> match object
  const token = getToken()

  const fetchMyRequests = async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await getJSON('/api/requests/me', token)
      if (res && res.requests) {
        setRequests(res.requests)
        // once requests fetched, load match metadata for any matches we haven't loaded
        const allMatchIds = []
        for (const r of res.requests) {
          if (r._matches && r._matches.length) {
            for (const m of r._matches) {
              if (m.matchId) allMatchIds.push(m.matchId)
            }
          }
        }
        const unique = [...new Set(allMatchIds)]
        if (unique.length) await loadMatchMeta(unique)
      } else {
        setRequests([])
        setMatchMeta({})
      }
    } catch (err) {
      console.error('Failed to fetch requests', err)
    } finally {
      setLoading(false)
    }
  }

  // loads metadata for given match ids and stores into matchMeta
  const loadMatchMeta = async (matchIds = []) => {
    if (!matchIds || matchIds.length === 0) return
    const newMeta = { ...matchMeta }
    try {
      await Promise.all(matchIds.map(async (id) => {
        try {
          const m = await getJSON(`/api/matches/${id}`, token)
          if (m && m._id) newMeta[id] = m
        } catch (e) {
          console.warn('Failed to fetch match meta for', id, e)
        }
      }))
      setMatchMeta(newMeta)
    } catch (e) {
      console.error('loadMatchMeta failed', e)
    }
  }

  useEffect(() => {
    fetchMyRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) 

  // Socket listeners: refresh lists when matches change
  useEffect(() => {
    const socket = connectSocket()
    if (!socket) return
    function onMatchCancelled(payload) {
      console.log('socket: match:cancelled', payload)
      // quick strategy: refetch all my requests so UI is in sync
      fetchMyRequests()
    }
    function onMatchUpdated(payload) {
      console.log('socket: match:updated', payload)
      // refresh that single match meta and requests
      if (payload && payload.matchId) {
        loadMatchMeta([payload.matchId])
      }
      fetchMyRequests()
    }
    function onMatchClosed(payload) {
      console.log('socket: match:closed', payload)
      fetchMyRequests()
    }

    socket.on && socket.on('match:cancelled', onMatchCancelled)
    socket.on && socket.on('match:updated', onMatchUpdated)
    socket.on && socket.on('match:closed', onMatchClosed)

    // cleanup
    return () => {
      try {
        socket.off && socket.off('match:cancelled', onMatchCancelled)
        socket.off && socket.off('match:updated', onMatchUpdated)
        socket.off && socket.off('match:closed', onMatchClosed)
      } catch (e) {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCreated = async (createdRequest) => {
    await fetchMyRequests()
  }

  const confirmMatch = async (matchId) => {
    if (!matchId) return
    if (!token) { alert('Not authenticated'); return }
    try {
      await postJSON(`/api/matches/${matchId}/confirm`, {}, token)
      await loadMatchMeta([matchId])
      await fetchMyRequests()
      alert('Confirmed. If both parties confirmed, match will be closed.')
    } catch (err) {
      console.error('confirm match failed', err)
      alert('Failed to confirm match: ' + (err.message || err))
    }
  }

  const computeUIFlags = (r, mEntry) => {
    const meta = matchMeta[mEntry.matchId]
    if (!meta) return { closed: false, pending: false, confirmedByMe: false }
    const closed = meta.status === 'closed' || meta.status === 'verified' || meta.status === 'cancelled'
    const iAmLostSide = (r.kind === 'lost')
    const confirmedByMe = iAmLostSide ? !!meta.lostConfirmed : !!meta.foundConfirmed
    const otherConfirmed = iAmLostSide ? !!meta.foundConfirmed : !!meta.lostConfirmed
    const pending = !closed && (meta.lostConfirmed || meta.foundConfirmed) && !(meta.lostConfirmed && meta.foundConfirmed)
    return { closed, pending, confirmedByMe, otherConfirmed }
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="text-2xl font-semibold">Dashboard</div>
          <div className="flex gap-2">
            <button onClick={() => setShowResolvedPage(v=>!v)} className="px-3 py-1 border rounded text-sm">
              {showResolvedPage ? 'Back to My Requests' : 'View Successful Matches'}
            </button>
          </div>
        </div>

        {showResolvedPage ? (
          <Resolved />
        ) : (
        <>
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
                        {r._matches.map((m, idx) => {
                          const flags = computeUIFlags(r, m)
                          return (
                          <div key={idx} className={`p-2 border rounded flex justify-between items-center ${flags.closed ? 'opacity-70' : ''}`}>
                            <div>
                              <div className="text-sm font-semibold">{m.matchedRequest ? m.matchedRequest.title : 'No title'}</div>
                              <div className="text-xs text-gray-600">Category: {m.matchedRequest?.category || '—'} • Loc: {m.matchedRequest?.locationText || '—'}</div>
                              <div className="text-xs text-gray-500">Score: {m.score ? m.score.toFixed(2) : '—'}</div>
                              {flags.pending && <div className="inline-block mt-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded">Pending confirmation</div>}
                              {flags.closed && <div className="inline-block mt-1 px-2 py-0.5 bg-gray-800 text-white text-xs rounded ml-2">CLOSED</div>}
                            </div>
                            <div className="flex gap-2">
                              <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => setSelectedMatchId(m.matchId)}>Open Chat</button>
                              <button
                                className="px-3 py-1 bg-gray-700 text-white rounded"
                                onClick={() => confirmMatch(m.matchId)}
                                disabled={!!flags.closed || !!flags.confirmedByMe}
                                title={flags.closed ? 'This match is closed' : (flags.confirmedByMe ? 'You already confirmed' : 'Confirm received/returned')}
                                style={{ opacity: (flags.closed || flags.confirmedByMe) ? 0.5 : 1 }}
                              >
                                Confirm
                              </button>
                            </div>
                          </div>
                        )})}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </>
        )}
      </div>

      {selectedMatchId && (
       <div className="mt-6">
          <Chat matchId={selectedMatchId} onClose={() => setSelectedMatchId(null)} />
        </div>
      )}
    </div>
  )
}
