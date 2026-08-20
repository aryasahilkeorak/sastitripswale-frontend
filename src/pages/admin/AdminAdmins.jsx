import { useEffect, useState } from 'react';
import { api, apiError } from '../../lib/api.js';
import { useAuth } from '../../store/auth.js';
import { formatDate } from '../../lib/helpers.js';
import { toast } from '../../lib/toast.js';
import PasswordInput from '../../components/PasswordInput.jsx';
import Modal from '../../components/Modal.jsx';

const PERMISSIONS = [
  { key: 'users', label: 'Manage Users', icon: 'fa-solid fa-users' },
  { key: 'trips', label: 'Manage Trips', icon: 'fa-solid fa-route' },
  { key: 'coupons', label: 'Manage Coupons', icon: 'fa-solid fa-ticket' },
  { key: 'reviews', label: 'Manage Reviews', icon: 'fa-solid fa-star' },
  { key: 'messages', label: 'Manage Feedback / Queries', icon: 'fa-solid fa-headset' },
  { key: 'gallery', label: 'Manage Gallery', icon: 'fa-solid fa-image' },
  { key: 'revenue', label: 'View Revenue', icon: 'fa-solid fa-sack-dollar' },
  { key: 'influencers', label: 'Manage Influencers', icon: 'fa-solid fa-handshake' },
  { key: 'wallet', label: 'Manage Wallet Payouts', icon: 'fa-solid fa-wallet' },
];

const EMPTY = { fullName: '', email: '', mobile: '', password: '', permissions: [] };

function PermissionGrid({ value, onChange }) {
  const toggle = (key) => {
    onChange(value.includes(key) ? value.filter((p) => p !== key) : [...value, key]);
  };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 8 }}>
      {PERMISSIONS.map((p) => (
        <label
          key={p.key}
          className={`perm-check${value.includes(p.key) ? ' checked' : ''}`}
        >
          <input type="checkbox" className="perm-check-input" checked={value.includes(p.key)} onChange={() => toggle(p.key)} />
          <i className={p.icon} />
          {p.label}
        </label>
      ))}
    </div>
  );
}

