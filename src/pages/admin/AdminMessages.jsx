import { useEffect, useState } from 'react';
import { api, apiError } from '../../lib/api.js';
import { timeAgo } from '../../lib/helpers.js';
import { toast } from '../../lib/toast.js';

export default function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [filter, setFilter] = useState('all'); // all | open | handled
  const load = () => api.get('/admin/contact-messages').then((r) => setMessages(r.data.messages)).catch(() => {});
  useEffect(() => { load(); }, []);

  const markHandled = async (id, handled) => {
    try { await api.patch(`/admin/contact-messages/${id}`, { handled }); setMessages((ms) => ms.map((m) => (m._id === id ? { ...m, handled } : m))); }
    catch (e) { toast('fa-solid fa-circle-xmark', apiError(e)); }
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
