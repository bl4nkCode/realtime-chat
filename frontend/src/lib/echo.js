import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

// Echo's Reverb broadcaster uses pusher-js underneath and expects it on window.
window.Pusher = Pusher

const scheme = import.meta.env.VITE_REVERB_SCHEME ?? 'http'
const port = Number(import.meta.env.VITE_REVERB_PORT ?? 8080)

const echo = new Echo({
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY,
  wsHost: import.meta.env.VITE_REVERB_HOST,
  wsPort: port,
  wssPort: port,
  forceTLS: scheme === 'https',
  enabledTransports: ['ws', 'wss'],
})

export default echo