export default function AdminAdmins() {
  const me = useAuth((s) => s.user);
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null); // admin being edited
  const [editPermissions, setEditPermissions] = useState([]);
  const [editBusy, setEditBusy] = useState(false);

  const load = () => api.get('/admin/admins').then((r) => setAdmins(r.data.admins)).catch(() => {});
  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/admin/admins', form);
      toast('fa-solid fa-user-shield', 'Admin created');
      setForm(EMPTY);
      load();
    } catch (err) { toast('fa-solid fa-circle-xmark', apiError(err)); }
    finally { setBusy(false); }
  };

  const changeRole = async (id, role) => {
    try {
      await api.patch(`/admin/admins/${id}`, { role });
      if (role === 'member') { setAdmins((as) => as.filter((a) => a.id !== id)); toast('fa-solid fa-user-minus', 'Admin access revoked'); }
      else { setAdmins((as) => as.map((a) => (a.id === id ? { ...a, role } : a))); toast('fa-solid fa-user-shield', 'Role updated'); }
    } catch (e) { toast('fa-solid fa-circle-xmark', apiError(e)); }
  };
  const openEditor = (a) => { setEditing(a); setEditPermissions(a.permissions || []); };
  const closeEditor = () => setEditing(null);

  const saveEdit = async () => {
    setEditBusy(true);
    try {
      const { data } = await api.patch(`/admin/admins/${editing.id}/permissions`, { permissions: editPermissions });
      setAdmins((as) => as.map((a) => (a.id === editing.id ? { ...a, permissions: data.permissions } : a)));
      toast('fa-solid fa-circle-check', 'Permissions updated');
      closeEditor();
    } catch (e) { toast('fa-solid fa-circle-xmark', apiError(e)); }
    finally { setEditBusy(false); }
  };

  const revokeFromEditor = () => {
    if (!window.confirm('Revoke this admin (demote to a normal member)?')) return;
    changeRole(editing.id, 'member');
    closeEditor();
  };

  return (
    <div>
      <form className="card mb-4" style={{ padding: 24 }} onSubmit={create}>
        <h4 className="mb-3" style={{ fontFamily: 'var(--font-display)' }}>Add a new admin</h4>
        <div className="form-row">
          <div className="form-group"><label>Full name *</label><input className="form-input" value={form.fullName} onChange={set('fullName')} required /></div>
          <div className="form-group"><label>Password *</label><PasswordInput value={form.password} onChange={set('password')} required /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Email *</label><input className="form-input" type="email" value={form.email} onChange={set('email')} required /></div>
          <div className="form-group"><label>Mobile *</label><input className="form-input" value={form.mobile} onChange={set('mobile')} required /></div>
        </div>

        <div className="form-group">
          <label>Permissions - what this admin can manage</label>
          <PermissionGrid
            value={form.permissions}
            onChange={(permissions) => setForm((f) => ({ ...f, permissions }))}
          />
        </div>

        <button className="btn btn-primary" disabled={busy}>{busy ? <span className="spinner" /> : <i className="fa-solid fa-user-plus" />} Create admin</button>
      </form>

      <div className="card" style={{ padding: 20 }}>
        <h4 className="mb-3" style={{ fontFamily: 'var(--font-display)' }}>Admins &amp; super admins</h4>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Permissions</th><th>Since</th><th>Manage</th></tr></thead>
            <tbody>
              {admins.map((a) => {
                const self = String(a.id) === String(me?.id);
                return (
                  <tr key={a.id}>
                    <td data-label="Name">{a.fullName}{self ? ' (you)' : ''}</td>
                    <td data-label="Email">{a.email}</td>
                    <td data-label="Role"><span className={`role-badge ${a.role === 'superadmin' ? 'super' : 'admin'}`}>{a.role === 'superadmin' ? 'Super' : 'Admin'}</span></td>
                    <td data-label="Permissions">
                      {a.role === 'superadmin' ? (
                        <span className="badge badge-gold">All access</span>
                      ) : (a.permissions || []).length === 0 ? (
                        <span className="text-muted" style={{ fontSize: '0.72rem' }}>None</span>
                      ) : (
                        <span className="badge badge-cyan">{a.permissions.length} of {PERMISSIONS.length}</span>
                      )}
                    </td>
                    <td data-label="Since">{formatDate(a.createdAt)}</td>
                    <td data-label="Manage">
                      {!self && a.role === 'admin' ? (
                        <button className="btn btn-sm btn-outline" onClick={() => openEditor(a)} title="Manage admin">
                          <i className="fa-solid fa-user-gear" /> Manage
                        </button>
                      ) : (
                        <span className="text-muted" style={{ fontSize: '0.72rem' }} title={a.role === 'superadmin' ? 'Super admins are protected and cannot be modified here' : undefined}>-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={Boolean(editing)} onClose={closeEditor} title={editing ? `Manage - ${editing.fullName}` : ''} maxWidth={560}>
        {editing && (
          <>
            <div className="form-group">
              <label>Permissions - what this admin can manage</label>
              <PermissionGrid value={editPermissions} onChange={setEditPermissions} />
            </div>

            <button className="btn btn-primary mt-3" style={{ width: '100%', justifyContent: 'center' }} onClick={saveEdit} disabled={editBusy}>
              {editBusy ? <span className="spinner" /> : <i className="fa-solid fa-floppy-disk" />} Save changes
            </button>

            <button
              className="btn btn-sm mt-3"
              style={{ width: '100%', justifyContent: 'center', background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}
              onClick={revokeFromEditor}
              disabled={editBusy}
            >
              <i className="fa-solid fa-user-minus" /> Revoke admin access
            </button>
          </>
        )}
      </Modal>
    </div>
  );
}
