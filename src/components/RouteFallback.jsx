import { useT } from '../i18n/index.js';

// Shown briefly while a lazy-loaded route chunk downloads. The initial page
// load is already covered by <Preloader />'s minimum splash time, so this
// only appears on subsequent client-side navigations to a not-yet-fetched
// route.
export default function RouteFallback() {
  const t = useT();
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }} aria-busy="true" aria-label={t('routeFallback.loading')}>
      <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
    </div>
  );
}
