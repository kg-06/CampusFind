import React, { useState } from 'react'
import { postJSON } from '../services/api'
import { getToken } from '../services/auth'

export default function CreateRequest({ kind = 'lost', onCreated }) {
  const [form, setForm] = useState({ category: 'electronics', title: '', description: '', locationText: '', tags: '' })
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const payload = {
        kind,
        category: form.category,
        title: form.title,
        description: form.description,
        locationText: form.locationText,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean)
      }
      const token = getToken()
      const res = await postJSON('/api/requests', payload, token)
      if (res && res.request) {
        setSuccessMsg('Request created successfully.')
        onCreated && onCreated(res.request)

      } else {
        setErrorMsg('Unable to create request.')
      }
    } catch (err) {
      console.error(err)
      setErrorMsg('Failed to create request.')
    } finally {
      setLoading(false)
      setTimeout(() => setSuccessMsg(null), 4000)
    }
  }

  return (
    <div className="bg-white p-6 rounded shadow max-w-2xl mx-auto">
      <h3 className="text-xl font-semibold mb-4">Create {kind === 'lost' ? 'Lost' : 'Found'} Request</h3>

      {successMsg && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded">{successMsg}</div>}
      {errorMsg && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">{errorMsg}</div>}

      <form onSubmit={submit}>
        <div className="grid grid-cols-2 gap-4">
          <select className="p-2 border" value={form.category} onChange={e=>setForm({...form, category: e.target.value})}>
            <option value="electronics">Electronics</option>
            <option value="jewellery">Jewellery</option>
            <option value="documents">Documents</option>
            <option value="purse">Purse/Money</option>
            <option value="accessories">Accessories</option>
            <option value="others">Others</option>
          </select>
          <input className="p-2 border" placeholder="Title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required />
          <textarea className="p-2 border col-span-2" placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} required />
          <input className="p-2 border" placeholder="Location" value={form.locationText} onChange={e=>setForm({...form,locationText:e.target.value})} />
          <input className="p-2 border" placeholder="Tags (comma separated)" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})} />
        </div>
        <div className="mt-4 flex gap-2">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loading}>{loading ? 'Saving...' : 'Submit'}</button>
        </div>
      </form>
    </div>
  )
}
