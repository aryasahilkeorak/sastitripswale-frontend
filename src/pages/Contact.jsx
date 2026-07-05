import { useState } from 'react';
import { api, apiError } from '../lib/api.js';
import { toast } from '../lib/toast.js';
import PageHero from '../components/PageHero.jsx';

const INFO = [
  { icon: 'ri-whatsapp-line', label: 'WhatsApp', value: '+91 98765 43210', href: 'https://wa.me/919876543210' },
  { icon: 'ri-mail-line', label: 'Email', value: 'hello@sastitripwale.com', href: 'mailto:hello@sastitripwale.com' },
  { icon: 'ri-phone-line', label: 'Phone', value: '+91 98765 43210', href: 'tel:+919876543210' },
  { icon: 'ri-map-pin-line', label: 'Location', value: 'Delhi, India', href: '#' },
];

const QA = [
  { q: 'How to join for free?', a: 'Use coupon FREEJOIN at checkout for 100% off the ₹99 fee.' },
  { q: 'Is it safe?', a: 'Every member is ID-verified, with women-safe verified groups available.' },
  { q: 'How are costs split?', a: 'Total trip budget is divided equally among all confirmed members.' },
];

export default function Contact() {
  const [form, setForm] = useState({ name: '', mobile: '', email: '', subject: '', message: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/contact', form);
      toast('📩', "Message sent! We'll reply within 24 hours.");
      setForm({ name: '', mobile: '', email: '', subject: '', message: '' });
    } catch (err) {
      toast('❌', apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const whatsapp = () => {
    const text = encodeURIComponent(`Hi SastiTripWale! I'm ${form.name || 'a traveler'}. ${form.message || ''}`);
    window.open(`https://wa.me/919876543210?text=${text}`, '_blank');
  };

  return (
    <>
      <PageHero tag="Get in Touch" tagIcon="ri-customer-service-2-fill" title="Contact" highlight="Us" sub="Questions about joining, trips or safety? We're here to help." />

      <section style={{ paddingTop: 40 }}>
        <div className="container">
          <div className="detail-grid">
            {/* Left: info */}
            <div>
              <div className="grid-2 mb-3">
                {INFO.map((i) => (
                  <a key={i.label} href={i.href} target={i.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="card" style={{ padding: 20 }}>
                    <div className="notif-icon" style={{ marginBottom: 10 }}><i className={i.icon} /></div>
                    <div className="text-muted" style={{ fontSize: '0.72rem' }}>{i.label}</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{i.value}</div>
                  </a>
                ))}
              </div>
              <div className="card" style={{ padding: 24 }}>
                <h4 className="mb-3" style={{ fontFamily: 'var(--font-display)' }}>Quick answers</h4>
                {QA.map((x) => (
                  <div key={x.q} style={{ marginBottom: 14 }}>
                    <strong style={{ fontSize: '0.88rem' }}>{x.q}</strong>
                    <p className="text-muted" style={{ fontSize: '0.82rem', marginTop: 2 }}>{x.a}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: form */}
            <form className="card" style={{ padding: 28 }} onSubmit={submit}>
              <h3 className="mb-3" style={{ fontFamily: 'var(--font-display)' }}>Send a message</h3>
              <div className="form-row">
                <div className="form-group"><label>Name *</label><input className="form-input" required value={form.name} onChange={set('name')} /></div>
                <div className="form-group"><label>Mobile</label><input className="form-input" value={form.mobile} onChange={set('mobile')} /></div>
              </div>
              <div className="form-group"><label>Email</label><input className="form-input" type="email" value={form.email} onChange={set('email')} /></div>
              <div className="form-group"><label>Subject</label>
                <select className="form-input" value={form.subject} onChange={set('subject')}>
                  <option value="">Select</option><option>Joining / Membership</option><option>Trip question</option><option>Safety</option><option>Feedback</option><option>Other</option>
                </select>
              </div>
              <div className="form-group"><label>Message *</label><textarea className="form-input" required value={form.message} onChange={set('message')} /></div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={busy}>
                  {busy ? <span className="spinner" /> : <i className="ri-send-plane-line" />} Send Message
                </button>
                <button type="button" className="btn" style={{ background: '#25D366', color: '#06070d' }} onClick={whatsapp}>
                  <i className="ri-whatsapp-line" /> WhatsApp
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
