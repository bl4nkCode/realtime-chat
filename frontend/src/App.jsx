import { Route, Routes } from 'react-router'
import GuestRoute from './components/GuestRoute'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import GlobalChat from './pages/GlobalChat'
import Login from './pages/Login'
import PrivateChat from './pages/PrivateChat'
import Register from './pages/Register'

export default function App() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<GlobalChat />} />
          <Route path="/c/:userId" element={<PrivateChat />} />
        </Route>
      </Route>
    </Routes>
  )
}