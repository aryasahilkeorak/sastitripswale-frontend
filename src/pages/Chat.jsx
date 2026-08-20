import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, apiError } from '../lib/api.js';
import { useAuth } from '../store/auth.js';
import { imageUrl, timeAgo, AVATAR_FALLBACK, COVER_ASPECT_RATIO } from '../lib/helpers.js';
import { toast } from '../lib/toast.js';
import Modal from '../components/Modal.jsx';
import MemberSearchInput from '../components/MemberSearchInput.jsx';
import ImageCropModal from '../components/ImageCropModal.jsx';
import PhotoActionMenu from '../components/PhotoActionMenu.jsx';

// For a 1-on-1 DM group, find the "other" member so the UI can show their
// name/avatar instead of the group's own (largely meaningless) name/icon.
function dmPartner(members, meId) {
  if (!members) return null;
  return members.find((m) => String(m._id) !== String(meId)) || null;
}

// Regular admins chat as official support, not as themselves - a member
// talking to "support" shouldn't see an individual admin's name or personal
// photo. The founder (superadmin) is exempt - they DM as themselves, same
// as any other member, since they're a public figure on the platform.
const SUPPORT_NAME = 'SastiTripsWale Support';
const isSupportAccount = (m) => Boolean(m) && m.role === 'admin';
const displayName = (m) => (isSupportAccount(m) ? SUPPORT_NAME : m?.fullName);

// The one designated support/help chat account (see backend `isServiceAccount`)
// - distinct from isSupportAccount() above, which only anonymizes plain staff
// 'admin' senders. This flag is what turns on the AI auto-reply on the
// backend, so it's also what shows the quick-question chips here.
const isHelpBot = (m) => Boolean(m?.isServiceAccount);

