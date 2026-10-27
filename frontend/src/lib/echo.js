import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import api from './api'

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

  // Custom authorizer: called whenever a private/presence channel is joined.
  authorizer: (channel) => ({
    authorize: (socketId, callback) => {
      api
        .post('/broadcasting/auth', {
          socket_id: socketId,
          channel_name: channel.name,
        })
        .then((res) => callback(null, res.data))
        .catch((err) => callback(err, null))
    },
  }),
})

export default echo