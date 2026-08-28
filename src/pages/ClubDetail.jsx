import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, apiError } from '../lib/api.js';
import { useAuth } from '../store/auth.js';
import { imageUrl, AVATAR_FALLBACK, DESTINATION_PLACEHOLDER, CLUB_CATEGORY_LABEL, CLUB_CATEGORY_ICON, COVER_ASPECT_RATIO } from '../lib/helpers.js';
import { toast } from '../lib/toast.js';
import { confirm } from '../lib/confirm.js';
import Loader from '../components/Loader.jsx';
import Lightbox from '../components/Lightbox.jsx';
import ProfileGateCard from '../components/ProfileGateCard.jsx';
import AdSlot from '../components/AdSlot.jsx';
import Seo from '../components/Seo.jsx';
import { buildBreadcrumbLd } from '../lib/seo.js';
import { useCanTrip, handleGateError } from '../components/useCanTrip.js';
import ImageCropModal from '../components/ImageCropModal.jsx';
import MemberSearchInput from '../components/MemberSearchInput.jsx';
import PhotoActionMenu from '../components/PhotoActionMenu.jsx';

export default function ClubDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const canAct = useCanTrip();
  const photoRef = useRef(null);
  const coverRef = useRef(null);
  const menuRef = useRef(null);

  const [club, setClub] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [cover, setCover] = useState(null);
  const [pendingPhoto, setPendingPhoto] = useState(null);
  const [pendingCover, setPendingCover] = useState(null);
  const [addBusy, setAddBusy] = useState(false);
  const [zoomImg, setZoomImg] = useState(null);

  const load = () => {
    api
      .get(`/clubs/${id}`)
      .then((r) => setClub(r.data.club))
      .catch(() => setClub(null))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    if (club) {
      setName(club.name || '');
      setDescription(club.description || '');
      setPhoto(null);
      setCover(null);
    }
  }, [club?._id, club?.name, club?.description]);

  if (loading) return <div className="detail-section-loading"><Loader label="Loading club…" /></div>;
  if (!club)
    return (
      <div className="empty-state detail-section-empty">
        <i className="fa-solid fa-triangle-exclamation" />
        <p>Club not found.</p>
        <Link to="/clubs" className="btn btn-primary mt-3">Browse clubs</Link>
      </div>
    );

  const meId = user?.id;
  const isMember = club.isMember;
  const isAdmin = club.isAdmin;
  const isOwner = club.isOwner;

  const toggleJoin = async () => {
    if (!canAct()) return;
    setBusy(true);
    try {
      const { data } = await api.post(`/clubs/${club._id}/join`);
      setClub((c) => ({ ...c, hasRequested: data.requestStatus === 'pending' }));
      toast(
        data.requestStatus === 'pending' ? 'fa-solid fa-paper-plane' : 'fa-solid fa-hand',
        data.requestStatus === 'pending' ? 'Request sent! A club admin will review it.' : 'Request withdrawn'
      );
    } catch (err) {
      if (!handleGateError(err, navigate)) toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const leave = async () => {
    if (!(await confirm(`Leave "${club.name}"?`))) return;
    try {
      await api.delete(`/clubs/${club._id}/members/${meId}`);
      toast('fa-solid fa-hand', 'You left the club');
      navigate('/clubs');
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    }
  };

  const disband = async () => {
    if (!(await confirm({ message: `Disband "${club.name}"? This cannot be undone.`, danger: true, confirmLabel: 'Disband' }))) return;
    try {
      await api.delete(`/clubs/${club._id}`);
      toast('fa-solid fa-trash', 'Club disbanded');
      navigate('/clubs');
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    }
  };

  const saveDetails = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('name', name.trim());
      fd.append('description', description);
      if (photo) fd.append('photo', photo);
      if (cover) fd.append('cover', cover);
      await api.patch(`/clubs/${club._id}`, fd);
      toast('fa-solid fa-circle-check', 'Club updated');
      setEditing(false);
      load();
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const removePhoto = async () => {
    try {
      await api.patch(`/clubs/${club._id}`, { removePhoto: true });
      load();
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    }
  };

  const removeCoverPhoto = async () => {
    try {
      await api.patch(`/clubs/${club._id}`, { removeCoverPhoto: true });
      load();
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    }
  };

  const addMember = async (identifier) => {
    setAddBusy(true);
    try {
      await api.post(`/clubs/${club._id}/members`, { identifier });
      toast('fa-solid fa-circle-check', 'Member added');
      load();
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setAddBusy(false);
    }
  };

  const removeMember = async (uid) => {
    try {
      await api.delete(`/clubs/${club._id}/members/${uid}`);
      toast('fa-solid fa-hand', 'Member removed');
      load();
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    }
  };

  const promote = async (uid) => {
    try {
      await api.post(`/clubs/${club._id}/admins/${uid}`);
      toast('fa-solid fa-user-shield', 'Promoted to admin');
      load();
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    }
  };

  const demote = async (uid) => {
    try {
      await api.delete(`/clubs/${club._id}/admins/${uid}`);
      toast('fa-solid fa-user', 'Demoted to member');
      load();
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    }
  };

  const shareClub = () => {
    setMenuOpen(false);
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: `${club.name} on SastiTripsWale`, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url);
      toast('fa-solid fa-clipboard', 'Club link copied!');
    }
  };

  const copyClubUrl = () => {
    setMenuOpen(false);
    navigator.clipboard?.writeText(window.location.href);
    toast('fa-solid fa-clipboard', 'Club link copied!');
  };

  const respond = async (uid, action) => {
    try {
      await api.patch(`/clubs/${club._id}/requests/${uid}`, { action });
      toast(action === 'accept' ? 'fa-solid fa-circle-check' : 'fa-solid fa-xmark', action === 'accept' ? 'Request accepted' : 'Request rejected');
      load();
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    }
  };

  return (
    <>
    <section className="detail-section">
      <Seo
        title={`${club.name} - ${CLUB_CATEGORY_LABEL[club.category]}`}
        description={club.description || `${club.name} is a ${CLUB_CATEGORY_LABEL[club.category]?.toLowerCase()} on SastiTripsWale with ${club.memberCount} members.`}
        path={`/clubs/${club._id}`}
        image={club.photoUrl ? imageUrl(club.photoUrl) : undefined}
        jsonLd={buildBreadcrumbLd([
          { name: 'Home', path: '/' },
          { name: 'Clubs', path: '/clubs' },
          { name: club.name },
        ])}
      />
      <div className="container">
        <div className="row-between">
          <Link to="/clubs" className="ig-id-btn" aria-label="All clubs" title="All clubs">
            <i className="fa-solid fa-arrow-left" />
          </Link>
          <div className="ig-menu" ref={menuRef} style={{ position: 'relative' }}>
            <button className="ig-id-btn" onClick={() => setMenuOpen((v) => !v)} title="Share club">
              <i className="fa-solid fa-share-nodes" />
            </button>
            {menuOpen && (
              <div className="ig-menu-dropdown">
                <button onClick={shareClub}><i className="fa-solid fa-share-nodes" /> Share club</button>
                <button onClick={copyClubUrl}><i className="fa-solid fa-link" /> Copy club URL</button>
              </div>
            )}
          </div>
        </div>

        <div className="detail-grid mt-3">
          {/* LEFT */}
          <div>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Cover banner - click the camera badge (while editing) to change it, Facebook/LinkedIn-style. */}
              <div style={{ position: 'relative', width: '100%', aspectRatio: COVER_ASPECT_RATIO, background: 'var(--grad-fire)' }}>
                {(cover || club.coverPhotoUrl) && (
                  <img
                    src={cover ? URL.createObjectURL(cover) : imageUrl(club.coverPhotoUrl)}
                    alt=""
                    onClick={() => setZoomImg(cover ? URL.createObjectURL(cover) : imageUrl(club.coverPhotoUrl))}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                  />
                )}
                {isAdmin && editing && (
                  <div style={{ position: 'absolute', right: 10, bottom: 10, display: 'flex', gap: 8 }}>
                    {club.coverPhotoUrl && !cover && (
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{ borderRadius: '50%', width: 34, height: 34, padding: 0, justifyContent: 'center', background: 'rgba(0,0,0,0.55)', color: '#fff' }}
                        onClick={removeCoverPhoto}
                        title="Remove cover photo"
                      >
                        <i className="fa-solid fa-trash" />
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{ borderRadius: '50%', width: 34, height: 34, padding: 0, justifyContent: 'center', background: 'rgba(0,0,0,0.55)', color: '#fff' }}
                      onClick={() => coverRef.current?.click()}
                      title="Change cover photo"
                    >
                      <i className="fa-solid fa-camera" />
                    </button>
                    <input
                      ref={coverRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.target.value = '';
                        if (f) setPendingCover(f);
                      }}
                    />
                  </div>
                )}
              </div>

              <div style={{ padding: '0 20px 20px' }}>
                <div style={{ position: 'relative', width: 120, margin: '-60px 0 16px' }}>
                  <img
                    src={photo ? URL.createObjectURL(photo) : imageUrl(club.photoUrl, DESTINATION_PLACEHOLDER)}
                    alt={club.name}
                    onError={(e) => (e.currentTarget.src = DESTINATION_PLACEHOLDER)}
                    onClick={() => setZoomImg(photo ? URL.createObjectURL(photo) : imageUrl(club.photoUrl, DESTINATION_PLACEHOLDER))}
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '4px solid var(--surface)',
                      display: 'block',
                      cursor: 'pointer',
                    }}
                  />
                  {isAdmin && editing && (
                    <PhotoActionMenu
                      hasPhoto={Boolean(club.photoUrl && !photo)}
                      onChange={() => photoRef.current?.click()}
                      onRemove={removePhoto}
                      style={{ right: 0, bottom: 0 }}
                    />
                  )}
                  <input
                    ref={photoRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = '';
                      if (f) setPendingPhoto(f);
                    }}
                  />
                </div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', marginBottom: 8 }}>{club.name}</h1>
              <span className="badge badge-fire" style={{ marginBottom: 12 }}>
                <i className={CLUB_CATEGORY_ICON[club.category]} /> {CLUB_CATEGORY_LABEL[club.category]}
              </span>
              {club.description && <p className="text-muted" style={{ fontSize: '0.85rem', margin: '12px 0' }}>{club.description}</p>}
              <p className="text-muted" style={{ fontSize: '0.8rem' }}>
                <i className="fa-solid fa-users" /> {club.memberCount} members · Owned by {club.owner?.fullName}
              </p>

              <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {isMember ? (
                  <>
                    <button className="btn btn-primary club-chat-btn" onClick={() => navigate(`/chat/${club._id}`)}>
                      <i className="fa-solid fa-comment-dots" /> Open Club Chat
                    </button>
                    {!isOwner && (
                      <button className="btn btn-outline" onClick={leave}>
                        <i className="fa-solid fa-right-from-bracket" /> Leave Club
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    className={`btn ${club.hasRequested ? 'btn-outline' : 'btn-primary'}`}
                    onClick={toggleJoin}
                    disabled={busy}
                  >
                    <i className={club.hasRequested ? 'fa-regular fa-clock' : 'fa-solid fa-user-plus'} /> {club.hasRequested ? 'Requested - tap to withdraw' : 'Request to Join'}
                  </button>
                )}
              </div>
              {!isMember && <ProfileGateCard action="join a club" />}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
                {isAdmin && !editing && (
                  <button className="btn btn-sm btn-outline" onClick={() => setEditing(true)}>
                    <i className="fa-solid fa-pen" /> Edit Club Info
                  </button>
                )}
                {isOwner && (
                  <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }} onClick={disband}>
                    <i className="fa-solid fa-trash" /> Disband Club
                  </button>
                )}
              </div>
              </div>
            </div>

            {isAdmin && editing && (
              <form onSubmit={saveDetails} className="card mt-3" style={{ padding: 20 }}>
                <p className="text-muted" style={{ fontSize: '0.78rem', marginTop: 0, marginBottom: 14 }}>
                  <i className="fa-solid fa-circle-info" /> Use the camera icons on the cover photo and club photo above to change them.
                </p>
                <div className="form-group">
                  <label>Club name</label>
                  <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea className="form-input" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-sm btn-primary" disabled={busy}>
                    {busy ? <span className="spinner" /> : <i className="fa-solid fa-floppy-disk" />} Save Changes
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    disabled={busy}
                    onClick={() => {
                      setName(club.name || '');
                      setDescription(club.description || '');
                      setEditing(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {isAdmin && club.pendingRequests?.length > 0 && (
              <div className="card mt-3" style={{ padding: 20 }}>
                <h4 className="mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                  <i className="fa-solid fa-inbox" /> Pending Requests ({club.pendingRequests.length})
                </h4>
                {club.pendingRequests.map((r) => (
                  <div key={r._id} className="notif-item" style={{ alignItems: 'center', marginBottom: 8 }}>
                    <img src={imageUrl(r.avatarUrl, AVATAR_FALLBACK)} alt="" style={{ width: 36, height: 36, borderRadius: '50%' }} onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ fontSize: '0.85rem' }}>{r.fullName}</strong>
                    </div>
                    <button className="btn btn-sm btn-primary" onClick={() => respond(r._id, 'accept')}><i className="fa-solid fa-check" /></button>
                    <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }} onClick={() => respond(r._id, 'reject')}><i className="fa-solid fa-xmark" /></button>
                  </div>
                ))}
              </div>
            )}

            {isAdmin && (
              <div className="mt-3">
                <MemberSearchInput onAdd={addMember} busy={addBusy} />
              </div>
            )}

            {isMember ? (
              <div className="card mt-3" style={{ padding: 20 }}>
                <h4 className="mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                  <i className="fa-solid fa-users" /> Members ({club.members?.length})
                </h4>
                <div style={{ maxHeight: 480, overflowY: 'auto' }}>
                  {club.members?.map((m) => {
                    const memberIsOwner = String(m._id) === String(club.owner?._id);
                    const memberIsAdmin = club.admins?.some((a) => String(a._id) === String(m._id));
                    return (
                      <div key={m._id} className="notif-item" style={{ alignItems: 'center', marginBottom: 8 }}>
                        <img src={imageUrl(m.avatarUrl, AVATAR_FALLBACK)} alt="" style={{ width: 36, height: 36, borderRadius: '50%' }} onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong style={{ fontSize: '0.85rem' }}>
                            {m.fullName}
                            {memberIsOwner && <i className="fa-solid fa-crown" style={{ color: 'var(--gold)', marginLeft: 6 }} title="Owner" />}
                            {!memberIsOwner && memberIsAdmin && <span className="badge badge-cyan" style={{ marginLeft: 6, fontSize: '0.6rem' }}>ADMIN</span>}
                          </strong>
                          <div className="text-muted" style={{ fontSize: '0.68rem' }}>{m.city || ''}</div>
                        </div>
                        {isOwner && !memberIsOwner && (
                          memberIsAdmin ? (
                            <button className="btn btn-sm btn-outline" onClick={() => demote(m._id)} title="Demote to member">
                              <i className="fa-solid fa-user-minus" />
                            </button>
                          ) : (
                            <button className="btn btn-sm btn-outline" onClick={() => promote(m._id)} title="Promote to admin">
                              <i className="fa-solid fa-user-shield" />
                            </button>
                          )
                        )}
                        {isAdmin && !memberIsOwner && String(m._id) !== String(meId) && (
                          <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }} onClick={() => removeMember(m._id)} title="Remove from club">
                            <i className="fa-solid fa-xmark" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="card mt-3" style={{ padding: 20 }}>
                <h4 className="mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                  <i className="fa-solid fa-users" /> Members ({club.memberCount})
                </h4>
                {club.previewMembers?.map((m) => (
                  <Link key={m._id} to={`/members/${m.username || m._id}`} className="notif-item club-member-row" style={{ alignItems: 'center', marginBottom: 8, color: 'inherit' }}>
                    <img src={imageUrl(m.avatarUrl, AVATAR_FALLBACK)} alt="" style={{ width: 36, height: 36, borderRadius: '50%' }} onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ fontSize: '0.85rem' }}>
                        {m.fullName}
                        {String(m._id) === String(club.owner?._id) && <i className="fa-solid fa-crown" style={{ color: 'var(--gold)', marginLeft: 6 }} title="Owner" />}
                      </strong>
                      <div className="text-muted" style={{ fontSize: '0.68rem' }}>{m.city || ''}</div>
                    </div>
                    <i className="fa-solid fa-chevron-right" style={{ color: 'var(--text-3)', fontSize: '0.75rem' }} />
                  </Link>
                ))}
                <div className="club-locked-note">
                  <i className="fa-solid fa-lock" />
                  <span>
                    {club.memberCount > (club.previewMembers?.length || 0) && (
                      <strong>+{club.memberCount - club.previewMembers.length} more member{club.memberCount - club.previewMembers.length === 1 ? '' : 's'}. </strong>
                    )}
                    Join this club to see everyone and open the group chat.
                  </span>
                </div>
              </div>
            )}
            <AdSlot placement="detail" />
          </div>

          {/* RIGHT - both cards stick together as one unit while scrolling. */}
          <div className="club-sticky-sidebar">
            <SuggestedClubs currentClub={club} />

            <div className="card mt-3" style={{ padding: 20, textAlign: 'center' }}>
              <div className="why-icon" style={{ background: 'rgba(255,107,0,0.12)', margin: '0 auto 12px' }}>
                <i className="fa-solid fa-motorcycle" />
              </div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', marginBottom: 6 }}>Start Your Own Club</h4>
              <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: 14 }}>
                Own a bike, car, or off-roader? Gather your crew in one place.
              </p>
              <Link to="/plan-club" className="btn btn-sm btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                <i className="fa-solid fa-people-group" /> Create a Club
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>

    <ImageCropModal
      file={pendingPhoto}
      title="Crop club photo"
      onCancel={() => setPendingPhoto(null)}
      onCropped={(cropped) => {
        setPendingPhoto(null);
        setPhoto(cropped);
      }}
    />
    <ImageCropModal
      file={pendingCover}
      aspect={COVER_ASPECT_RATIO}
      guide="rect"
      title="Crop cover photo"
      onCancel={() => setPendingCover(null)}
      onCropped={(cropped) => {
        setPendingCover(null);
        setCover(cropped);
      }}
    />
    <Lightbox images={zoomImg ? [zoomImg] : []} index={zoomImg ? 0 : null} onClose={() => setZoomImg(null)} onIndex={() => {}} />
    </>
  );
}

