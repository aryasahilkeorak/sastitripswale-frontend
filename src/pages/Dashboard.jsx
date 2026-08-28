import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { api, apiError } from '../lib/api.js';
import { useAuth } from '../store/auth.js';
import {
  imageUrl,
  rupee,
  paiseToRupee,
  timeAgo,
  AVATAR_FALLBACK,
  isVehicleModelYearMistake,
  VEHICLE_MODEL_YEAR_MISTAKE_MSG,
  SOCIAL_PLATFORMS,
} from '../lib/helpers.js';
import { getBrandsForType, getModelsForBrand, getVehicleYearOptions, OTHER_OPTION } from '../lib/vehicleCatalog.js';
import { toEmbedUrl, getThumbnail } from '../lib/videoEmbed.js';
import { toast } from '../lib/toast.js';
import { confirm } from '../lib/confirm.js';
import Modal from '../components/Modal.jsx';
import CustomSelect from '../components/CustomSelect.jsx';
import CustomNumberStepper from '../components/CustomNumberStepper.jsx';
import SelfieCapture from '../components/SelfieCapture.jsx';
import Loader from '../components/Loader.jsx';
import { useT, LANGUAGES } from '../i18n/index.js';
import { useLanguage } from '../store/language.js';

// "My Profile" IS the public profile page (MemberDetail, at /members/:id) -
// same page everyone else's profile uses, Instagram-style, just with
// isSelf-gated extras (Host a Trip, delete trip, Edit Profile). Settings is
// the only thing that still lives on /dashboard, reached via the navbar's
// "Settings" link or a notification/CTA deep link (?tab=settings).
export default function Dashboard() {
  const user = useAuth((s) => s.user);
  const viewMode = useAuth((s) => s.viewMode);
  const t = useT();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'settings' ? 'settings' : 'profile';
  const settingsView = ['payments', 'influencer', 'wallet', 'documents', 'language'].includes(searchParams.get('view'))
    ? searchParams.get('view')
    : null;
  const [payments, setPayments] = useState([]);

  // Pushes a real history entry per sub-view (instead of just swapping local
  // state) so the back button - navigate(-1) below - retraces the actual
  // path taken: Profile → Settings → Wallet steps back one hop at a time,
  // while a direct Profile → Wallet deep link steps back straight to Profile.
  const setSettingsView = (v) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', 'settings');
    if (v) next.set('view', v);
    else next.delete('view');
    setSearchParams(next);
  };

  useEffect(() => {
    api.get('/payments/history').then((r) => setPayments(r.data.payments)).catch(() => {});
  }, []);

  // Admins get the dedicated admin dashboard, not the member one - unless
  // they chose "Continue as User" at login.
  if (viewMode !== 'user' && user && (user.role === 'admin' || user.role === 'superadmin')) {
    return <Navigate to="/admin" replace />;
  }

  if (tab !== 'settings') {
    return <Navigate to={`/members/${user?.username || user?.id}`} replace />;
  }

  const settingsTitle =
    settingsView === 'payments' ? 'Payments' :
    settingsView === 'influencer' ? 'Influencer / Promoter' :
    settingsView === 'wallet' ? 'Wallet' :
    settingsView === 'documents' ? 'My Documents' :
    settingsView === 'language' ? t('settings.language') :
    t('settings.title');

  return (
    <section className="cp-section">
      <div className="container" style={{ maxWidth: 680 }}>
        <div className="edit-profile-head">
          {settingsView ? (
            <button type="button" className="ig-id-btn" onClick={() => navigate(-1)} aria-label="Back">
              <i className="fa-solid fa-arrow-left" />
            </button>
          ) : (
            <Link to={`/members/${user?.username || user?.id}`} className="ig-id-btn" aria-label="Back to profile">
              <i className="fa-solid fa-arrow-left" />
            </Link>
          )}
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', margin: 0 }}>{settingsTitle}</h1>
        </div>
        <SettingsForm user={user} payments={payments} view={settingsView} setView={setSettingsView} />
      </div>
    </section>
  );
}

function SettingsRow({ icon, title, sub, onClick, to }) {
  const content = (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span className="notif-icon"><i className={icon} /></span>
        <div>
          <strong style={{ fontSize: '0.92rem' }}>{title}</strong>
          <div className="text-muted" style={{ fontSize: '0.78rem' }}>{sub}</div>
        </div>
      </div>
      <i className="fa-solid fa-chevron-right text-muted" />
    </>
  );
  if (to) {
    return <Link to={to} className="card row-between" style={{ padding: 16, alignItems: 'center' }}>{content}</Link>;
  }
  return (
    <button type="button" className="card row-between" style={{ padding: 16, alignItems: 'center', width: '100%', textAlign: 'left' }} onClick={onClick}>
      {content}
    </button>
  );
}

