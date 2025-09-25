import React, { useEffect, useState } from 'react'
import { signinWithIdToken } from '../services/auth'

export default function Login({ onLogin }) {
  const [loadingScript, setLoadingScript] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) {
      setError('Missing Google Client ID. Set VITE_GOOGLE_CLIENT_ID in client/.env.local')
      setLoadingScript(false)
      return
    }

    
    const initGis = () => {
      if (!window.google || !window.google.accounts || !window.google.accounts.id) {
        setError('Google Identity Services not available on window.google — check network or script load.')
        setLoadingScript(false)
        return
      }

      try {
        window.google.accounts.id.initialize({ client_id: clientId, callback: handleCallback })
        window.google.accounts.id.renderButton(document.getElementById('g-btn'), { theme: 'outline', size: 'large' })
        setLoadingScript(false)
      } catch (err) {
        console.error('GIS init error', err)
        setError('Failed to initialize Google Sign-in. See console for details.')
        setLoadingScript(false)
      }
    }

    
    const handleCallback = async (response) => {
      try {
        const idToken = response?.credential
        if (!idToken) throw new Error('No id_token received from Google')
        const user = await signinWithIdToken(idToken)
        onLogin && onLogin(user)
      } catch (err) {
        console.error('signin error', err)
        setError('Signin failed. Check console for details.')
      }
    }

    const existing = document.getElementById('gis-client')
    if (!existing) {
      const s = document.createElement('script')
      s.src = 'https://accounts.google.com/gsi/client'
      s.id = 'gis-client'
      s.async = true
      s.defer = true
      s.onload = () => {
        initGis()
      }
      s.onerror = (e) => {
        console.error('Failed to load Google Identity script', e)
        setError('Failed to load Google Identity script (network?).')
        setLoadingScript(false)
      }
      document.head.appendChild(s)
    } else {
      
      setTimeout(initGis, 50)
    }

  }, [])

  return (
    <div className="max-w-md mx-auto mt-20 bg-white p-8 rounded shadow">
      <h2 className="text-2xl font-semibold mb-4">Sign in with your Chitkara account</h2>

      {error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded">
          <div className="font-medium">Login setup error</div>
          <div className="text-sm mt-1">{error}</div>
        </div>
      ) : loadingScript ? (
        <div className="p-4 text-gray-600">Loading Google Sign-in…</div>
      ) : (
        <>
          <div id="g-btn" />
          <p className="text-sm text-gray-500 mt-4">
            Use your <b>@chitkara.edu.in</b> account. The server will enforce the domain.
          </p>
        </>
      )}
    </div>
  )
}