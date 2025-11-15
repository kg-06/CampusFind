// client/src/pages/Login.jsx
import React, { useEffect, useState, useRef } from 'react'
import { signinWithIdToken } from '../services/auth'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function loadGsiScriptOnce() {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.accounts && window.google.accounts.id) return resolve();
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      if (existing.getAttribute('__gsi_loaded') === '1') return resolve();
      existing.addEventListener('load', () => { existing.setAttribute('__gsi_loaded', '1'); resolve(); });
      existing.addEventListener('error', () => reject(new Error('gsi script failed')));
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.id = 'gis-client';
    s.async = true;
    s.defer = true;
    s.onload = () => { s.setAttribute('__gsi_loaded', '1'); resolve(); };
    s.onerror = () => reject(new Error('gsi script failed to load'));
    document.head.appendChild(s);
  });
}

export default function Login({ onLogin }) {
  const [loadingScript, setLoadingScript] = useState(true)
  const [error, setError] = useState(null)
  const containerRef = useRef(null)

  useEffect(() => {
    let mounted = true
    if (!CLIENT_ID) {
      setError('Missing Google Client ID. Set VITE_GOOGLE_CLIENT_ID and rebuild the client on Render.')
      setLoadingScript(false)
      return
    }

    async function init() {
      try {
        await loadGsiScriptOnce()
      } catch (e) {
        console.error('Failed to load Google Identity script', e)
        if (!mounted) return
        setError('Failed to load Google Identity script (network/CSP).')
        setLoadingScript(false)
        return
      }

      // wait for containerRef and window.google to be ready (short loop)
      let tries = 0
      const maxTries = 20
      const delay = 100

      while (mounted && tries < maxTries) {
        if (containerRef.current && window.google && window.google.accounts && typeof window.google.accounts.id?.initialize === 'function') break
        // eslint-disable-next-line no-await-in-loop
        await new Promise(r => setTimeout(r, delay))
        tries++
      }

      if (!mounted) return
      if (!containerRef.current) {
        setError('Sign-in container not found in DOM. (containerRef is null)')
        setLoadingScript(false)
        return
      }
      if (!(window.google && window.google.accounts && typeof window.google.accounts.id?.initialize === 'function')) {
        setError('Google Identity objects not available on window.google after script load.')
        setLoadingScript(false)
        return
      }

      try {
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: async (response) => {
            try {
              const idToken = response?.credential
              if (!idToken) throw new Error('No id_token received from Google')
              const user = await signinWithIdToken(idToken)
              if (typeof onLogin === 'function') onLogin(user)
            } catch (err) {
              console.error('signin callback error', err)
              setError('Sign-in failed. See console.')
            }
          },
          // hosted_domain: 'chitkara.edu.in' // optional client-side domain hint
        })

        // render into the always-present container; width: "100%" makes it expand to parent
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: 'outline',
          size: 'large',
          width: '100%'
        })
        // window.google.accounts.id.prompt(); // optional auto prompt
        if (mounted) setLoadingScript(false)
      } catch (err) {
        console.error('GSI init/render error', err)
        if (mounted) {
          setError('Failed to initialize Google Sign-in. See console for details.')
          setLoadingScript(false)
        }
      }
    }

    init()
    return () => { mounted = false }
  }, [onLogin])

  return (
    <div className="max-w-md mx-auto mt-20 bg-white p-8 rounded shadow">
      <h2 className="text-2xl font-semibold mb-4">Sign in with your Chitkara account</h2>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded mb-4">
          <div className="font-medium">Login setup error</div>
          <div className="text-sm mt-1">{error}</div>
        </div>
      )}

      {/* always render this container so Google can mount the button into it */}
      <div
        id="g-btn"
        ref={containerRef}
        className="min-h-[48px] flex items-center w-full max-w-sm mx-auto"
        style={{ width: '100%' }}
      />

      {loadingScript && !error && (
        <div className="p-2 text-gray-600">Loading Google Sign-in…</div>
      )}

      <p className="text-sm text-gray-500 mt-4">
        Use your <b>@chitkara.edu.in</b> account.
      </p>
    </div>
  )
}
