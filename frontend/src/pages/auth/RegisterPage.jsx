import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../../api';
import AuthShell, { AuthFooter } from './AuthShell';
import { LockIcon, MailIcon, UserIcon } from './icons';
import AuthCard from '../../components/ui/AuthCard';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password !== password2) {
      setError('Paroolid ei kattu');
      return;
    }

    const safeName = (name || '').trim() || (email.includes('@') ? email.split('@')[0] : 'User');

    setLoading(true);
    try {
      await register(safeName, email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Register failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell side="right">
      <AuthCard
        title="Loo konto"
        subtitle="Loo uus konto: sisesta email ja password"
        maxWidth={550}
      >
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-left text-sm text-red-700">
              {error}
            </div>
          )}

          <TextField
            id="name"
            label="Nimi"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="(valikuline)"
            icon={UserIcon}
          />
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
            icon={LockIcon}
          />
          <TextField
            id="password2"
            label="Korda parooli"
            type="password"
            autoComplete="new-password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            minLength={6}
            required
            icon={LockIcon}
          />

          <div className="mt-5">
            <Button type="submit" disabled={loading}>
              {loading ? '...' : 'Loo konto'}
            </Button>
          </div>
        </form>

        <AuthFooter variant="register" />
      </AuthCard>
    </AuthShell>
  );
}