// Other clubs in the same category, so someone browsing "Cars Club" always
// has somewhere else to go - mirrors the "Suggested for you" panel on a
// member's profile page (same .suggested-card/.suggested-row treatment).
function SuggestedClubs({ currentClub }) {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get('/clubs', { params: { category: currentClub.category, limit: 7 } })
      .then((r) => setClubs(r.data.clubs.filter((c) => c._id !== currentClub._id).slice(0, 6)))
      .catch(() => setClubs([]))
      .finally(() => setLoading(false));
  }, [currentClub._id, currentClub.category]);

  return (
    <div className="card" style={{ padding: 14 }}>
      <h4 className="mb-3" style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}>
        <i className="fa-solid fa-people-group" style={{ color: 'var(--fire)' }} /> Suggested Clubs
      </h4>
      {loading ? (
        <Loader label="Loading…" />
      ) : clubs.length === 0 ? (
        <div className="empty-state-sm">
          <i className="fa-solid fa-compass" />
          <p>No other {CLUB_CATEGORY_LABEL[currentClub.category]?.toLowerCase()}s yet - be the next to start one!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {clubs.map((c) => (
            <Link key={c._id} to={`/clubs/${c._id}`} className="suggested-row">
              <img
                className="suggested-ava"
                src={imageUrl(c.photoUrl, DESTINATION_PLACEHOLDER)}
                alt=""
                onError={(e) => (e.currentTarget.src = DESTINATION_PLACEHOLDER)}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ fontSize: '0.85rem', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.name}
                </strong>
                <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                  <i className={CLUB_CATEGORY_ICON[c.category]} /> {c.memberCount} member{c.memberCount === 1 ? '' : 's'}
                </div>
              </div>
              <i className="fa-solid fa-chevron-right" style={{ color: 'var(--text-3)', fontSize: '0.75rem' }} />
            </Link>
          ))}
        </div>
      )}
      <Link to="/clubs" className="btn btn-sm btn-outline mt-3" style={{ width: '100%', justifyContent: 'center' }}>
        <i className="fa-solid fa-magnifying-glass" /> Browse All Clubs
      </Link>
    </div>
  );
}
