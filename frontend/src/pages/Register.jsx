
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../context/useAuth'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const onChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value })

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
    errors[name] && (
      <p className="auth-field-error" role="alert">
        {errors[name][0]}
      </p>
    )

  return (
    <div className="auth-page">
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />

      <section className="auth-card auth-card-register">
        <Link to="/login" className="auth-brand">
          <span className="auth-brand-icon">M</span>
          <span>midnight<span className="auth-brand-dot">.</span></span>
        </Link>

        <div className="auth-heading">
          <span className="auth-eyebrow">GET STARTED</span>
          <h1>Create your space.</h1>
          <p>Join Midnight and start connecting in real time.</p>
        </div>

        <form className="auth-form" onSubmit={onSubmit}>
          <label htmlFor="register-name">Full name</label>
          <input
            id="register-name"
            name="name"
            type="text"
            placeholder="Your name"
            value={form.name}
            onChange={onChange}
            autoComplete="name"
            required
          />
          {fieldError('name')}

          <label htmlFor="register-email">Email address</label>
          <input
            id="register-email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={onChange}
            autoComplete="email"
            required
          />
          {fieldError('email')}

          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            name="password"
            type="password"
            placeholder="Create a password"
            value={form.password}
            onChange={onChange}
            autoComplete="new-password"
            required
          />
          {fieldError('password')}

          <label htmlFor="register-confirm-password">Confirm password</label>
          <input
            id="register-confirm-password"
            name="password_confirmation"
            type="password"
            placeholder="Enter your password again"
            value={form.password_confirmation}
            onChange={onChange}
            autoComplete="new-password"
            required
          />
          {fieldError('password_confirmation')}
          {fieldError('general')}

          <button className="auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Create account'}
            {!submitting && <span aria-hidden="true">→</span>}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>

        <div className="auth-footer">
          REAL-TIME CONVERSATIONS · BUILT FOR CONNECTION
        </div>
      </section>
    </div>
  )
}
