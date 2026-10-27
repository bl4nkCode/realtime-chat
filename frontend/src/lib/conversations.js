import api from './api'

export async function fetchConversations() {
  const res = await api.get('/conversations')
  return res.data.data
}

export async function fetchConversationMessages(userId) {
  const res = await api.get(`/conversations/${userId}/messages`)
  return res.data.data
}

export async function sendPrivateMessage(userId, body) {
  const res = await api.post(`/conversations/${userId}/messages`, { body })
  return res.data.data
}

export async function markConversationRead(userId) {
  const res = await api.post(`/conversations/${userId}/read`)
  return res.data.marked
}

export async function searchUsers(search) {
  const res = await api.get('/users', { params: { search } })
  return res.data.data
}