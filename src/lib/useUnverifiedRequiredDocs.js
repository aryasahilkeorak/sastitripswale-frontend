import { useEffect, useState } from 'react';
import { api } from './api.js';

// Mirrors the backend's getUnverifiedRequiredDocs (utils/verification.js) -
// same requirement set (selfie + Aadhaar, plus DL/RC if they own a vehicle;
// PAN excluded since it stays optional) so the UI can show the same "still
// missing admin approval" state the trip/club join gate actually enforces.
const REQUIRED = [
  { docType: 'selfie', side: '', label: 'Live Selfie' },
  { docType: 'aadhaar', side: 'front', label: 'Aadhaar (front)' },
  { docType: 'aadhaar', side: 'back', label: 'Aadhaar (back)' },
];
const REQUIRED_VEHICLE = [
  { docType: 'driving_license', side: 'front', label: 'Driving Licence (front)' },
  { docType: 'driving_license', side: 'back', label: 'Driving Licence (back)' },
  { docType: 'rc', side: 'front', label: 'Vehicle RC (front)' },
  { docType: 'rc', side: 'back', label: 'Vehicle RC (back)' },
];

// Returns the list of required slots NOT yet verified (missing, pending, or
// rejected) - empty once everything's approved. Only fetches while `enabled`.
export function useUnverifiedRequiredDocs(enabled, hasVehicle) {
  const [unverified, setUnverified] = useState([]);

  useEffect(() => {
    if (!enabled) {
      setUnverified([]);
      return;
    }
    api
      .get('/members/documents')
      .then((r) => {
        const docs = r.data.documents || [];
        const slots = hasVehicle ? [...REQUIRED, ...REQUIRED_VEHICLE] : REQUIRED;
        setUnverified(
          slots.filter((slot) => !docs.some((d) => d.docType === slot.docType && (d.side || '') === slot.side && d.status === 'verified'))
        );
      })
      .catch(() => {});
  }, [enabled, hasVehicle]);

  return unverified;
}

export default useUnverifiedRequiredDocs;
