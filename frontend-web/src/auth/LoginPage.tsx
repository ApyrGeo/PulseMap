import { useState } from 'react';
import { useAuth } from './AuthProvider';
import toast from 'react-hot-toast';
import './LoginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const { loginUser } = useAuth();

  const handleLoginButton = async (
    e: React.MouseEvent<HTMLButtonElement> | React.FormEvent
  ) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      await loginUser(email, password);
      toast.success('Logged in');
    } catch (error: any) {
      toast.error('Login failed: ' + (error?.message ?? 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form
        onSubmit={handleLoginButton}
        className="login-form"
        aria-labelledby="login-heading"
      >
        <h1 id="login-heading" className="login-heading">
          Sign in to PulseMap
        </h1>

        <label className="login-label">Email</label>
        <input
          type="email"
          className="login-input"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        <label className="login-label">Password</label>
        <input
          type="password"
          className="login-input"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        <button
          type="submit"
          onClick={handleLoginButton}
          disabled={loading}
          className="login-button"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        <div className="login-footer">
          <span>Don't have an account? </span>
          <a className="login-register-link" href="/register">
            Register
          </a>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
