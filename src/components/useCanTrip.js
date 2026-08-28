import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth.js';
import { toast } from '../lib/toast.js';

// Returns a guard() that checks login → access → complete profile, toasting
// + redirecting to the right place if a step is missing.
//
// `action` narrows what counts as "access" for trip-specific actions, since
// a Trip Pass (host/join credits) is a lighter alternative to a full
// membership that ONLY covers hosting/joining a regular trip - not clubs,
// group trips, or connections, which still need an active membership:
//   'host'   - hosting a regular trip (membership OR a host credit)
//   'join'   - joining a regular trip (membership OR a join credit)
//   omitted  - everything else (clubs, group trips, connections) - membership only
export function useCanTrip(action) {
  const navigate = useNavigate();
  return () => {
    const { user, accessToken } = useAuth.getState();
    if (!accessToken) {
      toast('fa-solid fa-lock', 'Please log in first');
      navigate('/login');
      return false;
    }
    if (user?.role === 'admin') return true;

    const hasAccess =
      action === 'host' ? user?.membershipActive || (user?.hostCredits || 0) > 0
      : action === 'join' ? user?.membershipActive || (user?.joinCredits || 0) > 0
      : user?.membershipActive;

    if (!hasAccess) {
      toast(
        'fa-solid fa-credit-card',
        action ? `Buy a membership or Trip Pass to ${action === 'host' ? 'host' : 'join'} a trip` : 'Activate a membership to continue'
      );
      navigate('/join');
      return false;
    }
    if (!user?.profileComplete) {
      toast('fa-solid fa-pen-to-square', 'Complete your profile to plan or join trips');
      navigate('/complete-profile');
      return false;
    }
    // Trip-specific: joining needs the base Verified tier; hosting needs
    // the full Verified Vehicle Owner tier - see requireVerifiedTraveler/
    // requireVehicleVerified in the backend's middleware/auth.js.
    if (action === 'host' && user?.verificationLevel !== 'vehicle_verified') {
      toast('fa-solid fa-car-side', 'You need the Verified Vehicle Owner tier to host a trip');
      navigate('/dashboard?tab=settings');
      return false;
    }
    if (action === 'join' && (!user?.verificationLevel || user.verificationLevel === 'none')) {
      toast('fa-solid fa-hourglass-half', 'Your profile needs to be admin-verified before you can join trips');
      navigate('/dashboard?tab=settings');
      return false;
    }
    return true;
  };
}

// Route the standard 403 gate codes from the API to the right page.
export function handleGateError(err, navigate) {
  const code = err?.response?.data?.code;
  if (code === 'PROFILE_INCOMPLETE') {
    toast('fa-solid fa-pen-to-square', 'Complete your profile to continue');
    navigate('/complete-profile');
    return true;
  }
  if (code === 'MEMBERSHIP_REQUIRED') {
    toast('fa-solid fa-credit-card', 'Your membership is inactive');
    navigate('/join');
    return true;
  }
  if (code === 'TRIP_HOST_ACCESS_REQUIRED') {
    toast('fa-solid fa-credit-card', 'Buy a membership or Trip Pass to host a trip');
    navigate('/join');
    return true;
  }
  if (code === 'TRIP_JOIN_ACCESS_REQUIRED') {
    toast('fa-solid fa-credit-card', 'Buy a membership or Trip Pass to join a trip');
    navigate('/join');
    return true;
  }
  if (code === 'DOCUMENTS_NOT_VERIFIED') {
    toast('fa-solid fa-hourglass-half', "Your documents are still awaiting admin verification");
    navigate('/activate-profile');
    return true;
  }
  if (code === 'VERIFICATION_REQUIRED') {
    toast('fa-solid fa-hourglass-half', 'Your profile needs to be admin-verified before you can join trips');
    navigate('/dashboard?tab=settings');
    return true;
  }
  if (code === 'VEHICLE_VERIFICATION_REQUIRED') {
    toast('fa-solid fa-car-side', 'You need the Verified Vehicle Owner tier to host a trip');
    navigate('/dashboard?tab=settings');
    return true;
  }
  return false;
}
