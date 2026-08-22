import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Preloader from './components/Preloader.jsx';
import { api } from './lib/api.js';
import { useAuth } from './store/auth.js';

import Home from './pages/Home.jsx';
import Trips from './pages/Trips.jsx';
import TripDetail from './pages/TripDetail.jsx';
import Clubs from './pages/Clubs.jsx';
import ClubDetail from './pages/ClubDetail.jsx';
import PlanClub from './pages/PlanClub.jsx';
import Members from './pages/Members.jsx';
import MemberDetail from './pages/MemberDetail.jsx';
import MemberFollowList from './pages/MemberFollowList.jsx';
import Gallery from './pages/Gallery.jsx';
import CompletedTrips from './pages/CompletedTrips.jsx';
import Testimonials from './pages/Testimonials.jsx';
import About from './pages/About.jsx';
import HowItWorks from './pages/HowItWorks.jsx';
import Influencers from './pages/Influencers.jsx';
import Contact from './pages/Contact.jsx';
import Join from './pages/Join.jsx';
import CompleteProfile from './pages/CompleteProfile.jsx';
import ActivateProfile from './pages/ActivateProfile.jsx';
import Login from './pages/Login.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import PlanTrip from './pages/PlanTrip.jsx';
import EditTrip from './pages/EditTrip.jsx';
import GroupTripDetail from './pages/GroupTripDetail.jsx';
import PlanGroupTrip from './pages/PlanGroupTrip.jsx';
import EditGroupTrip from './pages/EditGroupTrip.jsx';
import Dashboard from './pages/Dashboard.jsx';
import EditProfile from './pages/EditProfile.jsx';
import Notifications from './pages/Notifications.jsx';
import Chat from './pages/Chat.jsx';
import Referrals from './pages/Referrals.jsx';
import NotFound from './pages/NotFound.jsx';

import AdminOverview from './pages/admin/AdminOverview.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminTrips from './pages/admin/AdminTrips.jsx';
import AdminCoupons from './pages/admin/AdminCoupons.jsx';
import AdminReviews from './pages/admin/AdminReviews.jsx';
import AdminGallery from './pages/admin/AdminGallery.jsx';
import AdminMessages from './pages/admin/AdminMessages.jsx';
import AdminInfluencers from './pages/admin/AdminInfluencers.jsx';
import AdminWallet from './pages/admin/AdminWallet.jsx';
import AdminAdmins from './pages/admin/AdminAdmins.jsx';
import AdminReferralSettings from './pages/admin/AdminReferralSettings.jsx';
import AdminProfile from './pages/admin/AdminProfile.jsx';
import AdminNotifications from './pages/admin/AdminNotifications.jsx';

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
    <>
      <Preloader />
      <Routes>
        {/* Public site (with the normal navbar/footer) */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/trips" element={<Trips />} />
          <Route path="/trips/:id" element={<TripDetail />} />
          <Route path="/clubs" element={<Clubs />} />
          <Route path="/clubs/:id" element={<ClubDetail />} />
          <Route path="/plan-club" element={<ProtectedRoute><PlanClub /></ProtectedRoute>} />
          <Route path="/members" element={<Members />} />
          <Route path="/members/:id" element={<MemberDetail />} />
          <Route path="/members/:id/followers" element={<MemberFollowList mode="followers" />} />
          <Route path="/members/:id/following" element={<MemberFollowList mode="following" />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/completed-trips" element={<CompletedTrips />} />
          <Route path="/testimonials" element={<Testimonials />} />
          <Route path="/about" element={<About />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/influencers" element={<Influencers />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/join" element={<Join />} />
          <Route path="/complete-profile" element={<ProtectedRoute><CompleteProfile /></ProtectedRoute>} />
          <Route path="/activate-profile" element={<ProtectedRoute><ActivateProfile /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/plan-trip" element={<ProtectedRoute><PlanTrip /></ProtectedRoute>} />
          <Route path="/trips/:id/edit" element={<ProtectedRoute><EditTrip /></ProtectedRoute>} />
          <Route path="/group-trips/:id" element={<GroupTripDetail />} />
          <Route path="/plan-group-trip" element={<ProtectedRoute><PlanGroupTrip /></ProtectedRoute>} />
          <Route path="/group-trips/:id/edit" element={<ProtectedRoute><EditGroupTrip /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/referrals" element={<ProtectedRoute><Referrals /></ProtectedRoute>} />
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
          <Route path="gallery" element={<AdminGallery />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="influencers" element={<AdminInfluencers />} />
          <Route path="wallet" element={<AdminWallet />} />
          <Route path="admins" element={<ProtectedRoute superadmin><AdminAdmins /></ProtectedRoute>} />
          <Route path="referral-settings" element={<ProtectedRoute superadmin><AdminReferralSettings /></ProtectedRoute>} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="notifications" element={<AdminNotifications />} />
        </Route>
      </Routes>
    </>
  );
}
