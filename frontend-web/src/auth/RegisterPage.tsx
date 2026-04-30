import { useState } from 'react';
import { useAuth } from './AuthProvider';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { RegisterRequest, Role } from './Interfaces';
import './LoginPage.css'; // Reuse the same styles

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

  const validateForm = (): boolean => {
    if (!firstName || !lastName || !username || !email || !password) {
      toast.error('All fields are required');
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

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    // Password validation
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
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
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'USER_ALREADY_EXISTS') {
        toast.error('Adresă de email deja folosită');
      } else {
        toast.error('Înregistrare eșuată. Verificați datele și încercați din nou.');
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
          Create your PulseMap account
        </h1>

        <label className="login-label">First Name</label>
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

        <label className="login-label">Last Name</label>
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

        <label className="login-label">Username</label>
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
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
          minLength={8}
        />

        <label className="login-label">Confirm Password</label>
        <input
          type="password"
          className="login-input"
          placeholder="Re-enter your password"
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
          {loading ? 'Creating account...' : 'Create account'}
        </button>

        <div className="login-footer">
          <span>Already have an account? </span>
          <a className="login-register-link" href="/login">
            Sign in
          </a>
        </div>
      </form>
    </div>
  );
};

export default RegisterPage;
