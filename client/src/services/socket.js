import { io } from 'socket.io-client'
import { getToken } from './auth'


let socket = null
export function connectSocket() {
const token = getToken()
if (!token) return null
if (!socket) {
socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', { auth: { token }, transports: ['websocket','polling'] })
}
return socket
}


export function getSocket() { return socket }