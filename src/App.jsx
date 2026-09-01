import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Preloader from './components/Preloader.jsx';
import RouteFallback from './components/RouteFallback.jsx';
import { api } from './lib/api.js';
import { useAuth } from './store/auth.js';

const Home = lazy(() => import('./pages/Home.jsx'));
const Trips = lazy(() => import('./pages/Trips.jsx'));
const TripDetail = lazy(() => import('./pages/TripDetail.jsx'));
const Clubs = lazy(() => import('./pages/Clubs.jsx'));
const ClubDetail = lazy(() => import('./pages/ClubDetail.jsx'));
const PlanClub = lazy(() => import('./pages/PlanClub.jsx'));
const Members = lazy(() => import('./pages/Members.jsx'));
const MemberDetail = lazy(() => import('./pages/MemberDetail.jsx'));
const MemberFollowList = lazy(() => import('./pages/MemberFollowList.jsx'));
const Gallery = lazy(() => import('./pages/Gallery.jsx'));
const CompletedTrips = lazy(() => import('./pages/CompletedTrips.jsx'));
const Testimonials = lazy(() => import('./pages/Testimonials.jsx'));
const About = lazy(() => import('./pages/About.jsx'));
const HowItWorks = lazy(() => import('./pages/HowItWorks.jsx'));
const Pricing = lazy(() => import('./pages/Pricing.jsx'));
const Faq = lazy(() => import('./pages/Faq.jsx'));
const Terms = lazy(() => import('./pages/Terms.jsx'));
const Privacy = lazy(() => import('./pages/Privacy.jsx'));
const RefundPolicy = lazy(() => import('./pages/RefundPolicy.jsx'));
const ShippingPolicy = lazy(() => import('./pages/ShippingPolicy.jsx'));
const Influencers = lazy(() => import('./pages/Influencers.jsx'));
const Contact = lazy(() => import('./pages/Contact.jsx'));
const Join = lazy(() => import('./pages/Join.jsx'));
const CompleteProfile = lazy(() => import('./pages/CompleteProfile.jsx'));
const ActivateProfile = lazy(() => import('./pages/ActivateProfile.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'));
const PlanTrip = lazy(() => import('./pages/PlanTrip.jsx'));
const EditTrip = lazy(() => import('./pages/EditTrip.jsx'));
const GroupTripDetail = lazy(() => import('./pages/GroupTripDetail.jsx'));
const PlanGroupTrip = lazy(() => import('./pages/PlanGroupTrip.jsx'));
const EditGroupTrip = lazy(() => import('./pages/EditGroupTrip.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const EditProfile = lazy(() => import('./pages/EditProfile.jsx'));
const Notifications = lazy(() => import('./pages/Notifications.jsx'));
const Chat = lazy(() => import('./pages/Chat.jsx'));
const Referrals = lazy(() => import('./pages/Referrals.jsx'));
const MyPlan = lazy(() => import('./pages/MyPlan.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

const AdminOverview = lazy(() => import('./pages/admin/AdminOverview.jsx'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers.jsx'));
const AdminTrips = lazy(() => import('./pages/admin/AdminTrips.jsx'));
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons.jsx'));
const AdminReviews = lazy(() => import('./pages/admin/AdminReviews.jsx'));
const AdminGallery = lazy(() => import('./pages/admin/AdminGallery.jsx'));
const AdminMessages = lazy(() => import('./pages/admin/AdminMessages.jsx'));
const AdminInfluencers = lazy(() => import('./pages/admin/AdminInfluencers.jsx'));
const AdminWallet = lazy(() => import('./pages/admin/AdminWallet.jsx'));
const AdminAdmins = lazy(() => import('./pages/admin/AdminAdmins.jsx'));
const AdminReferralSettings = lazy(() => import('./pages/admin/AdminReferralSettings.jsx'));
const AdminProfile = lazy(() => import('./pages/admin/AdminProfile.jsx'));
const AdminNotifications = lazy(() => import('./pages/admin/AdminNotifications.jsx'));

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
      <Suspense fallback={<RouteFallback />}>
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
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/shipping-policy" element={<ShippingPolicy />} />
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
            <Route path="/my-plan" element={<ProtectedRoute><MyPlan /></ProtectedRoute>} />
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
      </Suspense>
    </>
  );
}
