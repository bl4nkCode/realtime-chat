import { Outlet } from 'react-router'
import ChatProvider from '../context/ChatProvider'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <ChatProvider>
      <div className="app-shell">
        <Sidebar />
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </ChatProvider>
  )
}