import { useEffect, useState } from 'react';
import { api, apiError } from '../../lib/api.js';
import { useAuth } from '../../store/auth.js';
import { formatDate } from '../../lib/helpers.js';
import { toast } from '../../lib/toast.js';
import PasswordInput from '../../components/PasswordInput.jsx';

const EMPTY = { fullName: '', email: '', mobile: '', password: '', role: 'admin' };

export default function AdminAdmins() {
  const me = useAuth((s) => s.user);
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

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
  const revoke = (id) => { if (window.confirm('Revoke this admin (demote to a normal member)?')) changeRole(id, 'member'); };

  return (
    <div className="grid-2">
      <form className="card" style={{ padding: 24, alignSelf: 'flex-start' }} onSubmit={create}>
        <h4 className="mb-3" style={{ fontFamily: 'var(--font-display)' }}>Add a new admin</h4>
        <div className="form-group"><label>Full name *</label><input className="form-input" value={form.fullName} onChange={set('fullName')} required /></div>
        <div className="form-row">
          <div className="form-group"><label>Email *</label><input className="form-input" type="email" value={form.email} onChange={set('email')} required /></div>
          <div className="form-group"><label>Mobile *</label><input className="form-input" value={form.mobile} onChange={set('mobile')} required /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Password *</label><PasswordInput value={form.password} onChange={set('password')} required /></div>
          <div className="form-group"><label>Role</label>
            <select className="form-input" value={form.role} onChange={set('role')}>
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>
          </div>
        </div>
        <button className="btn btn-primary" disabled={busy}>{busy ? <span className="spinner" /> : <i className="fa-solid fa-user-plus" />} Create admin</button>
      </form>

      <div className="card" style={{ padding: 20 }}>
        <h4 className="mb-3" style={{ fontFamily: 'var(--font-display)' }}>Admins &amp; super admins</h4>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Since</th><th>Manage</th></tr></thead>
            <tbody>
              {admins.map((a) => {
                const self = String(a.id) === String(me?.id);
                return (
                  <tr key={a.id}>
                    <td>{a.fullName}{self ? ' (you)' : ''}</td>
                    <td>{a.email}</td>
                    <td><span className={`role-badge ${a.role === 'superadmin' ? 'super' : 'admin'}`}>{a.role === 'superadmin' ? 'Super' : 'Admin'}</span></td>
                    <td>{formatDate(a.createdAt)}</td>
                    <td>
                      {self ? <span className="text-muted" style={{ fontSize: '0.72rem' }}>—</span> : (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <select className="form-input" style={{ padding: '5px 8px', width: 'auto', fontSize: '0.78rem' }} value={a.role} onChange={(e) => changeRole(a.id, e.target.value)}>
                            <option value="admin">Admin</option>
                            <option value="superadmin">Super Admin</option>
                          </select>
                          <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }} onClick={() => revoke(a.id)} title="Revoke admin access"><i className="fa-solid fa-user-minus" /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
