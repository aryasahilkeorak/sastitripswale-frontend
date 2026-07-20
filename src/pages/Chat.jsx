import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, apiError } from '../lib/api.js';
import { useAuth } from '../store/auth.js';
import { imageUrl, timeAgo, AVATAR_FALLBACK } from '../lib/helpers.js';
import { toast } from '../lib/toast.js';
import Modal from '../components/Modal.jsx';

// For a 1-on-1 DM group, find the "other" member so the UI can show their
// name/avatar instead of the group's own (largely meaningless) name/icon.
function dmPartner(members, meId) {
  if (!members) return null;
  return members.find((m) => String(m._id) !== String(meId)) || null;
}

export default function Chat() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);

  const [groups, setGroups] = useState([]);
  const [messages, setMessages] = useState([]);
  const [detail, setDetail] = useState(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showManage, setShowManage] = useState(false);

  const threadRef = useRef(null);
  const lastAtRef = useRef(null);

  const loadGroups = () =>
    api.get('/chat/groups').then((r) => setGroups(r.data.groups)).catch(() => {});

  useEffect(() => {
    loadGroups();
  }, []);

  const scrollBottom = () => {
    setTimeout(() => {
      const el = threadRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }, 40);
  };

  // Load messages for the active group + poll for new ones.
  useEffect(() => {
    if (!groupId) {
      setMessages([]);
      setDetail(null);
      return undefined;
    }
    let active = true;
    lastAtRef.current = null;

    api
      .get(`/chat/groups/${groupId}/messages`)
      .then((r) => {
        if (!active) return;
        setMessages(r.data.messages);
        const last = r.data.messages[r.data.messages.length - 1];
        if (last) lastAtRef.current = last.createdAt;
        scrollBottom();
      })
      .catch(() => {
        toast('fa-solid fa-circle-xmark', 'You do not have access to this chat');
        navigate('/chat');
      });

    api.get(`/chat/groups/${groupId}`).then((r) => active && setDetail(r.data.group)).catch(() => {});

    const poll = () => {
      api
        .get(`/chat/groups/${groupId}/messages`, {
          params: lastAtRef.current ? { after: lastAtRef.current } : {},
        })
        .then((r) => {
          if (!active || !r.data.messages.length) return;
          setMessages((prev) => {
            const seen = new Set(prev.map((m) => m._id));
            const fresh = r.data.messages.filter((m) => !seen.has(m._id));
            return fresh.length ? [...prev, ...fresh] : prev;
          });
          lastAtRef.current = r.data.messages[r.data.messages.length - 1].createdAt;
          scrollBottom();
        })
        .catch(() => {});
    };
    const id = setInterval(poll, 3500);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [groupId, navigate]);

  const send = async (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setText('');
    setSending(true);
    try {
      const { data } = await api.post(`/chat/groups/${groupId}/messages`, { text: t });
      setMessages((prev) => [...prev, data.message]);
      lastAtRef.current = data.message.createdAt;
      scrollBottom();
      loadGroups();
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
      setText(t);
    } finally {
      setSending(false);
    }
  };

  const activeGroup = groups.find((g) => g._id === groupId);
  const listPartner = activeGroup?.type === 'dm' ? dmPartner(activeGroup.members, user?.id) : null;
  const detailPartner = detail?.type === 'dm' ? dmPartner(detail.members, user?.id) : null;
  const isDm = (detail?.type || activeGroup?.type) === 'dm';

  return (
    <section className="chat-page" style={{ paddingTop: 96 }}>
      <div className="container">
        <div className={`chat-wrap${groupId ? ' has-active' : ''}`}>
          {/* Sidebar */}
          <div className="chat-sidebar">
            <div className="chat-sidebar-head">
              <strong style={{ fontFamily: 'var(--font-display)' }}>Messages</strong>
              <button className="btn btn-sm btn-primary" onClick={() => setShowCreate(true)}>
                <i className="fa-solid fa-plus" /> New Group
              </button>
            </div>
            <div className="chat-groups">
              {groups.length === 0 ? (
                <div className="empty-state-sm"><i className="fa-solid fa-comment-dots" /><p>No chats yet. Join a trip or create a group.</p></div>
              ) : (
                groups.map((g) => {
                  const partner = g.type === 'dm' ? dmPartner(g.members, user?.id) : null;
                  return (
                    <button
                      key={g._id}
                      className={`chat-group-item${g._id === groupId ? ' active' : ''}`}
                      onClick={() => navigate(`/chat/${g._id}`)}
                    >
                      <div className="chat-group-ava">
                        {partner ? (
                          <img src={imageUrl(partner.avatarUrl, AVATAR_FALLBACK)} alt="" onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)} />
                        ) : g.photoUrl ? (
                          <img src={imageUrl(g.photoUrl)} alt="" />
                        ) : g.trip?.coverImageUrl ? (
                          <img src={imageUrl(g.trip.coverImageUrl)} alt="" />
                        ) : (
                          <i className={g.type === 'trip' ? 'fa-solid fa-route' : 'fa-solid fa-users'} />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                          <strong style={{ fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {partner?.fullName || g.name}
                          </strong>
                          {g.type === 'trip' && <span className="badge badge-fire" style={{ fontSize: '0.55rem' }}>TRIP</span>}
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.72rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {g.lastMessageText || (partner ? <><i className="fa-solid fa-hand" /> Say hello</> : `${g.memberCount} members`)}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Panel */}
          <div className="chat-panel">
            {!groupId ? (
              <div className="chat-empty">
                <i className="fa-solid fa-comments" style={{ fontSize: '2.4rem' }} />
                <p>Select a conversation to start chatting.</p>
              </div>
            ) : (
              <>
                <div className="chat-panel-head">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <button className="btn btn-sm btn-outline chat-back" onClick={() => navigate('/chat')}><i className="fa-solid fa-arrow-left" /></button>
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ fontFamily: 'var(--font-display)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {detailPartner?.fullName || listPartner?.fullName || detail?.name || activeGroup?.name || 'Chat'}
                      </strong>
                      <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                        {isDm ? (detailPartner?.city || listPartner?.city || '') : detail ? `${detail.members.length} members` : ''}
                        {detail?.trip ? ' · ' : ''}
                        {detail?.trip && <Link to={`/trips/${detail.trip._id}`} style={{ color: 'var(--fire-2)' }}>View trip</Link>}
                      </span>
                      {!isDm && detail?.description && (
                        <div className="text-muted" style={{ fontSize: '0.72rem', marginTop: 2 }}>{detail.description}</div>
                      )}
                    </div>
                  </div>
                  {!isDm && (
                    <button className="btn btn-sm btn-outline" onClick={() => setShowManage(true)}>
                      <i className="fa-solid fa-gear" /> Group Info
                    </button>
                  )}
                </div>

                <div className="chat-thread" ref={threadRef}>
                  {messages.length === 0 ? (
                    <div className="chat-empty"><p>No messages yet. Say hello <i className="fa-solid fa-hand" /></p></div>
                  ) : (
                    messages.map((m) => {
                      const mine = String(m.sender?._id || m.sender) === String(user?.id);
                      return (
                        <div key={m._id} className={`chat-row ${mine ? 'mine' : 'theirs'}`}>
                          {!mine && (
                            <img className="chat-msg-ava" src={imageUrl(m.sender?.avatarUrl, AVATAR_FALLBACK)} alt="" onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)} />
                          )}
                          <div>
                            {!isDm && <div className="chat-sender">{mine ? 'You' : (m.sender?.fullName || 'Member')}</div>}
                            <div className="chat-bubble">{m.text}</div>
                            <div className="chat-time">{timeAgo(m.createdAt)}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form className="chat-composer" onSubmit={send}>
                  <input
                    className="form-input"
                    placeholder="Type a message…"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    maxLength={2000}
                  />
                  <button className="btn btn-primary" disabled={sending || !text.trim()}>
                    <i className="fa-solid fa-paper-plane" />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>

      <CreateGroupModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={(id) => { setShowCreate(false); loadGroups(); navigate(`/chat/${id}`); }} />

      <GroupSettingsModal
        open={showManage}
        onClose={() => setShowManage(false)}
        group={detail}
        currentUserId={user?.id}
        onChanged={() => { api.get(`/chat/groups/${groupId}`).then((r) => setDetail(r.data.group)).catch(() => {}); loadGroups(); }}
      />
    </section>
  );
}

function CreateGroupModal({ open, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [ids, setIds] = useState('');
  const [busy, setBusy] = useState(false);

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const memberIds = ids.split(/[\s,]+/).filter(Boolean);
      const { data } = await api.post('/chat/groups', { name, memberIds });
      toast('fa-solid fa-comment-dots', 'Group created!');
      setName('');
      setIds('');
      onCreated(data.groupId);
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create a group">
      <form onSubmit={create}>
        <div className="form-group">
          <label>Group name *</label>
          <input className="form-input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Spiti Riders" />
        </div>
        <div className="form-group">
          <label>Add members by User ID</label>
          <textarea className="form-input" value={ids} onChange={(e) => setIds(e.target.value)} placeholder="Paste user IDs, separated by space or comma" />
          <p className="text-muted" style={{ fontSize: '0.72rem', marginTop: 6 }}>
            Tip: a user's ID is on their profile page and in their Dashboard. You can also add members later.
          </p>
        </div>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
          {busy ? <span className="spinner" /> : <i className="fa-solid fa-users" />} Create Group
        </button>
      </form>
    </Modal>
  );
}

function GroupSettingsModal({ open, onClose, group, currentUserId, onChanged }) {
  const photoRef = useRef(null);
  const [input, setInput] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [addBusy, setAddBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);

  useEffect(() => {
    if (group) {
      setName(group.name || '');
      setDescription(group.description || '');
      setPhoto(null);
    }
  }, [group?._id, group?.name, group?.description]);

  if (!group) return null;

  const isOwner = group.isOwner;
  const isTrip = group.type === 'trip';

  const add = async (e) => {
    e.preventDefault();
    const v = input.trim();
    if (!v) return;
    setAddBusy(true);
    try {
      await api.post(`/chat/groups/${group._id}/members`, { identifier: v });
      toast('fa-solid fa-circle-check', 'Member added');
      setInput('');
      onChanged();
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setAddBusy(false);
    }
  };

  const remove = async (uid) => {
    try {
      await api.delete(`/chat/groups/${group._id}/members/${uid}`);
      toast('fa-solid fa-hand', 'Member removed');
      onChanged();
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    }
  };

  const saveDetails = async (e) => {
    e.preventDefault();
    setSaveBusy(true);
    try {
      const fd = new FormData();
      fd.append('name', name.trim());
      fd.append('description', description);
      if (photo) fd.append('photo', photo);
      await api.patch(`/chat/groups/${group._id}`, fd);
      toast('fa-solid fa-circle-check', 'Group updated');
      setPhoto(null);
      onChanged();
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setSaveBusy(false);
    }
  };

  const removePhoto = async () => {
    try {
      await api.patch(`/chat/groups/${group._id}`, { removePhoto: true });
      toast('fa-solid fa-circle-check', 'Group photo removed');
      onChanged();
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Group Info · ${group.name}`}>
      {isOwner && (
        <form onSubmit={saveDetails} className="mb-3">
          <div className="upload-box mb-3" onClick={() => photoRef.current?.click()}>
            <img
              className="avatar-preview"
              src={photo ? URL.createObjectURL(photo) : imageUrl(group.photoUrl, AVATAR_FALLBACK)}
              alt=""
            />
            <div className="upload-label">{photo ? photo.name : group.photoUrl ? 'Change group photo' : 'Add group photo'}</div>
            <input ref={photoRef} type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
          </div>
          {group.photoUrl && !photo && (
            <button type="button" className="btn btn-sm btn-outline mb-3" onClick={removePhoto}>
              <i className="fa-solid fa-trash" /> Remove photo
            </button>
          )}
          <div className="form-group">
            <label>Group name{isTrip ? ' (overrides the route name)' : ''}</label>
            <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="form-input" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} placeholder="What's this group for?" />
          </div>
          <button className="btn btn-sm btn-primary mb-3" disabled={saveBusy}>
            {saveBusy ? <span className="spinner" /> : <i className="fa-solid fa-floppy-disk" />} Save Group Info
          </button>
        </form>
      )}
      {!isOwner && group.description && (
        <p className="text-muted mb-3" style={{ fontSize: '0.8rem' }}>{group.description}</p>
      )}
      {isOwner && (
        <form onSubmit={add} className="search-bar mb-3">
          <i className="fa-solid fa-user-plus" style={{ color: 'var(--text-3)' }} />
          <input placeholder="Add by User ID, username, mobile, or email" value={input} onChange={(e) => setInput(e.target.value)} />
          <button className="btn btn-sm btn-primary" disabled={addBusy}>{addBusy ? <span className="spinner" /> : 'Add'}</button>
        </form>
      )}
      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        {group.members.map((m) => (
          <div key={m._id} className="notif-item" style={{ alignItems: 'center', marginBottom: 8 }}>
            <img src={imageUrl(m.avatarUrl, AVATAR_FALLBACK)} alt="" style={{ width: 36, height: 36, borderRadius: '50%' }} onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong style={{ fontSize: '0.85rem' }}>{m.fullName}{String(m._id) === String(group.owner?._id || group.owner) ? <i className="fa-solid fa-crown" style={{ color: 'var(--gold)', marginLeft: 4 }} /> : ''}</strong>
              <div className="text-muted" style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}>{m._id}</div>
            </div>
            {isOwner && String(m._id) !== String(group.owner?._id || group.owner) && (
              <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }} onClick={() => remove(m._id)}><i className="fa-solid fa-xmark" /></button>
            )}
            {String(m._id) === String(currentUserId) && !isOwner && (
              <button className="btn btn-sm btn-outline" onClick={() => { remove(m._id); onClose(); }}>Leave</button>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
}
