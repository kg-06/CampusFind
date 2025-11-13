// client/src/pages/Resolved.jsx
import React, { useEffect, useState } from 'react';
import { getToken } from '../services/auth';
import { getJSON } from '../services/api';

export default function Resolved() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = getToken();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getJSON('/api/matches/resolved/all', token);
        if (!cancelled) setMatches(res.matches || []);
      } catch (err) {
        console.error('Failed to fetch resolved matches', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true };
  }, [token]);

  return (
    <div className="bg-white rounded shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Successful Matches</h2>
        <div className="text-sm text-gray-500">Verified and closed</div>
      </div>

      {loading ? (
        <div className="p-6 text-gray-500">Loading...</div>
      ) : matches.length === 0 ? (
        <div className="p-6 text-gray-500">No resolved matches yet.</div>
      ) : (
        <div className="space-y-4">
          {matches.map(m => (
            <div key={m._id} className="p-4 rounded border bg-gray-100 text-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{m.lostRequestId?.title || '—'} ↔ {m.foundRequestId?.title || '—'}</div>
                  <div className="text-sm text-gray-600">
                    {m.lostRequestId?.locationText || '—'} • {m.foundRequestId?.locationText || '—'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Score: {m.score ? m.score.toFixed(2) : '—'}</div>
                </div>

                <div className="text-right">
                  <div className="inline-block bg-gray-800 text-white text-xs px-2 py-1 rounded">CLOSED</div>
                  <div className="text-xs text-gray-500 mt-1">{m.closedAt ? new Date(m.closedAt).toLocaleString() : ''}</div>
                </div>
              </div>

              {/* connecting line */}
              <div className="mt-3 flex items-center gap-4">
                <div className="flex-1 flex items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-white border flex items-center justify-center text-xs">{m.lostRequestId?.owner?.name ? m.lostRequestId.owner.name.split(' ').map(x=>x[0]).join('') : 'L'}</div>
                  <div className="text-sm">{m.lostRequestId?.owner?.name || m.lostRequestId?.owner?.email || 'Lost owner'}</div>
                </div>
                <div className="flex-1 text-center text-sm text-gray-500">— matched with —</div>
                <div className="flex-1 flex items-center justify-end gap-2">
                  <div className="text-sm">{m.foundRequestId?.owner?.name || m.foundRequestId?.owner?.email || 'Found owner'}</div>
                  <div className="w-12 h-12 rounded-full bg-white border flex items-center justify-center text-xs">{m.foundRequestId?.owner?.name ? m.foundRequestId.owner.name.split(' ').map(x=>x[0]).join('') : 'F'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
