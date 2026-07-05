import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { api } from './lib/api.js';
import { useAuth } from './store/auth.js';

import Home from './pages/Home.jsx';
import Trips from './pages/Trips.jsx';
import TripDetail from './pages/TripDetail.jsx';
import Members from './pages/Members.jsx';
import MemberDetail from './pages/MemberDetail.jsx';
import Gallery from './pages/Gallery.jsx';
import CompletedTrips from './pages/CompletedTrips.jsx';
import Testimonials from './pages/Testimonials.jsx';
import About from './pages/About.jsx';
import Contact from './pages/Contact.jsx';
import Join from './pages/Join.jsx';
import CompleteProfile from './pages/CompleteProfile.jsx';
import Login from './pages/Login.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import PlanTrip from './pages/PlanTrip.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Chat from './pages/Chat.jsx';
import NotFound from './pages/NotFound.jsx';

import AdminOverview from './pages/admin/AdminOverview.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminTrips from './pages/admin/AdminTrips.jsx';
import AdminCoupons from './pages/admin/AdminCoupons.jsx';
import AdminReviews from './pages/admin/AdminReviews.jsx';
import AdminMessages from './pages/admin/AdminMessages.jsx';
import AdminAdmins from './pages/admin/AdminAdmins.jsx';
import AdminProfile from './pages/admin/AdminProfile.jsx';

export default function App() {
  // Refresh the cached user on load (and drop a dead session).
  useEffect(() => {
    if (!useAuth.getState().accessToken) return;
    api
      .get('/auth/me')
      .then((r) => useAuth.getState().setUser(r.data.user))
      .catch((e) => {
        if (e?.response?.status === 401) useAuth.getState().clear();
      });
  }, []);

  return (
    <Routes>
      {/* Public site (with the normal navbar/footer) */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/trips" element={<Trips />} />
        <Route path="/trips/:id" element={<TripDetail />} />
        <Route path="/members" element={<Members />} />
        <Route path="/members/:id" element={<MemberDetail />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/completed-trips" element={<CompletedTrips />} />
        <Route path="/testimonials" element={<Testimonials />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/join" element={<Join />} />
        <Route path="/complete-profile" element={<ProtectedRoute><CompleteProfile /></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/plan-trip" element={<ProtectedRoute><PlanTrip /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/chat/:groupId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Admin dashboard (its own sidebar chrome, no public navbar) */}
      <Route path="/admin" element={<ProtectedRoute admin><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminOverview />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="trips" element={<AdminTrips />} />
        <Route path="coupons" element={<AdminCoupons />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="messages" element={<AdminMessages />} />
        <Route path="admins" element={<ProtectedRoute superadmin><AdminAdmins /></ProtectedRoute>} />
        <Route path="profile" element={<AdminProfile />} />
      </Route>
    </Routes>
  );
}
