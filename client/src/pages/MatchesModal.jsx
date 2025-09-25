import React from 'react'


export default function MatchesModal({ matches = [], onClose, onOpenChat }) {
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
{matches.map(m => (
<div key={m.matchId} className="p-3 border rounded flex justify-between items-center">
<div>
<div className="font-semibold">Score: {(m.score||0).toFixed(2)}</div>
<div className="text-sm text-gray-600">Matched Request ID: {m.matchedRequestId}</div>
</div>
<div>
<button className="px-3 py-1 bg-green-600 text-white rounded" onClick={() => onOpenChat(m.matchId)}>Open Chat</button>
</div>
</div>
))}
</div>
)}
</div>
</div>
)
}