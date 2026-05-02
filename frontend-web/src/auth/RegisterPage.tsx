import { useState } from 'react';
import { useAuth } from './AuthProvider';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { RegisterRequest, Role } from './Interfaces';
import './LoginPage.css';

const RegisterPage = () => {
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const { registerUser } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const validateForm = (): boolean => {
    if (!firstName || !lastName || !username || !email || !password) {
      toast.error(t('auth.register.fillAll'));
      return false;
    }

    if (firstName.length > 50) {
      toast.error('First name cannot exceed 50 characters');
      return false;
    }

    if (lastName.length > 50) {
      toast.error('Last name cannot exceed 50 characters');
      return false;
    }

    if (username.length > 50) {
      toast.error('Username cannot exceed 50 characters');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error(t('auth.register.invalidEmail'));
      return false;
    }

    if (password.length < 8) {
      toast.error(t('auth.register.passwordTooShort'));
      return false;
    }

    if (password !== confirmPassword) {
      toast.error(t('auth.register.passwordMismatch'));
      return false;
    }

    return true;
  };

  const handleRegisterButton = async (
    e: React.MouseEvent<HTMLButtonElement> | React.FormEvent
  ) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const registerRequest: RegisterRequest = {
        firstName,
        lastName,
        username,
        email,
        password,
        role: Role.User, // Default to User role
      };

      await registerUser(registerRequest);
      toast.success(t('auth.register.success'));
      navigate('/login');
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'USER_ALREADY_EXISTS') {
        toast.error(t('auth.register.emailExists'));
      } else {
        toast.error(t('auth.register.failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form
        onSubmit={handleRegisterButton}
        className="login-form"
        aria-labelledby="register-heading"
      >
        <h1 id="register-heading" className="login-heading">
          {t('auth.register.title')}
        </h1>

        <label className="login-label">{t('auth.register.firstName')}</label>
        <input
          type="text"
          className="login-input"
          placeholder="John"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          autoComplete="given-name"
          required
          maxLength={50}
        />

        <label className="login-label">{t('auth.register.lastName')}</label>
        <input
          type="text"
          className="login-input"
          placeholder="Doe"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          autoComplete="family-name"
          required
          maxLength={50}
        />

        <label className="login-label">{t('auth.register.username')}</label>
        <input
          type="text"
          className="login-input"
          placeholder="johndoe"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
          maxLength={50}
        />

        <label className="login-label">{t('auth.register.email')}</label>
        <input
          type="email"
          className="login-input"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        <label className="login-label">{t('auth.register.password')}</label>
        <input
          type="password"
          className="login-input"
          placeholder={t('auth.register.passwordPlaceholder')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
          minLength={8}
        />

        <label className="login-label">{t('auth.register.confirmPassword')}</label>
        <input
          type="password"
          className="login-input"
          placeholder={t('auth.register.confirmPassword')}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          required
          minLength={8}
        />

        <button
          type="submit"
          onClick={handleRegisterButton}
          disabled={loading}
          className="login-button"
        >
          {loading ? t('auth.register.submitting') : t('auth.register.submit')}
        </button>

        <div className="login-footer">
          <span>{t('auth.register.hasAccount')} </span>
          <a className="login-register-link" href="/login">
            {t('auth.register.signIn')}
          </a>
        </div>
      </form>
    </div>
  );
};

export default RegisterPage;
