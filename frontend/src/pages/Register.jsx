import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../context/useAuth'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setSubmitting(true)
    try {
      await register(form)
      navigate('/', { replace: true })
    } catch (err) {
      setErrors(
        err.response?.data?.errors || {
          general: [err.response?.data?.message || 'Registration failed'],
        },
      )
    } finally {
      setSubmitting(false)
    }
  }

  const fieldError = (name) =>
    errors[name] && <p style={{ color: 'crimson' }}>{errors[name][0]}</p>

  return (
    <div style={{ maxWidth: 360, margin: '80px auto' }}>
      <h1>Register</h1>
      <form onSubmit={onSubmit}>
        <input name="name" placeholder="Name" value={form.name} onChange={onChange} required />
        {fieldError('name')}
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={onChange} required />
        {fieldError('email')}
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={onChange} required />
        {fieldError('password')}
        <input name="password_confirmation" type="password" placeholder="Confirm password" value={form.password_confirmation} onChange={onChange} required />
        {fieldError('general')}
        <button disabled={submitting}>{submitting ? 'Creating...' : 'Register'}</button>
      </form>
      <p>Have an account? <Link to="/login">Log in</Link></p>
    </div>
  )
}