// Mobile-app-style settings hub: a menu of rows, some navigating out (Edit
// profile, Help), some drilling into an inline sub-view within this same
// tab (Payments, Influencer) - matches how Instagram/most apps structure
// their settings screen instead of scattering these across top-level tabs.
function SettingsForm({ user, payments, view, setView }) {
  const clear = useAuth((s) => s.clear);
  const t = useT();
  const currentLanguage = useLanguage((s) => s.language);
  const currentLanguageLabel = LANGUAGES.find((l) => l.code === currentLanguage)?.nativeName || 'English';

  const logout = async () => {
    await api.post('/auth/logout').catch(() => {});
    clear();
    toast('fa-solid fa-hand', 'Logged out');
  };

  if (view === 'payments') {
    return (
      <div style={{ maxWidth: 680 }}>
        {payments.length === 0 ? (
          <div className="empty-state"><i className="fa-solid fa-credit-card" /><p>No payments yet.</p>{!user?.membershipActive && <Link to="/join" className="btn btn-primary mt-3">View plans</Link>}</div>
        ) : (
          payments.map((p) => (
            <div key={p._id} className="notif-item">
              <div className="notif-icon"><i className="fa-solid fa-credit-card" /></div>
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: '0.88rem' }}>
                  {p.purpose === 'trip_pack' ? `Trip Pass - ${p.packTier} trip${p.packTier > 1 ? 's' : ''}` : 'Membership'}
                </strong>
                <p className="text-muted" style={{ fontSize: '0.78rem' }}>
                  {p.razorpayPaymentId || p._id}{p.couponUsed ? ` · ${p.couponUsed}` : ''} · {timeAgo(p.createdAt)}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700 }}>{paiseToRupee(p.amount)}</div>
                <span className={`badge ${p.status === 'success' ? 'badge-green' : p.status === 'failed' ? 'badge-red' : 'badge-gold'}`}>{p.status}</span>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  if (view === 'influencer') {
    return <InfluencerTab />;
  }

  if (view === 'wallet') {
    return <WalletTab user={user} />;
  }

  if (view === 'documents') {
    return <DocumentsCard user={user} bare />;
  }

  if (view === 'language') {
    return <LanguageTab />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640 }}>
      <Link to="/edit-profile" className="card row-between" style={{ padding: 16, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src={imageUrl(user?.avatarUrl, AVATAR_FALLBACK)}
            alt=""
            style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
            onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)}
          />
          <div>
            <strong style={{ fontSize: '0.92rem' }}>{t('settings.editProfile')}</strong>
            <div className="text-muted" style={{ fontSize: '0.78rem' }}>{t('settings.editProfileSub')}</div>
          </div>
        </div>
        <i className="fa-solid fa-chevron-right text-muted" />
      </Link>

      <SettingsRow icon="fa-solid fa-credit-card" title={t('settings.payments')} sub={t('settings.paymentsSub')} onClick={() => setView('payments')} />
      <SettingsRow icon="fa-solid fa-wallet" title={t('settings.wallet')} sub={t('settings.walletSub')} onClick={() => setView('wallet')} />
      <SettingsRow icon="fa-solid fa-star" title={t('settings.influencer')} sub={t('settings.influencerSub')} onClick={() => setView('influencer')} />
      <SettingsRow icon="fa-solid fa-language" title={t('settings.language')} sub={currentLanguageLabel} onClick={() => setView('language')} />

      <SettingsRow icon="fa-solid fa-id-card" title={t('settings.documents')} sub={t('settings.documentsSub')} onClick={() => setView('documents')} />
      <VehiclesCard user={user} />

      <SettingsRow icon="fa-solid fa-circle-question" title={t('settings.helpSupport')} sub={t('settings.helpSupportSub')} to="/contact" />

      <div className="card" style={{ padding: 16, borderColor: 'rgba(239,68,68,0.25)' }}>
        <h4 className="mb-2" style={{ fontFamily: 'var(--font-display)' }}>{t('settings.accountHeading')}</h4>
        <p className="text-muted mb-3" style={{ fontSize: '0.85rem' }}>{t('settings.accountSub')}</p>
        <button className="btn" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }} onClick={logout}><i className="fa-solid fa-right-from-bracket" /> {t('settings.logoutBtn')}</button>
      </div>
    </div>
  );
}

