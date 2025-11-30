import { useState } from 'react';
import { useAuth } from './AuthProvider';
import toast from 'react-hot-toast';

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleLoginButton}
        className="w-full max-w-md bg-white rounded-lg shadow-md p-6 sm:p-8"
        aria-labelledby="login-heading"
      >
        <h1
          id="login-heading"
          className="text-2xl font-semibold text-gray-800 mb-4 text-center"
        >
          Sign in to PulseMap
        </h1>

        <label className="block mb-2 text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          className="w-full mb-4 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        <label className="block mb-2 text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          type="password"
          className="w-full mb-4 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
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
          className={`w-full py-2 rounded-lg font-medium transition ${
            loading
              ? 'bg-blue-300 text-white cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        <div className="mt-4 text-center text-sm text-gray-500">
          <span>Don't have an account? </span>
          <a className="text-blue-600 hover:underline" href="/register">
            Register
          </a>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
