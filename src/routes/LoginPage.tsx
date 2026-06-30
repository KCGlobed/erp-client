import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { LogIn, ArrowLeft, Mail, Key, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { apiFetch } from '../lib/api';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

type PageMode = 'login' | 'forgot' | 'verify' | 'reset';

export function LoginPage() {
  const [mode, setMode] = useState<PageMode>('login');
  
  // Field states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Notification states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { setAuth, accessToken } = useAuthStore();
  const navigate = useNavigate();

  if (accessToken) {
    return <Navigate to="/" replace />;
  }

  // Action handlers
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const base64Url = data.accessToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));

      setAuth(data.accessToken, data.refreshToken, {
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

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setSuccess('Verification OTP sent to your email.');
      setMode('verify');
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await apiFetch('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      });
      setSuccess('OTP verified successfully. Now choose a new password.');
      setMode('reset');
    } catch (err: any) {
      setError(err.message || 'Invalid or expired OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, otp, newPassword }),
      });
      setSuccess('Password reset successfully. Please log in.');
      setMode('login');
      // Clear password states
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setOtp('');
      setShowPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (newMode: PageMode) => {
    setError('');
    setSuccess('');
    setMode(newMode);
    setShowPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--muted)' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at top, oklch(0.36 0.18 330 / 0.08) 0%, transparent 60%)',
        }}
      />

      <div
        className="w-full max-w-md z-10 rounded-xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300"
        style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          color: 'var(--card-foreground)',
        }}
      >
        {/* Header Block */}
        <div className="text-center mb-8 space-y-3">
          <div
            className="mx-auto h-14 w-14 rounded-xl flex items-center justify-center text-xl font-bold"
            style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            {mode === 'login' ? 'E' : mode === 'forgot' ? <Mail className="h-6 w-6" /> : mode === 'verify' ? <ShieldCheck className="h-6 w-6" /> : <Key className="h-6 w-6" />}
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--foreground)' }}>
              {mode === 'login' && 'Welcome back'}
              {mode === 'forgot' && 'Forgot password?'}
              {mode === 'verify' && 'Verify OTP'}
              {mode === 'reset' && 'Reset your password'}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
              {mode === 'login' && 'Sign in to your EduERP account'}
              {mode === 'forgot' && 'Enter your email address to receive an OTP'}
              {mode === 'verify' && `Enter the 6-digit code sent to ${email}`}
              {mode === 'reset' && 'Create a strong, new password for your account'}
            </p>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div
            className="text-sm p-3 rounded-md flex items-start gap-2 mb-4"
            style={{ backgroundColor: 'oklch(0.577 0.245 27.325 / 0.08)', color: 'var(--destructive)', border: '1px solid oklch(0.577 0.245 27.325 / 0.2)' }}
          >
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            className="text-sm p-3 rounded-md flex items-start gap-2 mb-4"
            style={{ backgroundColor: 'oklch(0.645 0.203 142.495 / 0.08)', color: 'oklch(0.45 0.16 140)', border: '1px solid oklch(0.645 0.203 142.495 / 0.2)' }}
          >
            <span>✅</span>
            <span>{success}</span>
          </div>
        )}

        {/* Form rendering based on page mode */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder="admin@school.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div>
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-foreground hover:text-foreground p-2 rounded-md"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="flex justify-end mt-1.5">
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-xs hover:underline transition-colors font-medium"
                  style={{ color: 'var(--primary)' }}
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-medium mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Signing in…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Sign in
                </span>
              )}
            </Button>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder="your-email@school.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Button
              type="submit"
              className="w-full h-11 text-base font-medium mt-2"
              disabled={isLoading}
            >
              {isLoading ? 'Sending OTP…' : 'Send Reset OTP'}
            </Button>

            <button
              type="button"
              onClick={() => switchMode('login')}
              className="w-full flex items-center justify-center gap-2 text-sm hover:underline transition-colors pt-2 font-medium"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </button>
          </form>
        )}

        {mode === 'verify' && (
          <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
            <Input
              label="Verification Code (OTP)"
              type="text"
              placeholder="Enter 6-digit code"
              maxLength={6}
              pattern="[0-9]*"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />

            <Button
              type="submit"
              className="w-full h-11 text-base font-medium mt-2"
              disabled={isLoading}
            >
              {isLoading ? 'Verifying OTP…' : 'Verify OTP'}
            </Button>

            <button
              type="button"
              onClick={() => switchMode('forgot')}
              className="w-full flex items-center justify-center gap-2 text-sm hover:underline transition-colors pt-2 font-medium"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <ArrowLeft className="h-4 w-4" />
              Change email or resend code
            </button>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <Input
              label="New Password"
              type={showNewPassword ? 'text' : 'password'}
              placeholder="••••••••"
              suffix={
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="text-muted-foreground hover:text-foreground p-2 rounded-md"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <Input
              label="Confirm New Password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••"
              suffix={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-muted-foreground hover:text-foreground p-2 rounded-md"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              className="w-full h-11 text-base font-medium mt-2"
              disabled={isLoading}
            >
              {isLoading ? 'Resetting Password…' : 'Reset Password'}
            </Button>

            <button
              type="button"
              onClick={() => switchMode('login')}
              className="w-full flex items-center justify-center gap-2 text-sm hover:underline transition-colors pt-2 font-medium"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <ArrowLeft className="h-4 w-4" />
              Cancel and back to login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
