import api from './api'

export async function fetchMessages() {
  const res = await api.get('/messages')
  return res.data.data
}

export async function sendMessage(body) {
  const res = await api.post('/messages', { body })
  return res.data.data
}