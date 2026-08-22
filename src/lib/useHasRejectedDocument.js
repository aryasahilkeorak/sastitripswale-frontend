import { useEffect, useState } from 'react';
import { api } from './api.js';

// True once we know at least one of the member's ID documents came back
// rejected - drives the "resubmit your documents" vs. plain "complete your
// profile" wording wherever the profile-completion gate is shown. Only
// fetches while `enabled` (skip the extra request once profile is already
// complete, or membership itself isn't active yet).
export function useHasRejectedDocument(enabled) {
  const [hasRejectedDoc, setHasRejectedDoc] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setHasRejectedDoc(false);
      return;
    }
    api
      .get('/members/documents')
      .then((r) => setHasRejectedDoc((r.data.documents || []).some((d) => d.status === 'rejected')))
      .catch(() => {});
  }, [enabled]);

  return hasRejectedDoc;
}

export default useHasRejectedDocument;
