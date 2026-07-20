import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiError } from '../../lib/api.js';
import { timeAgo } from '../../lib/helpers.js';
import { toast } from '../../lib/toast.js';

export default function AdminMessages() {
  const [section, setSection] = useState('queries'); // queries | reports

  return (
    <>
      <div className="filter-chips mb-3">
        <button className={`chip${section === 'queries' ? ' active' : ''}`} onClick={() => setSection('queries')}>
          <i className="fa-solid fa-headset" /> Queries
        </button>
        <button className={`chip${section === 'reports' ? ' active' : ''}`} onClick={() => setSection('reports')}>
          <i className="fa-solid fa-flag" /> User Reports
        </button>
      </div>

      {section === 'queries' ? <ContactQueries /> : <UserReports />}
    </>
  );
}

function ContactQueries() {
  const [messages, setMessages] = useState([]);
  const [filter, setFilter] = useState('all'); // all | open | handled
  const load = () => api.get('/admin/contact-messages').then((r) => setMessages(r.data.messages)).catch(() => {});
  useEffect(() => { load(); }, []);

  const markHandled = async (id, handled) => {
    try {
      await api.patch(`/admin/contact-messages/${id}`, { handled });
      setMessages((ms) => ms.map((m) => (m._id === id ? { ...m, handled } : m)));
      toast('fa-solid fa-circle-check', handled ? 'Marked handled' : 'Marked open');
    } catch (e) { toast('fa-solid fa-circle-xmark', apiError(e)); }
  };
  const remove = async (id) => {
    if (!window.confirm('Delete this message?')) return;
    try { await api.delete(`/admin/contact-messages/${id}`); setMessages((ms) => ms.filter((m) => m._id !== id)); toast('fa-solid fa-trash', 'Deleted'); }
    catch (e) { toast('fa-solid fa-circle-xmark', apiError(e)); }
  };

  const shown = messages.filter((m) => filter === 'all' || (filter === 'open' ? !m.handled : m.handled));

  return (
    <>
      <div className="filter-chips">
        {['all', 'open', 'handled'].map((f) => (
          <button key={f} className={`chip${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>{f}</button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="empty-state"><i className="fa-solid fa-headset" /><p>No queries here.</p></div>
      ) : (
        <div style={{ maxWidth: 820 }}>
          {shown.map((m) => (
            <div className="card mb-3" style={{ padding: 18, borderColor: m.handled ? 'var(--glass-bdr)' : 'rgba(255,107,0,0.3)' }} key={m._id}>
              <div className="row-between">
                <strong>
                  {m.name}
                  {m.subject && <span className="badge badge-fire" style={{ marginLeft: 8 }}>{m.subject}</span>}
                  {!m.handled && <span className="badge badge-magenta" style={{ marginLeft: 6 }}>open</span>}
                </strong>
                <span className="text-muted" style={{ fontSize: '0.72rem' }}>{timeAgo(m.createdAt)}</span>
              </div>
              <p className="text-muted" style={{ fontSize: '0.8rem', margin: '4px 0' }}>
                {m.email || '—'}{m.mobile ? ` · ${m.mobile}` : ''}
              </p>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{m.message}</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className={`btn btn-sm ${m.handled ? 'btn-outline' : 'btn-primary'}`} onClick={() => markHandled(m._id, !m.handled)}>
                  <i className="fa-solid fa-circle-check" /> {m.handled ? 'Mark open' : 'Mark handled'}
                </button>
                {m.email && <a className="btn btn-sm btn-outline" href={`mailto:${m.email}`}><i className="fa-solid fa-envelope" /> Reply</a>}
                <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5', marginLeft: 'auto' }} onClick={() => remove(m._id)}><i className="fa-solid fa-trash" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function UserReports() {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('open'); // all | open | resolved
  const load = () => api.get('/admin/reports').then((r) => setReports(r.data.reports)).catch(() => {});
  useEffect(() => { load(); }, []);

  const setStatus = async (id, status) => {
    try {
      await api.patch(`/admin/reports/${id}`, { status });
      setReports((rs) => rs.map((r) => (r._id === id ? { ...r, status } : r)));
      toast('fa-solid fa-circle-check', status === 'resolved' ? 'Marked resolved' : 'Reopened');
    } catch (e) { toast('fa-solid fa-circle-xmark', apiError(e)); }
  };
  const remove = async (id) => {
    if (!window.confirm('Delete this report?')) return;
    try { await api.delete(`/admin/reports/${id}`); setReports((rs) => rs.filter((r) => r._id !== id)); toast('fa-solid fa-trash', 'Deleted'); }
    catch (e) { toast('fa-solid fa-circle-xmark', apiError(e)); }
  };

  const shown = reports.filter((r) => filter === 'all' || r.status === filter);

  return (
    <>
      <div className="filter-chips">
        {['all', 'open', 'resolved'].map((f) => (
          <button key={f} className={`chip${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>{f}</button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="empty-state"><i className="fa-solid fa-flag" /><p>No reports here.</p></div>
      ) : (
        <div style={{ maxWidth: 820 }}>
          {shown.map((r) => (
            <div className="card mb-3" style={{ padding: 18, borderColor: r.status === 'open' ? 'rgba(255,107,0,0.3)' : 'var(--glass-bdr)' }} key={r._id}>
              <div className="row-between">
                <strong>
                  {r.reportedUser ? (
                    <Link to={`/members/${r.reportedUser._id}`}>{r.reportedUser.fullName}</Link>
                  ) : (
                    <span className="text-muted">Deleted user</span>
                  )}
                  {r.reportedUser && !r.reportedUser.isActive && <span className="badge badge-red" style={{ marginLeft: 6 }}>banned</span>}
                  {r.status === 'open' && <span className="badge badge-magenta" style={{ marginLeft: 6 }}>open</span>}
                </strong>
                <span className="text-muted" style={{ fontSize: '0.72rem' }}>{timeAgo(r.createdAt)}</span>
              </div>
              <p className="text-muted" style={{ fontSize: '0.8rem', margin: '4px 0' }}>
                Reported by {r.reporter?.fullName || 'a member'} ({r.reporter?.email || '—'})
              </p>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{r.reason}</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className={`btn btn-sm ${r.status === 'resolved' ? 'btn-outline' : 'btn-primary'}`} onClick={() => setStatus(r._id, r.status === 'resolved' ? 'open' : 'resolved')}>
                  <i className="fa-solid fa-circle-check" /> {r.status === 'resolved' ? 'Reopen' : 'Mark resolved'}
                </button>
                {r.reportedUser && (
                  <Link to={`/members/${r.reportedUser._id}`} className="btn btn-sm btn-outline">
                    <i className="fa-solid fa-user" /> View profile
                  </Link>
                )}
                <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5', marginLeft: 'auto' }} onClick={() => remove(r._id)}><i className="fa-solid fa-trash" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
