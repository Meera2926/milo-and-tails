import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mt_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const path = window.location.pathname;
    // An expired or invalid session sends the person back to sign in — but never
    // from the public lost-pet page, which is meant to work without an account.
    if (status === 401 && !path.startsWith('/found') && !path.startsWith('/login')) {
      localStorage.removeItem('mt_token');
      window.location.assign('/login?expired=1');
    }
    return Promise.reject(error);
  }
);

// Every catch block in the app funnels through here so people see one clear line.
export const errorMessage = (error, fallback = 'Something went wrong. Try again.') =>
  error?.response?.data?.message || error?.message || fallback;

export default api;
