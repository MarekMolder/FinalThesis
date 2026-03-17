import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../../api';
import AuthShell, { AuthFooter } from './AuthShell';
import { LockIcon, MailIcon } from './icons';
import AuthCard from '../../components/ui/AuthCard';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell side="left">
      <AuthCard
        title="Logi sisse"
        subtitle="Sisesta oma andmed süsteemi sisenemiseks"
        maxWidth={550}
      >
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-left text-sm text-red-700">
              {error}
            </div>
          )}

          <TextField
            id="email"
            label="E-post"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            icon={MailIcon}
          />
          <TextField
            id="password"
            label="Parool"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            icon={LockIcon}
          />

          <div className="mb-5 mt-1 text-left text-xs">
            <Link className="text-sky-700 hover:underline" to="/login" onClick={(e) => e.preventDefault()}>
              Unustasid parooli?
            </Link>
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? '...' : 'Logi sisse'}
          </Button>
        </form>

        <AuthFooter variant="login" />
      </AuthCard>
    </AuthShell>
  );
}

