import { useState } from 'react';
import { useAuth } from './AuthProvider';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import './LoginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const { t } = useTranslation();

  const handleLoginButton = async (
    e: React.MouseEvent<HTMLButtonElement> | React.FormEvent
  ) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t('auth.login.enterCredentials'));
      return;
    }
    setLoading(true);
    try {
      await loginUser(email, password);
    } catch (error: any) {
      toast.error(t('auth.login.invalidCredentials'));
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
          {t('auth.login.title')}
        </h1>

        <label className="login-label">{t('auth.login.email')}</label>
        <input
          type="email"
          className="login-input"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        <label className="login-label">{t('auth.login.password')}</label>
        <input
          type="password"
          className="login-input"
          placeholder="••••••••"
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
          {loading ? t('auth.login.submitting') : t('auth.login.submit')}
        </button>

        <div className="login-footer">
          <span>{t('auth.login.noAccount')} </span>
          <a className="login-register-link" href="/register">
            {t('auth.login.register')}
          </a>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