// Broad coverage of common questions - each one is just sent as a normal
// message, so the same AI auto-reply (or admin, if a human takes over)
// answers it exactly like anything the member typed themselves.
const QUICK_QUESTIONS = [
  { icon: 'fa-solid fa-ticket', text: 'How do I join for free?' },
  { icon: 'fa-solid fa-shield-halved', text: 'Is my ID/data safe here?' },
  { icon: 'fa-solid fa-wallet', text: 'How are trip costs split?' },
  { icon: 'fa-solid fa-route', text: 'How do I host/plan a trip?' },
  { icon: 'fa-solid fa-magnifying-glass', text: 'How do I join a trip someone else is hosting?' },
  { icon: 'fa-solid fa-circle-check', text: 'How do I get the Verified badge?' },
  { icon: 'fa-solid fa-car', text: 'What is a Verified Vehicle Owner?' },
  { icon: 'fa-solid fa-gift', text: 'How do referrals work?' },
  { icon: 'fa-solid fa-money-bill-transfer', text: 'How do I withdraw my wallet balance?' },
  { icon: 'fa-solid fa-star', text: 'How do I become an influencer/promoter?' },
  { icon: 'fa-solid fa-people-group', text: 'What are Clubs?' },
  { icon: 'fa-solid fa-flag', text: 'How do I report or block a member?' },
  { icon: 'fa-solid fa-venus-mars', text: 'Can I travel in women-only or safety-focused groups?' },
  { icon: 'fa-solid fa-user-slash', text: 'How do I delete my account?' },
];

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
  const [showNewChat, setShowNewChat] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [requestsBusy, setRequestsBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [rowMenuFor, setRowMenuFor] = useState(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [showAllQuestions, setShowAllQuestions] = useState(false);

  const threadRef = useRef(null);
  const lastAtRef = useRef(null);
  const menuRef = useRef(null);
  const rowMenuRef = useRef(null);
  const createMenuRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [botTyping, setBotTyping] = useState(false);

  const clearPendingTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    setBotTyping(false);
  };

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (rowMenuRef.current && !rowMenuRef.current.contains(e.target)) setRowMenuFor(null);
      if (createMenuRef.current && !createMenuRef.current.contains(e.target)) setCreateMenuOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

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
    clearPendingTyping();
    setShowAllQuestions(false);
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

  const sendText = async (t) => {
    setSending(true);
    const sentToGroupId = groupId;
    try {
      const { data } = await api.post(`/chat/groups/${sentToGroupId}/messages`, { text: t });
      setMessages((prev) => [...prev, data.message]);
      scrollBottom();
      loadGroups();

      if (data.autoReply) {
        // Set this now (not after the delay) so the regular poll below never
        // fetches the auto-reply early - the delayed reveal is the only path
        // that adds it to `messages`.
        lastAtRef.current = data.autoReply.createdAt;
        setBotTyping(true);
        const delay = 2000 + Math.random() * 3000; // 2-5s, feels less instant/robotic
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          typingTimeoutRef.current = null;
          setBotTyping(false);
          setMessages((prev) => [...prev, data.autoReply]);
          scrollBottom();
          loadGroups();
        }, delay);
      } else {
        lastAtRef.current = data.message.createdAt;
      }
      return true;
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
      return false;
    } finally {
      setSending(false);
    }
  };

  const send = async (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setText('');
    const ok = await sendText(t);
    if (!ok) setText(t);
  };

  // Instagram-style message requests: a pending DM where I'm the recipient
  // (not the one who sent it) is a "request" needing my Accept/Decline,
  // shown separately from the normal chat list. My own pending-sent DMs
  // stay in the normal list (I can keep messaging while they wait).
  const isIncomingRequest = (g) => g.type === 'dm' && g.dmStatus === 'pending' && String(g.requestedBy) !== String(user?.id);
  const isCompletedTripChat = (g) => g.type === 'trip' && g.trip?.status === 'completed';
  const pendingRequests = groups.filter(isIncomingRequest);
  const visibleGroups = groups.filter((g) => !isIncomingRequest(g) && !isCompletedTripChat(g));

  const acceptRequest = async (id) => {
    setRequestsBusy(true);
    try {
      await api.patch(`/chat/dm/${id}/accept`);
      await loadGroups();
      navigate(`/chat/${id}`);
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setRequestsBusy(false);
    }
  };

  const declineRequest = async (id) => {
    setRequestsBusy(true);
    try {
      await api.delete(`/chat/dm/${id}`);
      if (id === groupId) navigate('/chat');
      await loadGroups();
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setRequestsBusy(false);
    }
  };

  // Shared row-level + open-conversation-header actions (WhatsApp-style).

  const toggleUnread = async (id, currentlyUnread) => {
    setRowMenuFor(null);
    try {
      const { data } = await api.patch(`/chat/groups/${id}/unread`, { unread: !currentlyUnread });
      setGroups((gs) => gs.map((x) => (x._id === id ? { ...x, isUnread: data.isUnread } : x)));
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    }
  };

  const clearChatById = async (id) => {
    setRowMenuFor(null);
    if (!window.confirm('Clear all messages in this chat? This cannot be undone.')) return;
    try {
      await api.delete(`/chat/groups/${id}/messages`);
      toast('fa-solid fa-broom', 'Chat cleared');
      setGroups((gs) => gs.map((x) => (x._id === id ? { ...x, lastMessageText: '' } : x)));
      if (id === groupId) setMessages([]);
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    }
  };

  const blockMember = async (partner) => {
    setRowMenuFor(null);
    if (!partner) return;
    if (!window.confirm(`Block ${partner.fullName}? They won't be able to connect or message you.`)) return;
    try {
      await api.post(`/members/${partner._id}/block`);
      toast('fa-solid fa-ban', 'Member blocked');
      loadGroups();
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    }
  };

  // For a DM this deletes the whole conversation (both sides); for any other
  // group type there's no per-user soft-delete in the backend, so it leaves
  // the group instead - same as the existing "Leave" action.
  const deleteOrLeave = async (g) => {
    setMenuOpen(false);
    setRowMenuFor(null);
    if (g.type === 'dm') {
      if (!window.confirm('Delete this chat? This removes it for both of you and cannot be undone.')) return;
      await declineRequest(g._id);
    } else {
      const label = g.type === 'club' ? 'club' : g.type === 'trip' ? 'trip group' : 'group';
      if (!window.confirm(`Leave this ${label}?`)) return;
      try {
        await api.delete(`/chat/groups/${g._id}/members/${user.id}`);
        toast('fa-solid fa-hand', `Left the ${label}`);
        if (g._id === groupId) navigate('/chat');
        loadGroups();
      } catch (err) {
        toast('fa-solid fa-circle-xmark', apiError(err));
      }
    }
  };

  const toggleSelectMode = () => {
    setSelectMode((v) => !v);
    setSelectedIds(new Set());
  };

  const toggleSelected = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const bulkDelete = async () => {
    if (!selectedIds.size) return;
    if (!window.confirm(`Delete ${selectedIds.size} chat${selectedIds.size > 1 ? 's' : ''}? This cannot be undone.`)) return;
    setBulkBusy(true);
    try {
      const targets = groups.filter((g) => selectedIds.has(g._id));
      await Promise.all(
        targets.map((g) =>
          (g.type === 'dm' ? api.delete(`/chat/dm/${g._id}`) : api.delete(`/chat/groups/${g._id}/members/${user.id}`)).catch(() => {})
        )
      );
      if (selectedIds.has(groupId)) navigate('/chat');
      toast('fa-solid fa-trash', 'Chats removed');
      setSelectMode(false);
      setSelectedIds(new Set());
      loadGroups();
    } finally {
      setBulkBusy(false);
    }
  };

  const activeGroup = groups.find((g) => g._id === groupId);
  const listPartner = activeGroup?.type === 'dm' ? dmPartner(activeGroup.members, user?.id) : null;
  const detailPartner = detail?.type === 'dm' ? dmPartner(detail.members, user?.id) : null;
  const isDm = (detail?.type || activeGroup?.type) === 'dm';
  const viewingIncomingRequest = Boolean(activeGroup && isIncomingRequest(activeGroup));
  const isSupportChat = isHelpBot(detailPartner) || isHelpBot(listPartner);

  return (
    <section className={`chat-page${groupId ? ' has-active' : ''}`} style={{ paddingTop: 88, paddingBottom: 0 }}>
      <div className="container">
        <div className={`chat-wrap${groupId ? ' has-active' : ''}`}>
          {/* Sidebar */}
          <div className="chat-sidebar">
            <div className="chat-sidebar-head">
              {selectMode ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button type="button" className="ig-id-btn" onClick={toggleSelectMode} aria-label="Cancel selection">
                      <i className="fa-solid fa-xmark" />
                    </button>
                    <strong style={{ fontFamily: 'var(--font-display)' }}>{selectedIds.size} selected</strong>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}
                    disabled={!selectedIds.size || bulkBusy}
                    onClick={bulkDelete}
                  >
                    {bulkBusy ? <span className="spinner" /> : <i className="fa-solid fa-trash" />} Delete
                  </button>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button type="button" className="ig-id-btn" onClick={() => navigate('/contact')} aria-label="Back to Contact">
                      <i className="fa-solid fa-arrow-left" />
                    </button>
                    <strong style={{ fontFamily: 'var(--font-display)' }}>Messages</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    {visibleGroups.length > 0 && (
                      <button
                        type="button"
                        className="chat-row-menu-btn"
                        style={{ width: 36, height: 36, fontSize: '1rem' }}
                        onClick={toggleSelectMode}
                        aria-label="Select chats"
                        title="Select chats"
                      >
                        <i className="fa-solid fa-list-check" />
                      </button>
                    )}
                    <div style={{ position: 'relative' }} ref={createMenuRef}>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        style={{ width: 36, height: 36, padding: 0, justifyContent: 'center', borderRadius: '50%' }}
                        onClick={() => setCreateMenuOpen((v) => !v)}
                        aria-label="New chat or group"
                        title="New"
                      >
                        <i className="fa-solid fa-plus" />
                      </button>
                      {createMenuOpen && (
                        <div className="ig-menu-dropdown">
                          <button onClick={() => { setCreateMenuOpen(false); setShowNewChat(true); }}>
                            <i className="fa-solid fa-comment-dots" /> New chat
                          </button>
                          <button onClick={() => { setCreateMenuOpen(false); navigate('/members'); }}>
                            <i className="fa-solid fa-user-plus" /> New contact
                          </button>
                          <button onClick={() => { setCreateMenuOpen(false); setShowCreate(true); }}>
                            <i className="fa-solid fa-users" /> Create a group
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            {pendingRequests.length > 0 && (
              <div className="chat-requests">
                <div className="text-muted" style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '10px 14px 4px' }}>
                  <i className="fa-solid fa-inbox" /> Message Requests ({pendingRequests.length})
                </div>
                {pendingRequests.map((g) => {
                  const partner = dmPartner(g.members, user?.id);
                  return (
                    <div key={g._id} className="chat-group-item" style={{ cursor: 'default' }}>
                      <div className="chat-group-ava">
                        <img src={imageUrl(partner?.avatarUrl, AVATAR_FALLBACK)} alt="" onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ fontSize: '0.88rem', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {partner?.fullName || g.name}
                        </strong>
                        <div className="text-muted" style={{ fontSize: '0.72rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {g.lastMessageText || 'Wants to message you'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm btn-primary" disabled={requestsBusy} onClick={() => acceptRequest(g._id)} title="Accept">
                          <i className="fa-solid fa-check" />
                        </button>
                        <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }} disabled={requestsBusy} onClick={() => declineRequest(g._id)} title="Decline">
                          <i className="fa-solid fa-xmark" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="chat-groups">
              {visibleGroups.length === 0 ? (
                <div className="empty-state-sm"><i className="fa-solid fa-comment-dots" /><p>No chats yet. Join a trip or create a group.</p></div>
              ) : (
                visibleGroups.map((g) => {
                  const partner = g.type === 'dm' ? dmPartner(g.members, user?.id) : null;
                  const isPendingSentByMe = g.type === 'dm' && g.dmStatus === 'pending';
                  const selected = selectedIds.has(g._id);
                  const rowLabel = g.type === 'dm' ? 'Delete chat' : g.type === 'club' ? 'Leave club' : g.type === 'trip' ? 'Leave trip group' : 'Leave group';
                  return (
                    <div
                      key={g._id}
                      role="button"
                      tabIndex={0}
                      className={`chat-group-item${g._id === groupId ? ' active' : ''}`}
                      onClick={() => (selectMode ? toggleSelected(g._id) : navigate(`/chat/${g._id}`))}
                      onKeyDown={(e) => {
                        if (e.key !== 'Enter' && e.key !== ' ') return;
                        e.preventDefault();
                        if (selectMode) toggleSelected(g._id);
                        else navigate(`/chat/${g._id}`);
                      }}
                    >
                      {selectMode && (
                        <span className={`chat-select-check${selected ? ' checked' : ''}`}>
                          {selected && <i className="fa-solid fa-check" />}
                        </span>
                      )}
                      <div className="chat-group-ava">
                        {isSupportAccount(partner) || isHelpBot(partner) ? (
                          <div className="chat-support-ava"><i className="fa-solid fa-headset" /></div>
                        ) : partner ? (
                          <img src={imageUrl(partner.avatarUrl, AVATAR_FALLBACK)} alt="" onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)} />
                        ) : g.photoUrl ? (
                          <img src={imageUrl(g.photoUrl)} alt="" />
                        ) : g.trip?.coverImageUrl ? (
                          <img src={imageUrl(g.trip.coverImageUrl)} alt="" />
                        ) : (
                          <i className={g.type === 'trip' ? 'fa-solid fa-route' : g.type === 'club' ? 'fa-solid fa-people-group' : 'fa-solid fa-users'} />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <strong style={{ flex: 1, minWidth: 0, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: g.isUnread ? 800 : 600 }}>
                            {displayName(partner) || g.name}
                          </strong>
                          {g.isUnread && <span className="chat-unread-dot" style={{ flexShrink: 0 }} />}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div
                            className="text-muted"
                            style={{ flex: 1, minWidth: 0, fontSize: '0.72rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: g.isUnread ? 700 : 400, color: g.isUnread ? 'var(--text)' : undefined }}
                          >
                            {g.lastMessageText || (partner ? <><i className="fa-solid fa-hand" /> Say hello</> : `${g.memberCount} members`)}
                          </div>
                          {g.type === 'trip' && <span className="badge badge-fire" style={{ fontSize: '0.55rem', flexShrink: 0 }}>TRIP</span>}
                          {g.type === 'club' && <span className="badge badge-cyan" style={{ fontSize: '0.55rem', flexShrink: 0 }}>CLUB</span>}
                          {isPendingSentByMe && <span className="badge badge-gold" style={{ fontSize: '0.55rem', flexShrink: 0 }}>REQUESTED</span>}
                        </div>
                      </div>
                      {!selectMode && (
                        <div style={{ position: 'relative', flexShrink: 0, marginLeft: 4 }} ref={rowMenuFor === g._id ? rowMenuRef : null}>
                          <button
                            type="button"
                            className="chat-row-menu-btn"
                            onClick={(e) => { e.stopPropagation(); setRowMenuFor((id) => (id === g._id ? null : g._id)); }}
                            aria-label="Chat options"
                          >
                            <i className="fa-solid fa-ellipsis-vertical" />
                          </button>
                          {rowMenuFor === g._id && (
                            <div className="ig-menu-dropdown" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => toggleUnread(g._id, g.isUnread)}>
                                <i className="fa-solid fa-envelope" /> {g.isUnread ? 'Mark as read' : 'Mark as unread'}
                              </button>
                              <button onClick={() => clearChatById(g._id)}>
                                <i className="fa-solid fa-broom" /> Clear chat
                              </button>
                              {g.type === 'dm' && partner && (
                                <button className="danger" onClick={() => blockMember(partner)}>
                                  <i className="fa-solid fa-ban" /> Block user
                                </button>
                              )}
                              <button className="danger" onClick={() => deleteOrLeave(g)}>
                                <i className="fa-solid fa-trash" /> {rowLabel}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
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
                    <button className="ig-id-btn chat-back" onClick={() => navigate('/chat')} aria-label="Back"><i className="fa-solid fa-arrow-left" /></button>
                    {detail?.type === 'club' ? (
                      <img
                        src={imageUrl(detail.photoUrl, AVATAR_FALLBACK)}
                        alt=""
                        onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)}
                        style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                      />
                    ) : isDm && (isSupportAccount(detailPartner) || isHelpBot(detailPartner) || isSupportAccount(listPartner) || isHelpBot(listPartner)) ? (
                      <div className="chat-support-ava" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }}>
                        <i className="fa-solid fa-headset" />
                      </div>
                    ) : isDm && (detailPartner || listPartner) ? (
                      <img
                        src={imageUrl((detailPartner || listPartner).avatarUrl, AVATAR_FALLBACK)}
                        alt=""
                        onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)}
                        style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                      />
                    ) : null}
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ fontFamily: 'var(--font-display)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {displayName(detailPartner) || displayName(listPartner) || detail?.name || activeGroup?.name || 'Chat'}
                      </strong>
                      {detail?.type === 'club' ? (
                        <span className="text-muted" style={{ fontSize: '0.72rem' }}>{detail.members.length} members</span>
                      ) : (
                        <>
                          <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                            {isDm
                              ? isSupportAccount(detailPartner) || isHelpBot(detailPartner) || isSupportAccount(listPartner) || isHelpBot(listPartner)
                                ? "We're here to help"
                                : detailPartner?.city || listPartner?.city || ''
                              : detail
                              ? `${detail.members.length} members`
                              : ''}
                            {detail?.trip ? ' · ' : ''}
                            {detail?.trip && <Link to={`/trips/${detail.trip._id}`} style={{ color: 'var(--fire-2)' }}>View trip</Link>}
                          </span>
                          {!isDm && detail?.description && (
                            <div className="text-muted" style={{ fontSize: '0.72rem', marginTop: 2 }}>{detail.description}</div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="ig-menu" ref={menuRef} style={{ position: 'relative' }}>
                    <button type="button" className="ig-id-btn" onClick={() => setMenuOpen((v) => !v)} aria-label="More options" title="More options">
                      <i className="fa-solid fa-ellipsis-vertical" />
                    </button>
                    {menuOpen && (
                      <div className="ig-menu-dropdown">
                        <button onClick={() => { setMenuOpen(false); toggleUnread(groupId, activeGroup?.isUnread); }}>
                          <i className="fa-solid fa-envelope" /> {activeGroup?.isUnread ? 'Mark as read' : 'Mark as unread'}
                        </button>
                        <button onClick={() => { setMenuOpen(false); clearChatById(groupId); }}>
                          <i className="fa-solid fa-broom" /> Clear chat
                        </button>
                        {isDm ? (
                          <>
                            {(detailPartner || listPartner) && (
                              <button className="danger" onClick={() => { setMenuOpen(false); blockMember(detailPartner || listPartner); }}>
                                <i className="fa-solid fa-ban" /> Block user
                              </button>
                            )}
                            <button className="danger" onClick={() => deleteOrLeave({ _id: groupId, type: 'dm' })}>
                              <i className="fa-solid fa-trash" /> Delete chat
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => { setMenuOpen(false); setShowManage(true); }}>
                              <i className="fa-solid fa-circle-info" /> {detail?.type === 'club' ? 'Club info' : detail?.type === 'trip' ? 'Trip info' : 'Group info'}
                            </button>
                            {!detail?.isOwner && (
                              <button className="danger" onClick={() => deleteOrLeave({ _id: groupId, type: detail?.type || activeGroup?.type })}>
                                <i className="fa-solid fa-right-from-bracket" /> {detail?.type === 'club' ? 'Leave club' : detail?.type === 'trip' ? 'Leave trip group' : 'Leave group'}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {viewingIncomingRequest && (
                  <div className="club-locked-note" style={{ margin: '0 16px 10px' }}>
                    <i className="fa-solid fa-inbox" />
                    <span>
                      This is a message request from {displayName(detailPartner) || displayName(listPartner) || 'this member'}. Reply to accept, or:{' '}
                      <button type="button" className="btn btn-sm btn-primary" style={{ marginLeft: 8 }} disabled={requestsBusy} onClick={() => acceptRequest(groupId)}>Accept</button>{' '}
                      <button type="button" className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }} disabled={requestsBusy} onClick={() => declineRequest(groupId)}>Decline</button>
                    </span>
                  </div>
                )}

                <div className="chat-thread" ref={threadRef}>
                  {messages.length === 0 && !botTyping ? (
                    <div className="chat-empty"><p>No messages yet. Say hello <i className="fa-solid fa-hand" /></p></div>
                  ) : (
                    <>
                      {messages.map((m) => {
                        const mine = String(m.sender?._id || m.sender) === String(user?.id);
                        return (
                          <div key={m._id} className={`chat-row ${mine ? 'mine' : 'theirs'}`}>
                            {!mine && (
                              isSupportAccount(m.sender) || isHelpBot(m.sender) ? (
                                <div className="chat-msg-ava chat-support-ava"><i className="fa-solid fa-headset" /></div>
                              ) : (
                                <img className="chat-msg-ava" src={imageUrl(m.sender?.avatarUrl, AVATAR_FALLBACK)} alt="" onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)} />
                              )
                            )}
                            <div>
                              {!isDm && <div className="chat-sender">{mine ? 'You' : (displayName(m.sender) || 'Member')}</div>}
                              <div className="chat-bubble">{m.text}</div>
                              <div className="chat-time">
                                {timeAgo(m.createdAt)}
                                {m.isAuto && <span className="text-muted" style={{ marginLeft: 6 }}><i className="fa-solid fa-robot" /> Automated reply</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {botTyping && (
                        <div className="chat-row theirs">
                          <div className="chat-msg-ava chat-support-ava"><i className="fa-solid fa-headset" /></div>
                          <div>
                            <div className="chat-bubble chat-typing-bubble">
                              <span className="chat-typing-dot" />
                              <span className="chat-typing-dot" />
                              <span className="chat-typing-dot" />
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {isSupportChat && (
                  <div className="chat-quick-questions" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '10px 14px', maxHeight: 220, overflowY: 'auto', flexShrink: 0 }}>
                    {(showAllQuestions ? QUICK_QUESTIONS : QUICK_QUESTIONS.slice(0, 3)).map((q) => (
                      <button
                        key={q.text}
                        type="button"
                        className="chip"
                        style={{ flex: '0 0 auto' }}
                        disabled={sending}
                        onClick={() => sendText(q.text)}
                      >
                        <i className={q.icon} /> {q.text}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="chip"
                      style={{ flex: '0 0 auto' }}
                      onClick={() => setShowAllQuestions((v) => !v)}
                    >
                      <i className={`fa-solid fa-chevron-${showAllQuestions ? 'up' : 'down'}`} /> {showAllQuestions ? 'Less' : 'More'}
                    </button>
                  </div>
                )}

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

      <NewChatModal
        open={showNewChat}
        onClose={() => setShowNewChat(false)}
        onStarted={(id) => { setShowNewChat(false); loadGroups(); navigate(`/chat/${id}`); }}
      />

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

function NewChatModal({ open, onClose, onStarted }) {
  const [busy, setBusy] = useState(false);

  const start = async (identifier) => {
    setBusy(true);
    try {
      const { data } = await api.get(`/chat/dm/${identifier}`);
      onStarted(data.groupId);
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New chat">
      <MemberSearchInput onAdd={start} busy={busy} submitLabel="Chat" />
      <p className="text-muted" style={{ fontSize: '0.72rem' }}>
        Pick a member from the results, or use the button to start a chat by their exact ID, mobile, or email.
      </p>
    </Modal>
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
  const coverRef = useRef(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [cover, setCover] = useState(null);
  const [pendingPhoto, setPendingPhoto] = useState(null);
  const [pendingCover, setPendingCover] = useState(null);
  const [addBusy, setAddBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);

  useEffect(() => {
    if (group) {
      setName(group.name || '');
      setDescription(group.description || '');
      setPhoto(null);
      setCover(null);
    }
  }, [group?._id, group?.name, group?.description]);

  if (!group) return null;

  const isOwner = group.isOwner;
  // Club chats can be managed by any club admin, not just the owner - plain
  // custom/trip groups have no other admins, so this stays owner-only there.
  const canManage = group.isOwner || group.isAdmin;
  const isTrip = group.type === 'trip';

  const add = async (identifier) => {
    setAddBusy(true);
    try {
      await api.post(`/chat/groups/${group._id}/members`, { identifier });
      toast('fa-solid fa-circle-check', 'Member added');
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
      if (cover) fd.append('cover', cover);
      await api.patch(`/chat/groups/${group._id}`, fd);
      toast('fa-solid fa-circle-check', 'Group updated');
      setPhoto(null);
      setCover(null);
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
      onChanged();
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    }
  };

  const removeCoverPhoto = async () => {
    try {
      await api.patch(`/chat/groups/${group._id}`, { removeCoverPhoto: true });
      onChanged();
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Group Info · ${group.name}`}>
      {/* Instagram-style header: cover banner + overlapping profile photo,
          each with its own small camera (change) / trash (remove) badge
          instead of a separate upload box + "Remove photo" button. */}
      <div className="mb-3" style={{ margin: '-12px -4px 16px', position: 'relative' }}>
        <div style={{ position: 'relative', width: '100%', aspectRatio: COVER_ASPECT_RATIO, background: 'var(--grad-fire)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
          {(cover || group.coverPhotoUrl) && (
            <img
              src={cover ? URL.createObjectURL(cover) : imageUrl(group.coverPhotoUrl)}
              alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
          {canManage && (
            <div style={{ position: 'absolute', right: 8, bottom: 8, display: 'flex', gap: 6 }}>
              {group.coverPhotoUrl && !cover && (
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ borderRadius: '50%', width: 28, height: 28, padding: 0, justifyContent: 'center', background: 'rgba(0,0,0,0.55)', color: '#fff' }}
                  onClick={removeCoverPhoto}
                  title="Remove cover photo"
                >
                  <i className="fa-solid fa-trash" style={{ fontSize: '0.7rem' }} />
                </button>
              )}
              <button
                type="button"
                className="btn btn-sm"
                style={{ borderRadius: '50%', width: 28, height: 28, padding: 0, justifyContent: 'center', background: 'rgba(0,0,0,0.55)', color: '#fff' }}
                onClick={() => coverRef.current?.click()}
                title="Change cover photo"
              >
                <i className="fa-solid fa-camera" style={{ fontSize: '0.7rem' }} />
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

        <div style={{ position: 'relative', width: 84, margin: '-42px auto 0' }}>
          <img
            src={photo ? URL.createObjectURL(photo) : imageUrl(group.photoUrl, AVATAR_FALLBACK)}
            alt=""
            style={{ width: 84, height: 84, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--surface)', display: 'block', margin: '0 auto' }}
          />
          {canManage && (
            <>
              <PhotoActionMenu
                hasPhoto={Boolean(group.photoUrl && !photo)}
                onChange={() => photoRef.current?.click()}
                onRemove={removePhoto}
                size={28}
                style={{ right: 0, bottom: 0 }}
              />
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
            </>
          )}
        </div>
      </div>

      {canManage ? (
        <form onSubmit={saveDetails} className="mb-3">
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
      ) : (
        group.description && <p className="text-muted mb-3" style={{ fontSize: '0.8rem' }}>{group.description}</p>
      )}
      {canManage && <MemberSearchInput onAdd={add} busy={addBusy} />}
      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        {group.members.map((m) => (
          <div key={m._id} className="notif-item" style={{ alignItems: 'center', marginBottom: 8 }}>
            <img src={imageUrl(m.avatarUrl, AVATAR_FALLBACK)} alt="" style={{ width: 36, height: 36, borderRadius: '50%' }} onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong style={{ fontSize: '0.85rem' }}>{m.fullName}{String(m._id) === String(group.owner?._id || group.owner) ? <i className="fa-solid fa-crown" style={{ color: 'var(--gold)', marginLeft: 4 }} /> : ''}</strong>
              <div className="text-muted" style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}>{m._id}</div>
            </div>
            {canManage && String(m._id) !== String(group.owner?._id || group.owner) && (
              <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }} onClick={() => remove(m._id)}><i className="fa-solid fa-xmark" /></button>
            )}
            {String(m._id) === String(currentUserId) && !isOwner && (
              <button className="btn btn-sm btn-outline" onClick={() => { remove(m._id); onClose(); }}>Leave</button>
            )}
          </div>
        ))}
      </div>

      <ImageCropModal
        file={pendingPhoto}
        title="Crop group photo"
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
    </Modal>
  );
}
