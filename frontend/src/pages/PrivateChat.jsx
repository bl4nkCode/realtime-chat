import { useParams } from 'react-router'

export default function PrivateChat() {
  const { userId } = useParams()

  return (
    <div className="chat">
      <header className="chat-header">
        <h2>Chat with user {userId}</h2>
      </header>
    </div>
  )
}