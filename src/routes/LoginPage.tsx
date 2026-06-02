import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { apiFetch } from '../lib/api';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { setAuth, accessToken } = useAuthStore();
  const navigate = useNavigate();

  if (accessToken) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      // Decode JWT payload to get user info
      const base64Url = data.accessToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));

      setAuth(data.accessToken, {
        id: payload.sub,
        email: payload.email,
        roles: payload.roles,
        permissions: payload.permissions,
        firstName: 'User',
        lastName: '',
      });

      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--muted)' }}
    >
      {/* Background gradient matching inspiration */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at top, oklch(0.36 0.18 330 / 0.08) 0%, transparent 60%)',
        }}
      />

      <div
        className="w-full max-w-md z-10 rounded-xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
        style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          color: 'var(--card-foreground)',
        }}
      >
        {/* Logo / Brand */}
        <div className="text-center mb-8 space-y-3">
          <div
            className="mx-auto h-14 w-14 rounded-xl flex items-center justify-center text-xl font-bold"
            style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            E
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--foreground)' }}>
              Welcome back
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
              Sign in to your EduERP account
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              className="text-sm p-3 rounded-md flex items-start gap-2"
              style={{ backgroundColor: 'oklch(0.577 0.245 27.325 / 0.08)', color: 'var(--destructive)' }}
            >
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <Input
            label="Email address"
            type="email"
            placeholder="admin@school.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            className="w-full h-11 text-base font-medium mt-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Signing in…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Sign in
              </span>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
