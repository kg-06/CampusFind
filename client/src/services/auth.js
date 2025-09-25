const LS_KEY = 'lf_token'
export function saveToken(t) { localStorage.setItem(LS_KEY, t) }
export function getToken() { return localStorage.getItem(LS_KEY) }
export function clearToken() { localStorage.removeItem(LS_KEY) }


export async function signinWithIdToken(idToken) {
const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/auth/signin', {
method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken })
})
if (!res.ok) throw new Error('Signin failed')
const json = await res.json()
saveToken(json.token)
return json.user
}