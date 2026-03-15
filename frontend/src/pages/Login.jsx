import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../api';

export default function Login() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || (isRegister ? 'Register failed' : 'Login failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 320, margin: '2rem auto', padding: 16 }}>
      <h1>{isRegister ? 'Register' : 'Login'}</h1>
      <form onSubmit={handleSubmit}>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {isRegister && (
          <div style={{ marginBottom: 8 }}>
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ display: 'block', width: '100%', padding: 6 }}
            />
          </div>
        )}
        <div style={{ marginBottom: 8 }}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ display: 'block', width: '100%', padding: 6 }}
          />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={isRegister ? 6 : undefined}
            style={{ display: 'block', width: '100%', padding: 6 }}
          />
        </div>
        <button type="submit" disabled={loading} style={{ padding: '8px 16px' }}>
          {loading ? '...' : (isRegister ? 'Register' : 'Login')}
        </button>
      </form>
      <p style={{ marginTop: 12 }}>
        {isRegister ? 'Already have an account?' : 'No account?'}{' '}
        <button type="button" onClick={() => setIsRegister(!isRegister)} style={{ background: 'none', border: 'none', color: 'blue', cursor: 'pointer', textDecoration: 'underline' }}>
          {isRegister ? 'Login' : 'Register'}
        </button>
      </p>
    </div>
  );
}
