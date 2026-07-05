import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth.js';
import { toast } from '../lib/toast.js';

// Returns a guard() that checks login → active membership → complete profile,
// toasting + redirecting to the right place if a step is missing.
export function useCanTrip() {
  const navigate = useNavigate();
  return () => {
    const { user, accessToken } = useAuth.getState();
    if (!accessToken) {
      toast('fa-solid fa-lock', 'Please log in first');
      navigate('/login');
      return false;
    }
    if (user?.role === 'admin') return true;
    if (!user?.membershipActive) {
      toast('fa-solid fa-credit-card', 'Activate a membership to continue');
      navigate('/join');
      return false;
    }
    if (!user?.profileComplete) {
      toast('fa-solid fa-pen-to-square', 'Complete your profile to plan or join trips');
      navigate('/complete-profile');
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
  return false;
}
