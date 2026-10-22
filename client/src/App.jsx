import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { PageLoader } from './components/ui';

import Landing from './pages/public/Landing';
import FoundPet from './pages/public/FoundPet';
import NotFound from './pages/public/NotFound';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

import OwnerDashboard from './pages/owner/OwnerDashboard';
import MyPets from './pages/owner/MyPets';
import PetForm from './pages/owner/PetForm';
import PetProfile from './pages/owner/PetProfile';
import Reminders from './pages/owner/Reminders';
import BrowseServices from './pages/owner/BrowseServices';
import ProviderDetail from './pages/owner/ProviderDetail';
import BookService from './pages/owner/BookService';
import MyBookings from './pages/owner/MyBookings';

import ProviderDashboard from './pages/provider/ProviderDashboard';
import ProviderProfile from './pages/provider/ProviderProfile';
import ProviderServices from './pages/provider/ProviderServices';
import ProviderBookings from './pages/provider/ProviderBookings';
import ProviderReviews from './pages/provider/ProviderReviews';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProviders from './pages/admin/AdminProviders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminServices from './pages/admin/AdminServices';
import AdminBookings from './pages/admin/AdminBookings';

import AccountSettings from './pages/AccountSettings';

const HOME_FOR = { owner: '/owner', provider: '/provider', admin: '/admin' };

function RoleHome() {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Landing />;
  return <Navigate to={HOME_FOR[user.role] || '/owner'} replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<RoleHome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/found/:token" element={<FoundPet />} />

      {/* Signed-in shell */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Pet owner */}
        <Route path="/owner" element={<ProtectedRoute roles={['owner']}><OwnerDashboard /></ProtectedRoute>} />
        <Route path="/owner/pets" element={<ProtectedRoute roles={['owner']}><MyPets /></ProtectedRoute>} />
        <Route path="/owner/pets/new" element={<ProtectedRoute roles={['owner']}><PetForm /></ProtectedRoute>} />
        <Route path="/owner/pets/:id" element={<ProtectedRoute roles={['owner']}><PetProfile /></ProtectedRoute>} />
        <Route path="/owner/pets/:id/edit" element={<ProtectedRoute roles={['owner']}><PetForm /></ProtectedRoute>} />
        <Route path="/owner/reminders" element={<ProtectedRoute roles={['owner']}><Reminders /></ProtectedRoute>} />
        <Route path="/owner/services" element={<ProtectedRoute roles={['owner']}><BrowseServices /></ProtectedRoute>} />
        <Route path="/owner/providers/:id" element={<ProtectedRoute roles={['owner']}><ProviderDetail /></ProtectedRoute>} />
        <Route path="/owner/book" element={<ProtectedRoute roles={['owner']}><BookService /></ProtectedRoute>} />
        <Route path="/owner/bookings" element={<ProtectedRoute roles={['owner']}><MyBookings /></ProtectedRoute>} />

        {/* Service provider / vet */}
        <Route path="/provider" element={<ProtectedRoute roles={['provider']}><ProviderDashboard /></ProtectedRoute>} />
        <Route path="/provider/profile" element={<ProtectedRoute roles={['provider']}><ProviderProfile /></ProtectedRoute>} />
        <Route path="/provider/services" element={<ProtectedRoute roles={['provider']}><ProviderServices /></ProtectedRoute>} />
        <Route path="/provider/bookings" element={<ProtectedRoute roles={['provider']}><ProviderBookings /></ProtectedRoute>} />
        <Route path="/provider/reviews" element={<ProtectedRoute roles={['provider']}><ProviderReviews /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/providers" element={<ProtectedRoute roles={['admin']}><AdminProviders /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/services" element={<ProtectedRoute roles={['admin']}><AdminServices /></ProtectedRoute>} />
        <Route path="/admin/bookings" element={<ProtectedRoute roles={['admin']}><AdminBookings /></ProtectedRoute>} />

        {/* Shared */}
        <Route path="/settings" element={<AccountSettings />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
