import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';
import axios from 'axios';

const logo = '/logo.png';

const Login = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('https://api-inventory.isavralabel.com/bmjaya-printing/api/login', credentials);
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        toast.success('Login berhasil!');
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-6 sm:py-12 px-3 sm:px-4 lg:px-8">
      <div className="w-full max-w-sm sm:max-w-md space-y-6 sm:space-y-8">
        <div>
          <div className="mt-4 sm:mt-6 flex justify-center">
            <img src={logo} alt="BM Jaya Printing" className="w-32 sm:w-44 h-auto" />
          </div>
        </div>
        <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2.5 sm:py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 text-sm"
                placeholder="Username"
                value={credentials.username}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2.5 sm:py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 text-sm"
                placeholder="Password"
                value={credentials.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2.5 sm:py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </div>
        </form>
      </div>
      <Toaster position="top-right" />
    </div>
  );
};

export default Login;