// Applies immediately on tap - no separate "Save" step, matching how the
// theme toggle works. Native names are shown as the primary label since
// that's what a reader actually looking for their language will recognize.
function LanguageTab() {
  const t = useT();
  const language = useLanguage((s) => s.language);
  const setLanguage = useLanguage((s) => s.setLanguage);

  const pick = (lang) => {
    setLanguage(lang.code);
    toast('fa-solid fa-language', `${t('settings.languageChanged')} - ${lang.nativeName}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 480 }}>
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          type="button"
          className="card row-between"
          style={{ padding: 16, alignItems: 'center', width: '100%', textAlign: 'left' }}
          onClick={() => pick(lang)}
        >
          <div>
            <strong style={{ fontSize: '0.92rem' }}>{lang.nativeName}</strong>
            {lang.nativeName !== lang.englishName && (
              <div className="text-muted" style={{ fontSize: '0.78rem' }}>{lang.englishName}</div>
            )}
          </div>
          {language === lang.code && <i className="fa-solid fa-circle-check" style={{ color: 'var(--fire)' }} />}
        </button>
      ))}
    </div>
  );
}

const DOC_TYPE_LABEL = {
  aadhaar: 'Aadhaar',
  pan: 'PAN',
  voter_id: 'Voter ID',
  driving_license: 'Driving Licence',
  rc: 'RC',
  selfie: 'Live Selfie',
};
const DOC_STATUS_BADGE = { pending: 'badge-gold', verified: 'badge-green', rejected: 'badge-red' };

// Every doc slot a complete profile needs (see completeProfile's
// REQUIRED_DOC_FIELDS/VEHICLE_DOC_FIELDS on the backend) - used to work out
// what's missing entirely, as opposed to uploaded-but-rejected.
function requiredDocSlots(user) {
  const slots = [
    { docType: 'selfie', side: '', label: 'Live Selfie' },
    { docType: 'aadhaar', side: 'front', label: 'Aadhaar (front)' },
    { docType: 'aadhaar', side: 'back', label: 'Aadhaar (back)' },
  ];
  if (user?.hasVehicle) {
    slots.push(
      { docType: 'driving_license', side: 'front', label: 'Driving Licence (front)' },
      { docType: 'driving_license', side: 'back', label: 'Driving Licence (back)' },
      { docType: 'rc', side: 'front', label: 'Vehicle RC (front)' },
      { docType: 'rc', side: 'back', label: 'Vehicle RC (back)' }
    );
  }
  return slots;
}

export function DocumentsCard({ user, bare = false }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reuploadingId, setReuploadingId] = useState(null);
  const [selfieReuploadId, setSelfieReuploadId] = useState(null);
  const [addSelfieOpen, setAddSelfieOpen] = useState(false);
  const [addingSlot, setAddingSlot] = useState(null); // the missing slot a plain file input is currently targeting
  const fileRef = useRef(null);
  const addFileRef = useRef(null);

  const load = () => {
    setLoading(true);
    api.get('/members/documents').then((r) => setDocs(r.data.documents)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const missingSlots = requiredDocSlots(user).filter(
    (slot) => !docs.some((d) => d.docType === slot.docType && (d.side || '') === slot.side)
  );

  const pickReupload = async (doc) => {
    // Retaking an already-verified selfie sends it back for admin review -
    // worth a heads-up before they lose that status. ID documents can't be
    // reuploaded once verified at all, so this branch is selfie-only.
    if (doc.docType === 'selfie' && doc.status === 'verified') {
      const ok = await confirm({
        message: "Your selfie is already verified. Retaking it will send it back for admin review.",
        confirmLabel: 'Retake anyway',
      });
      if (!ok) return;
    }
    if (doc.docType === 'selfie') {
      setSelfieReuploadId(doc._id);
      return;
    }
    setReuploadingId(doc._id);
    setTimeout(() => fileRef.current?.click(), 0);
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !reuploadingId) return;
    try {
      const fd = new FormData();
      fd.append('file', file);
      await api.put(`/members/documents/${reuploadingId}`, fd);
      toast('fa-solid fa-circle-check', 'Document re-uploaded - pending review');
      load();
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setReuploadingId(null);
    }
  };

  const submitSelfieReupload = async (file) => {
    if (!file || !selfieReuploadId) return;
    try {
      const fd = new FormData();
      fd.append('file', file);
      await api.put(`/members/documents/${selfieReuploadId}`, fd);
      toast('fa-solid fa-circle-check', 'Selfie re-uploaded - pending review');
      load();
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setSelfieReuploadId(null);
    }
  };

  const submitNewSelfie = async (file) => {
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('document', file);
      fd.append('docType', 'selfie');
      await api.post('/members/document', fd);
      toast('fa-solid fa-circle-check', 'Selfie uploaded - pending review');
      setAddSelfieOpen(false);
      load();
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    }
  };

  const pickAddSlot = (slot) => {
    setAddingSlot(slot);
    setTimeout(() => addFileRef.current?.click(), 0);
  };

  const onAddFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !addingSlot) return;
    try {
      const fd = new FormData();
      fd.append('document', file);
      fd.append('docType', addingSlot.docType);
      if (addingSlot.side) fd.append('side', addingSlot.side);
      await api.post('/members/document', fd);
      toast('fa-solid fa-circle-check', `${addingSlot.label} uploaded - pending review`);
      load();
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setAddingSlot(null);
    }
  };

  if (loading) return null;
  if (docs.length === 0 && missingSlots.length === 0) return null;

  return (
    <div className={bare ? '' : 'card'} style={bare ? undefined : { padding: 16 }}>
      {!bare && <h4 className="mb-3" style={{ fontFamily: 'var(--font-display)' }}>My Documents</h4>}
      <input ref={fileRef} type="file" accept="image/*,application/pdf" hidden onChange={onFile} />
      <input ref={addFileRef} type="file" accept="image/*,application/pdf" hidden onChange={onAddFile} />

      {docs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: missingSlots.length ? 16 : 0 }}>
          {docs.map((d) => (
            <div key={d._id} className="row-between" style={{ alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="notif-icon"><i className="fa-solid fa-id-card" /></span>
                <div>
                  <strong style={{ fontSize: '0.88rem' }}>{DOC_TYPE_LABEL[d.docType] || d.docType}{d.side ? ` (${d.side})` : ''}</strong>
                  <div><span className={`badge ${DOC_STATUS_BADGE[d.status] || 'badge-gold'}`} style={{ fontSize: '0.62rem', marginTop: 4 }}>{d.status}</span></div>
                </div>
              </div>
              {(d.status !== 'verified' || d.docType === 'selfie') && (
                <button className="btn btn-sm btn-outline" onClick={() => pickReupload(d)}>
                  <i className="fa-solid fa-rotate" /> Reupload
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {missingSlots.length > 0 && (
        <div>
          <p className="text-muted" style={{ fontSize: '0.78rem', margin: '0 0 10px' }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ color: 'var(--fire)' }} /> Still missing - required to plan or join trips:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {missingSlots.map((slot) => (
              <div key={`${slot.docType}-${slot.side}`} className="row-between" style={{ alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="notif-icon"><i className={slot.docType === 'selfie' ? 'fa-solid fa-camera-retro' : 'fa-solid fa-id-card'} /></span>
                  <strong style={{ fontSize: '0.88rem' }}>{slot.label}</strong>
                </div>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => (slot.docType === 'selfie' ? setAddSelfieOpen(true) : pickAddSlot(slot))}
                >
                  <i className="fa-solid fa-upload" /> Upload
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal open={Boolean(selfieReuploadId)} onClose={() => setSelfieReuploadId(null)} title="Retake your live selfie">
        <SelfieCapture onChange={submitSelfieReupload} />
      </Modal>
      <Modal open={addSelfieOpen} onClose={() => setAddSelfieOpen(false)} title="Upload your live selfie">
        <SelfieCapture onChange={submitNewSelfie} />
      </Modal>
    </div>
  );
}

function VehiclesCard({ user }) {
  const setUser = useAuth((s) => s.setUser);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showEditPrimary, setShowEditPrimary] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/members/vehicles').then((r) => setVehicles(r.data.vehicles)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const hasPrimary = Boolean(user?.hasVehicle && user?.vehicleType);

  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="row-between mb-3">
        <h4 style={{ fontFamily: 'var(--font-display)' }}>My Vehicles</h4>
        <button className="btn btn-sm btn-outline" onClick={() => setShowAdd(true)}>
          <i className="fa-solid fa-plus" /> Add vehicle
        </button>
      </div>

      {loading ? null : !hasPrimary && vehicles.length === 0 ? (
        <div className="empty-state-sm">
          <i className="fa-solid fa-car-side" />
          <p>No vehicles added yet. Add one to work toward the Verified Vehicle Owner badge.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {hasPrimary && (
            <div className="row-between" style={{ alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="notif-icon"><i className="fa-solid fa-car" /></span>
                <div>
                  <strong style={{ fontSize: '0.88rem' }}>
                    {[user.vehicleType, user.vehicleModel].filter(Boolean).join(' · ')}
                  </strong>
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>From your profile</div>
                </div>
              </div>
              <button type="button" className="btn btn-sm btn-outline" onClick={() => setShowEditPrimary(true)}>Edit</button>
            </div>
          )}
          {vehicles.map((v) => (
            <div key={v.id} className="row-between" style={{ alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="notif-icon"><i className="fa-solid fa-car" /></span>
                <div>
                  <strong style={{ fontSize: '0.88rem' }}>
                    {[v.brand, v.vehicleModel, v.year].filter(Boolean).join(' ') || v.vehicleType}
                  </strong>
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                    {v.regNumber}
                    {v.mileageKmpl ? ` · ${v.mileageKmpl} km/l` : ''}
                    {v.fuelType ? ` · ${v.fuelType}` : ''}
                  </div>
                </div>
              </div>
              <span className={`badge ${DOC_STATUS_BADGE[v.status] || 'badge-gold'}`} style={{ fontSize: '0.62rem' }}>{v.status}</span>
            </div>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add a vehicle">
        <AddVehicleForm
          onDone={() => {
            setShowAdd(false);
            load();
          }}
        />
      </Modal>

      <Modal open={showEditPrimary} onClose={() => setShowEditPrimary(false)} title="Edit your vehicle">
        <EditPrimaryVehicleForm
          user={user}
          onDone={(updatedUser) => {
            setUser(updatedUser);
            setShowEditPrimary(false);
          }}
        />
      </Modal>
    </div>
  );
}

// The profile's primary vehicle stores brand+model as one free-text string
// (e.g. "Honda Amaze") - best-effort split it back into brand/model so the
// catalog dropdowns below can start pre-filled instead of blank.
function guessBrandModel(vehicleType, vehicleModel) {
  const text = (vehicleModel || '').trim();
  if (!text) return { brand: '', model: '' };
  for (const brand of getBrandsForType(vehicleType)) {
    if (brand === OTHER_OPTION) continue;
    if (text === brand) return { brand, model: '' };
    if (text.startsWith(`${brand} `)) return { brand, model: text.slice(brand.length + 1) };
  }
  return { brand: '', model: '' };
}

function EditPrimaryVehicleForm({ user, onDone }) {
  const [vehicleType, setVehicleType] = useState(user?.vehicleType || '');
  const guessed = guessBrandModel(user?.vehicleType, user?.vehicleModel);
  const [brand, setBrand] = useState(guessed.brand);
  const [brandOther, setBrandOther] = useState(guessed.brand ? '' : user?.vehicleModel || '');
  const [vehicleModel, setVehicleModel] = useState(guessed.model);
  const [modelOther, setModelOther] = useState('');
  const [year, setYear] = useState(user?.vehicleYear || '');
  const [mileageKmpl, setMileageKmpl] = useState(user?.mileageKmpl || '');
  const [fuelType, setFuelType] = useState(user?.fuelType || '');
  const [busy, setBusy] = useState(false);

  const handleVehicleType = (e) => {
    setVehicleType(e.target.value);
    setBrand('');
    setBrandOther('');
    setVehicleModel('');
    setModelOther('');
  };
  const handleBrand = (e) => {
    setBrand(e.target.value);
    setVehicleModel('');
    setModelOther('');
  };

  const brandOptions = [{ value: '', label: 'Select' }, ...getBrandsForType(vehicleType)];
  const modelOptions = [{ value: '', label: 'Select' }, ...getModelsForBrand(vehicleType, brand)];
  const yearOptions = [{ value: '', label: 'Select' }, ...getVehicleYearOptions()];

  const submit = async (e) => {
    e.preventDefault();
    if (!vehicleType) return toast('fa-solid fa-triangle-exclamation', 'Select your vehicle type');
    const finalBrand = brand === OTHER_OPTION ? brandOther.trim() : brand;
    const finalModel = vehicleModel === OTHER_OPTION ? modelOther.trim() : vehicleModel;
    const combined = [finalBrand, finalModel].filter(Boolean).join(' ');
    if (isVehicleModelYearMistake(combined)) return toast('fa-solid fa-triangle-exclamation', VEHICLE_MODEL_YEAR_MISTAKE_MSG);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('vehicleType', vehicleType);
      fd.append('vehicleModel', combined);
      fd.append('vehicleYear', year);
      fd.append('mileageKmpl', mileageKmpl);
      fd.append('fuelType', fuelType);
      const { data } = await api.put('/members/profile', fd);
      toast('fa-solid fa-circle-check', 'Vehicle updated');
      onDone(data.user);
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <div className="form-group">
        <label>Vehicle type *</label>
        <CustomSelect
          value={vehicleType}
          onChange={handleVehicleType}
          options={[{ value: '', label: 'Select' }, 'Bike', 'Car', 'Bus', 'Other']}
        />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Brand</label>
          <CustomSelect value={brand} onChange={handleBrand} options={brandOptions} disabled={!vehicleType} />
        </div>
        <div className="form-group">
          <label>Model name</label>
          <CustomSelect value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} options={modelOptions} disabled={!brand} />
        </div>
      </div>
      {brand === OTHER_OPTION && (
        <div className="form-group">
          <label>Brand name</label>
          <input className="form-input" value={brandOther} onChange={(e) => setBrandOther(e.target.value)} placeholder="Enter brand name" />
        </div>
      )}
      {vehicleModel === OTHER_OPTION && (
        <div className="form-group">
          <label>Model name</label>
          <input className="form-input" value={modelOther} onChange={(e) => setModelOther(e.target.value)} placeholder="Enter model name" />
        </div>
      )}
      <div className="form-row">
        <div className="form-group">
          <label>Model year</label>
          <CustomSelect value={year} onChange={(e) => setYear(e.target.value)} options={yearOptions} />
        </div>
        <div className="form-group">
          <label>Mileage (km/l)</label>
          <CustomNumberStepper min={1} max={200} value={mileageKmpl} onChange={(e) => setMileageKmpl(e.target.value)} placeholder="e.g. 16" />
        </div>
      </div>
      <div className="form-group">
        <label>Fuel type</label>
        <CustomSelect value={fuelType} onChange={(e) => setFuelType(e.target.value)} options={VEHICLE_FUEL_TYPES} />
      </div>
      <p className="text-muted" style={{ fontSize: '0.72rem', margin: '-8px 0 12px' }}>
        <i className="fa-solid fa-gas-pump" /> Mileage &amp; fuel type here auto-suggest your trip's fuel cost on Plan a Trip.
      </p>
      <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
        {busy ? <span className="spinner" /> : <i className="fa-solid fa-floppy-disk" />} Save
      </button>
    </form>
  );
}

const VEHICLE_FUEL_TYPES = [{ value: '', label: 'Select' }, 'Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'];
const CURRENT_YEAR = new Date().getFullYear();

function AddVehicleForm({ onDone }) {
  const [vehicleType, setVehicleType] = useState('');
  const [brand, setBrand] = useState('');
  const [brandOther, setBrandOther] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [modelOther, setModelOther] = useState('');
  const [year, setYear] = useState('');
  const [mileageKmpl, setMileageKmpl] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [rcFront, setRcFront] = useState(null);
  const [rcBack, setRcBack] = useState(null);
  const [busy, setBusy] = useState(false);
  const setUser = useAuth((s) => s.setUser);

  // Brand list depends on vehicle type; model list depends on that brand -
  // reset the field(s) below whichever one just changed so a stale
  // Bike-brand model can't linger after switching to Car, etc.
  const handleVehicleType = (e) => {
    setVehicleType(e.target.value);
    setBrand('');
    setBrandOther('');
    setVehicleModel('');
    setModelOther('');
  };
  const handleBrand = (e) => {
    setBrand(e.target.value);
    setVehicleModel('');
    setModelOther('');
  };

  const brandOptions = [{ value: '', label: 'Select' }, ...getBrandsForType(vehicleType)];
  const modelOptions = [{ value: '', label: 'Select' }, ...getModelsForBrand(vehicleType, brand)];
  const yearOptions = [{ value: '', label: 'Select' }, ...getVehicleYearOptions()];

  const submit = async (e) => {
    e.preventDefault();
    if (!vehicleType) return toast('fa-solid fa-triangle-exclamation', 'Select a vehicle type');
    const finalBrand = brand === OTHER_OPTION ? brandOther.trim() : brand;
    const finalModel = vehicleModel === OTHER_OPTION ? modelOther.trim() : vehicleModel;
    if (isVehicleModelYearMistake(finalModel)) return toast('fa-solid fa-triangle-exclamation', VEHICLE_MODEL_YEAR_MISTAKE_MSG);
    if (!regNumber.trim()) return toast('fa-solid fa-triangle-exclamation', 'Enter the vehicle registration number');
    if (!rcFront || !rcBack) return toast('fa-solid fa-triangle-exclamation', 'RC (front & back) is required to add a vehicle');

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('vehicleType', vehicleType);
      fd.append('brand', finalBrand);
      fd.append('vehicleModel', finalModel);
      if (year) fd.append('year', year);
      if (mileageKmpl) fd.append('mileageKmpl', mileageKmpl);
      if (fuelType) fd.append('fuelType', fuelType);
      fd.append('regNumber', regNumber.trim());
      fd.append('rcFront', rcFront);
      fd.append('rcBack', rcBack);
      await api.post('/members/vehicles', fd);
      // Refresh the auth store's user so the new vehicle (mileage/fuel
      // type included) is immediately available to the trip cost
      // estimator on Plan a Trip, without needing to log out and back in.
      api.get('/auth/me').then((r) => setUser(r.data.user)).catch(() => {});
      toast('fa-solid fa-circle-check', 'Vehicle added - RC pending review');
      onDone();
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <div className="form-group">
        <label>Vehicle type *</label>
        <CustomSelect
          value={vehicleType}
          onChange={handleVehicleType}
          options={[{ value: '', label: 'Select' }, 'Bike', 'Car', 'Bus', 'Other']}
        />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Brand</label>
          <CustomSelect value={brand} onChange={handleBrand} options={brandOptions} disabled={!vehicleType} />
        </div>
        <div className="form-group">
          <label>Model name</label>
          <CustomSelect value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} options={modelOptions} disabled={!brand} />
        </div>
      </div>
      {brand === OTHER_OPTION && (
        <div className="form-group"><label>Brand name</label><input className="form-input" value={brandOther} onChange={(e) => setBrandOther(e.target.value)} placeholder="e.g. Force" /></div>
      )}
      {vehicleModel === OTHER_OPTION && (
        <div className="form-group"><label>Model name</label><input className="form-input" value={modelOther} onChange={(e) => setModelOther(e.target.value)} placeholder="e.g. Gurkha" /></div>
      )}
      <div className="form-row">
        <div className="form-group">
          <label>Model year</label>
          <CustomSelect value={year} onChange={(e) => setYear(e.target.value)} options={yearOptions} />
        </div>
        <div className="form-group"><label>Mileage (km/l)</label><CustomNumberStepper min={1} max={200} value={mileageKmpl} onChange={(e) => setMileageKmpl(e.target.value)} placeholder="e.g. 16" /></div>
      </div>
      <div className="form-group">
        <label>Fuel type</label>
        <CustomSelect value={fuelType} onChange={(e) => setFuelType(e.target.value)} options={VEHICLE_FUEL_TYPES} />
      </div>
      <div className="form-group"><label>Registration number *</label><input className="form-input" value={regNumber} onChange={(e) => setRegNumber(e.target.value)} placeholder="e.g. DL01AB1234" /></div>

      <div className="form-row">
        <div className="form-group">
          <label>RC - front *</label>
          <div className="upload-box upload-box-doc" onClick={() => document.getElementById('vehicle-rc-front')?.click()}>
            <div className="upload-label">{rcFront ? <><i className="fa-solid fa-check" style={{ color: 'var(--fire)' }} /> <span className="upload-filename">{rcFront.name}</span></> : 'Upload photo'}</div>
            <input id="vehicle-rc-front" type="file" accept="image/*,application/pdf" onChange={(e) => setRcFront(e.target.files?.[0] || null)} />
          </div>
        </div>
        <div className="form-group">
          <label>RC - back *</label>
          <div className="upload-box upload-box-doc" onClick={() => document.getElementById('vehicle-rc-back')?.click()}>
            <div className="upload-label">{rcBack ? <><i className="fa-solid fa-check" style={{ color: 'var(--fire)' }} /> <span className="upload-filename">{rcBack.name}</span></> : 'Upload photo'}</div>
            <input id="vehicle-rc-back" type="file" accept="image/*,application/pdf" onChange={(e) => setRcBack(e.target.files?.[0] || null)} />
          </div>
        </div>
      </div>

      <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
        {busy ? <span className="spinner" /> : <i className="fa-solid fa-car" />} Add vehicle
      </button>
    </form>
  );
}

const WITHDRAWAL_STATUS_BADGE = { pending: 'badge-gold', approved: 'badge-cyan', paid: 'badge-green', rejected: 'badge-red' };

// Wallet: referral rewards + (for influencers) commission earnings, with a
// withdrawal-request form. Admin reviews/pays out manually - see AdminWallet.jsx.
function WalletTab({ user }) {
  const [wallet, setWallet] = useState(undefined); // undefined = loading
  const [showWithdraw, setShowWithdraw] = useState(false);

  const load = () => api.get('/wallet/me').then((r) => setWallet(r.data)).catch(() => setWallet(null));
  useEffect(() => {
    load();
  }, []);

  if (wallet === undefined) return <Loader label="Loading wallet…" />;

  const balancePaise = wallet?.balancePaise || 0;
  const lifetimeEarningsPaise = wallet?.lifetimeEarningsPaise || 0;
  const withdrawals = wallet?.withdrawals || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640 }}>
      <div className="card" style={{ padding: 24, textAlign: 'center' }}>
        <div className="why-icon" style={{ background: 'rgba(16,185,129,0.14)', color: '#6ee7b7', margin: '0 auto 12px' }}>
          <i className="fa-solid fa-wallet" />
        </div>
        <div style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}>{paiseToRupee(balancePaise)}</div>
        <p className="text-muted" style={{ fontSize: '0.85rem' }}>Available balance</p>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '4px 12px', borderRadius: 'var(--r-pill)', background: 'rgba(255,201,77,0.1)', border: '1px solid rgba(255,201,77,0.2)' }}>
          <i className="fa-solid fa-chart-line" style={{ color: 'var(--gold)', fontSize: '0.75rem' }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>{paiseToRupee(lifetimeEarningsPaise)}</span>
          <span className="text-muted" style={{ fontSize: '0.72rem' }}>lifetime earnings</span>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 12 }}>
          <button className="btn btn-primary" onClick={() => setShowWithdraw(true)} disabled={balancePaise < 10000}>
            <i className="fa-solid fa-money-bill-transfer" /> Withdraw
          </button>
        </div>
        {balancePaise < 10000 && (
          <p className="text-muted" style={{ fontSize: '0.72rem', marginTop: 8 }}>Minimum withdrawal amount is ₹100.</p>
        )}
      </div>

      <div className="card" style={{ padding: 24 }}>
        <h4 className="mb-3" style={{ fontFamily: 'var(--font-display)' }}>Withdrawal History</h4>
        {withdrawals.length === 0 ? (
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>No withdrawal requests yet.</p>
        ) : (
          withdrawals.map((w) => (
            <div key={w._id} className="notif-item" style={{ flexWrap: 'wrap' }}>
              <div className="notif-icon"><i className="fa-solid fa-money-bill-transfer" /></div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <strong style={{ fontSize: '0.88rem' }}>{paiseToRupee(w.amountPaise)}</strong>
                <p className="text-muted" style={{ fontSize: '0.78rem' }}>{w.upiId} · {timeAgo(w.createdAt)}</p>
                <p className="text-muted" style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>
                  {w.transactionRef ? `Txn ID: ${w.transactionRef}` : `Request ID: ${w._id}`}
                </p>
                {w.adminNote && <p className="text-muted" style={{ fontSize: '0.72rem' }}>Note: {w.adminNote}</p>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignSelf: 'flex-start', gap: 6, width: 92 }}>
                <span
                  className={`badge ${WITHDRAWAL_STATUS_BADGE[w.status] || 'badge-gold'}`}
                  style={{ width: '100%', boxSizing: 'border-box', justifyContent: 'center', padding: '7px 0' }}
                >
                  {w.status}
                </span>
                <Link
                  to={`/contact?subject=${encodeURIComponent('Withdrawal / Wallet')}&message=${encodeURIComponent(
                    `Regarding my withdrawal request (${w.transactionRef ? `Txn ID: ${w.transactionRef}` : `Request ID: ${w._id}`}, amount: ${paiseToRupee(w.amountPaise)}, status: ${w.status}) - `
                  )}`}
                  className="btn btn-sm btn-outline"
                  style={{ width: '100%', boxSizing: 'border-box', justifyContent: 'center', padding: '7px 0', fontSize: '0.72rem' }}
                >
                  <i className="fa-regular fa-circle-question" /> Help
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal open={showWithdraw} onClose={() => setShowWithdraw(false)} title="Withdraw from Wallet">
        <WithdrawForm
          user={user}
          maxPaise={balancePaise}
          onDone={() => {
            setShowWithdraw(false);
            load();
          }}
        />
      </Modal>
    </div>
  );
}

function WithdrawForm({ user, maxPaise, onDone }) {
  const [name, setName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [upiId, setUpiId] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [qrCode, setQrCode] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const amountPaise = Math.round(Number(amount) * 100);
    if (!name.trim()) return toast('fa-solid fa-triangle-exclamation', 'Enter your name');
    if (!/^\S+@\S+\.\S+$/.test(email)) return toast('fa-solid fa-triangle-exclamation', 'Enter a valid email');
    if (!upiId.trim()) return toast('fa-solid fa-triangle-exclamation', 'Enter your UPI ID');
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(panNumber.trim())) return toast('fa-solid fa-triangle-exclamation', 'Enter a valid PAN number');
    if (!qrCode) return toast('fa-solid fa-triangle-exclamation', 'Upload a QR code image of your bank/UPI account');
    if (!amountPaise || amountPaise < 10000) return toast('fa-solid fa-triangle-exclamation', 'Minimum withdrawal amount is ₹100');
    if (amountPaise > maxPaise) return toast('fa-solid fa-triangle-exclamation', 'Amount exceeds your wallet balance');

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('name', name.trim());
      fd.append('email', email.trim());
      fd.append('upiId', upiId.trim());
      fd.append('panNumber', panNumber.trim().toUpperCase());
      fd.append('amountPaise', amountPaise);
      fd.append('qrCode', qrCode);
      await api.post('/wallet/withdraw', fd);
      toast('fa-solid fa-circle-check', 'Withdrawal request submitted');
      onDone();
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <div className="form-group"><label>Full name</label><input className="form-input" value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="form-group"><label>Email</label><input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div className="form-group"><label>UPI ID</label><input className="form-input" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="yourname@bank" /></div>
      <div className="form-group"><label>PAN number</label><input className="form-input" value={panNumber} onChange={(e) => setPanNumber(e.target.value.toUpperCase())} placeholder="ABCDE1234F" maxLength={10} /></div>
      <div className="form-group">
        <label>QR code of your bank/UPI account</label>
        <div className="upload-box upload-box-doc" onClick={() => document.getElementById('withdraw-qr')?.click()}>
          <div className="upload-label">
            {qrCode ? <><i className="fa-solid fa-check" style={{ color: 'var(--fire)' }} /> <span className="upload-filename">{qrCode.name}</span></> : 'Upload QR code image'}
          </div>
          <input id="withdraw-qr" type="file" accept="image/*" hidden onChange={(e) => setQrCode(e.target.files?.[0] || null)} />
        </div>
      </div>
      <div className="form-group">
        <label>Amount to withdraw (₹)</label>
        <CustomNumberStepper prefix="₹" min={100} max={maxPaise / 100} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 500" />
        <p className="text-muted" style={{ fontSize: '0.72rem', marginTop: 6 }}>Available: {paiseToRupee(maxPaise)} · Minimum ₹100</p>
      </div>
      <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
        {busy ? <span className="spinner" /> : <i className="fa-solid fa-paper-plane" />} Submit Request
      </button>
    </form>
  );
}

// Self-service influencer status: apply (not applied / previously rejected),
// "under review" (pending), or coupon + commission + earnings ledger (approved).
const EMPTY_APPLICATION = {
  reason: '',
  totalFollowers: '',
  avgReelViews: '',
  instagram: '',
  facebook: '',
  twitter: '',
  youtube: '',
  linkedin: '',
};

function InfluencerTab() {
  const [influencer, setInfluencer] = useState(undefined); // undefined = loading
  const [form, setForm] = useState(EMPTY_APPLICATION);
  const [screenshot, setScreenshot] = useState(null);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoBusy, setVideoBusy] = useState(false);
  const [playingVideo, setPlayingVideo] = useState(null);
  const screenshotRef = useRef(null);

  const load = (silent) => {
    if (silent) setRefreshing(true);
    return api
      .get('/influencers/me')
      .then((r) => setInfluencer(r.data.influencer))
      .catch(() => setInfluencer((prev) => (prev === undefined ? null : prev)))
      .finally(() => setRefreshing(false));
  };
  // Poll every 20s so referrals/earnings feel real-time without a manual refresh.
  useEffect(() => {
    load();
    const id = setInterval(() => load(true), 20000);
    return () => clearInterval(id);
  }, []);

  const addVideo = async (e) => {
    e.preventDefault();
    if (!videoUrl.trim()) return;
    setVideoBusy(true);
    try {
      const { data } = await api.post('/influencers/me/videos', { url: videoUrl.trim() });
      setInfluencer((inf) => ({ ...inf, videos: data.videos }));
      setVideoUrl('');
      toast('fa-solid fa-circle-check', 'Video added');
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setVideoBusy(false);
    }
  };

  const removeVideo = async (videoId) => {
    try {
      const { data } = await api.delete(`/influencers/me/videos/${videoId}`);
      setInfluencer((inf) => ({ ...inf, videos: data.videos }));
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    }
  };

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const apply = async (e) => {
    e.preventDefault();
    if (!form.reason.trim()) {
      toast('fa-solid fa-triangle-exclamation', 'Tell us why you want to promote SastiTripsWale');
      return;
    }
    if (!form.totalFollowers || !form.avgReelViews) {
      toast('fa-solid fa-triangle-exclamation', 'Enter your total followers and average reel/video views');
      return;
    }
    if (![form.instagram, form.facebook, form.twitter, form.youtube, form.linkedin].some((v) => v.trim())) {
      toast('fa-solid fa-triangle-exclamation', 'Add at least one social media profile link');
      return;
    }
    if (!screenshot && !influencer?.dashboardScreenshotUrl) {
      toast('fa-solid fa-triangle-exclamation', 'Upload a screenshot of your analytics dashboard (last 6 months\' reach)');
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('reason', form.reason.trim());
      fd.append('totalFollowers', form.totalFollowers);
      fd.append('avgReelViews', form.avgReelViews);
      for (const key of ['instagram', 'facebook', 'twitter', 'youtube', 'linkedin']) {
        if (form[key].trim()) fd.append(key, form[key].trim());
      }
      if (screenshot) fd.append('screenshot', screenshot);
      await api.post('/influencers/apply', fd);
      toast('fa-solid fa-star', 'Application submitted! We\'ll review it soon.');
      setForm(EMPTY_APPLICATION);
      setScreenshot(null);
      load();
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setBusy(false);
    }
  };

  if (influencer === undefined) return <Loader label="Loading…" />;

  if (!influencer || influencer.status === 'rejected') {
    return (
      <div className="card" style={{ padding: 24, maxWidth: 640 }}>
        <div className="why-icon" style={{ background: 'rgba(255,201,77,0.14)', color: 'var(--gold)' }}>
          <i className="fa-solid fa-star" />
        </div>
        <h3 style={{ fontFamily: 'var(--font-display)', marginTop: 14, marginBottom: 8 }}>Become an Influencer</h3>
        <p className="text-muted mb-3">
          Get your own personal coupon code and earn a commission every time someone uses it to join SastiTripsWale.
        </p>
        {influencer?.status === 'rejected' && (
          <p className="text-muted mb-3" style={{ fontSize: '0.82rem' }}>
            Your previous application wasn't approved - you're welcome to apply again.
          </p>
        )}
        <form onSubmit={apply}>
          <div className="form-group">
            <label>Why do you want to promote us?</label>
            <textarea
              className="form-input"
              value={form.reason}
              onChange={setField('reason')}
              maxLength={1000}
              placeholder="Tell us about your audience, social reach, or community..."
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Total followers *</label>
              <CustomNumberStepper min={1} value={form.totalFollowers} onChange={setField('totalFollowers')} placeholder="e.g. 12000" />
            </div>
            <div className="form-group">
              <label>Average views per reel/video *</label>
              <CustomNumberStepper min={1} value={form.avgReelViews} onChange={setField('avgReelViews')} placeholder="e.g. 5000" />
            </div>
          </div>

          <div className="form-group">
            <label>Social media profiles (at least one) *</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SOCIAL_PLATFORMS.map((p) => (
                <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className={p.icon} style={{ width: 20, color: 'var(--text-3)' }} />
                  <input
                    className="form-input"
                    value={form[p.key]}
                    onChange={setField(p.key)}
                    placeholder={`${p.label} profile link or @handle`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Analytics dashboard screenshot (last 6 months' reach) *</label>
            <input
              ref={screenshotRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
            />
            <button type="button" className="btn btn-sm btn-outline" onClick={() => screenshotRef.current?.click()}>
              <i className="fa-solid fa-camera" /> {screenshot ? screenshot.name : 'Choose screenshot'}
            </button>
            <p className="text-muted" style={{ fontSize: '0.72rem', marginTop: 6 }}>
              A screenshot of your Instagram/YouTube/etc. insights dashboard showing your reach over the last 6 months.
            </p>
          </div>

          <button className="btn btn-primary" disabled={busy}>
            {busy ? <span className="spinner" /> : <i className="fa-solid fa-paper-plane" />} Apply Now
          </button>
        </form>
      </div>
    );
  }

  if (influencer.status === 'pending') {
    return (
      <div className="empty-state">
        <i className="fa-regular fa-hourglass-half" />
        <p>Your influencer application is under review. We'll notify you once it's decided.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>
      <div className="card" style={{ padding: 24, textAlign: 'center' }}>
        <div className="why-icon" style={{ background: 'rgba(255,201,77,0.14)', color: 'var(--gold)', margin: '0 auto 12px' }}>
          <i className="fa-solid fa-star" />
        </div>
        <h3 style={{ fontFamily: 'var(--font-display)' }}>You're an Approved Influencer!</h3>
        {influencer.coupon && (
          <>
            <div style={{ fontSize: '1.8rem', fontFamily: 'var(--font-mono)', fontWeight: 800, margin: '16px 0 4px', color: 'var(--fire-2)' }}>
              {influencer.coupon.code}
            </div>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>
              {influencer.coupon.discountPct ? `${influencer.coupon.discountPct}% off` : `${rupee(influencer.coupon.discountAmt)} off`} for anyone who uses this code
            </p>
          </>
        )}
        <div style={{ display: 'flex', gap: 28, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>{influencer.commissionPct}%</div>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>Your commission</div>
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>{influencer.coupon?.usedCount || 0}</div>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>Signups via your code</div>
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>{paiseToRupee(influencer.totalEarnedPaise)}</div>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>Total earned</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <div className="row-between mb-3">
          <h4 style={{ fontFamily: 'var(--font-display)' }}>Referral Earnings</h4>
          <button type="button" className="btn btn-sm btn-outline" onClick={() => load(true)} disabled={refreshing}>
            <i className={`fa-solid fa-rotate${refreshing ? ' fa-spin' : ''}`} /> Refresh
          </button>
        </div>
        {influencer.commissions?.length === 0 ? (
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>No referrals yet - they'll show up here in real time as soon as someone joins with your code.</p>
        ) : (
          influencer.commissions.map((c) => (
            <div key={c._id} className="notif-item" style={{ marginBottom: 8, alignItems: 'center' }}>
              <img
                src={imageUrl(c.user?.avatarUrl, AVATAR_FALLBACK)}
                alt=""
                style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ fontSize: '0.88rem' }}>{c.user?.fullName || 'A member'}</strong>
                <p className="text-muted" style={{ fontSize: '0.75rem' }}>{paiseToRupee(c.amountPaise)} · {timeAgo(c.createdAt)}</p>
              </div>
              <span className={`badge ${c.status === 'paid' ? 'badge-green' : 'badge-gold'}`}>{c.status}</span>
            </div>
          ))
        )}
      </div>

      <div className="card" style={{ padding: 24 }}>
        <h4 className="mb-3" style={{ fontFamily: 'var(--font-display)' }}>Promo Videos</h4>
        <p className="text-muted" style={{ fontSize: '0.82rem', marginTop: -6, marginBottom: 14 }}>
          Link a YouTube or Instagram video promoting SastiTripsWale - it'll show up here for you to keep track of.
        </p>
        <form onSubmit={addVideo} className="form-row" style={{ alignItems: 'flex-start' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <input
              className="form-input"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Paste a YouTube or Instagram video link"
            />
          </div>
          <button className="btn btn-primary" disabled={videoBusy} style={{ marginTop: 2 }}>
            {videoBusy ? <span className="spinner" /> : <i className="fa-solid fa-plus" />} Add
          </button>
        </form>

        {influencer.videos?.length > 0 && (
          <div className="reel-grid" style={{ marginTop: 8 }}>
            {influencer.videos.map((v) => {
              const thumb = getThumbnail(v.url, v.platform);
              return (
                <button type="button" key={v._id} className="reel-tile" onClick={() => setPlayingVideo(v)}>
                  {thumb ? (
                    <img src={thumb} alt="" />
                  ) : (
                    <div className="reel-tile-fallback"><i className="fa-brands fa-instagram" /></div>
                  )}
                  <div className="reel-tile-overlay"><i className="fa-solid fa-play" /></div>
                  <span className="reel-tile-badge">
                    <i className={v.platform === 'youtube' ? 'fa-brands fa-youtube' : 'fa-brands fa-instagram'} />
                  </span>
                  <span
                    className="reel-tile-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeVideo(v._id);
                    }}
                    title="Remove video"
                  >
                    <i className="fa-solid fa-xmark" />
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={Boolean(playingVideo)} onClose={() => setPlayingVideo(null)} title="Promo video">
        {playingVideo && (
          <div style={{ position: 'relative', width: '100%', paddingTop: playingVideo.platform === 'instagram' ? '125%' : '56.25%', borderRadius: 'var(--r)', overflow: 'hidden', background: 'var(--surface)' }}>
            <iframe
              src={toEmbedUrl(playingVideo.url, playingVideo.platform)}
              title={`${playingVideo.platform} video`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
