import { useEffect, useState } from 'react';
import { api, apiError } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';
import Modal from '../../components/Modal.jsx';

const EMPTY = { code: '', discountPct: '', discountAmt: '', maxUses: 1000 };

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null); // coupon being edited

  const load = () => api.get('/admin/coupons').then((r) => setCoupons(r.data.coupons)).catch(() => {});
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    try { await api.post('/admin/coupons', form); toast('fa-solid fa-ticket', 'Coupon created'); setForm(EMPTY); load(); }
    catch (err) { toast('fa-solid fa-circle-xmark', apiError(err)); }
  };
  const toggle = async (id) => {
    try {
      const { data } = await api.patch(`/admin/coupons/${id}`);
      setCoupons((cs) => cs.map((c) => (c._id === id ? { ...c, isActive: data.isActive } : c)));
      toast('fa-solid fa-circle-check', data.isActive ? 'Coupon enabled' : 'Coupon disabled');
    } catch (e) { toast('fa-solid fa-circle-xmark', apiError(e)); }
  };
  const remove = async (id) => {
    if (!window.confirm('Delete this coupon permanently?')) return;
    try { await api.delete(`/admin/coupons/${id}`); setCoupons((cs) => cs.filter((c) => c._id !== id)); toast('fa-solid fa-trash', 'Coupon removed'); }
    catch (e) { toast('fa-solid fa-circle-xmark', apiError(e)); }
  };
  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put(`/admin/coupons/${editing._id}`, {
        code: editing.code, discountPct: editing.discountPct, discountAmt: editing.discountAmt, maxUses: editing.maxUses,
      });
      setCoupons((cs) => cs.map((c) => (c._id === editing._id ? data.coupon : c)));
      setEditing(null);
      toast('fa-solid fa-circle-check', 'Coupon updated');
    } catch (err) { toast('fa-solid fa-circle-xmark', apiError(err)); }
  };

  return (
    <div className="grid-2">
      <form className="card" style={{ padding: 24, alignSelf: 'flex-start' }} onSubmit={create}>
        <h4 className="mb-3" style={{ fontFamily: 'var(--font-display)' }}>Add coupon</h4>
        <div className="form-group"><label>Code</label><input className="form-input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required /></div>
        <div className="form-row">
          <div className="form-group"><label>% off</label><input className="form-input" type="number" value={form.discountPct} onChange={(e) => setForm({ ...form, discountPct: e.target.value })} /></div>
          <div className="form-group"><label>₹ off</label><input className="form-input" type="number" value={form.discountAmt} onChange={(e) => setForm({ ...form, discountAmt: e.target.value })} /></div>
        </div>
        <div className="form-group"><label>Max uses</label><input className="form-input" type="number" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} /></div>
        <button className="btn btn-primary"><i className="fa-solid fa-plus" /> Create</button>
      </form>

      <div className="card" style={{ padding: 20 }}>
        <h4 className="mb-3" style={{ fontFamily: 'var(--font-display)' }}>All coupons</h4>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Code</th><th>Discount</th><th>Used</th><th>Actions</th></tr></thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c._id}>
                  <td data-label="Code" style={{ fontFamily: 'var(--font-mono)' }}>{c.code}{!c.isActive && <span className="text-muted" style={{ fontSize: '0.68rem' }}> (off)</span>}</td>
                  <td data-label="Discount">{c.discountPct ? `${c.discountPct}%` : `₹${c.discountAmt}`}</td>
                  <td data-label="Used">{c.usedCount}/{c.maxUses}</td>
                  <td data-label="Actions">
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button className="btn btn-sm btn-outline" onClick={() => setEditing({ ...c })}><i className="fa-solid fa-pen-to-square" /></button>
                      <button className={`btn btn-sm ${c.isActive ? 'btn-outline' : 'btn-primary'}`} onClick={() => toggle(c._id)}>{c.isActive ? 'Off' : 'On'}</button>
                      <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }} onClick={() => remove(c._id)}><i className="fa-solid fa-trash" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title="Edit coupon">
        {editing && (
          <form onSubmit={saveEdit}>
            <div className="form-group"><label>Code</label><input className="form-input" value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })} /></div>
            <div className="form-row">
              <div className="form-group"><label>% off</label><input className="form-input" type="number" value={editing.discountPct} onChange={(e) => setEditing({ ...editing, discountPct: e.target.value })} /></div>
              <div className="form-group"><label>₹ off</label><input className="form-input" type="number" value={editing.discountAmt} onChange={(e) => setEditing({ ...editing, discountAmt: e.target.value })} /></div>
            </div>
            <div className="form-group"><label>Max uses</label><input className="form-input" type="number" value={editing.maxUses} onChange={(e) => setEditing({ ...editing, maxUses: e.target.value })} /></div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}><i className="fa-solid fa-floppy-disk" /> Save changes</button>
          </form>
        )}
      </Modal>
    </div>
  );
}
