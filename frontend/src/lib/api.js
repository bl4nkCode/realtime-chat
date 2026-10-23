import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { Accept: 'application/json' },
})

/* Before every request:
- Gets the login token from localStorage.
- If a token exists, adds it to the request's Authorization header.
- Returns the updated request configuration. */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/* It handles failed API responses. 
If Laravel returns 401 Unauthorized and a token exists, 
it removes the token from localStorage and notifies the app to clear the user's login state. */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem('token')) {
      localStorage.removeItem('token')
      window.dispatchEvent(new Event('auth:unauthorized'))
    }
    return Promise.reject(error)
  },
)

export default api