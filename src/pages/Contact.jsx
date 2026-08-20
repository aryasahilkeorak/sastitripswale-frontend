import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, apiError } from '../lib/api.js';
import { useAuth } from '../store/auth.js';
import { toast } from '../lib/toast.js';
import PageHero from '../components/PageHero.jsx';
import CustomSelect from '../components/CustomSelect.jsx';
import Seo from '../components/Seo.jsx';

const INFO = [
  // Mobile/WhatsApp/email temporarily hidden across the app - see Footer.jsx and Layout.jsx.
  // { icon: 'fa-brands fa-whatsapp', label: 'WhatsApp', value: '+91 98765 43210', href: 'https://wa.me/919876543210' },
  // { icon: 'fa-solid fa-envelope', label: 'Email', value: 'hello@SastiTripsWale.com', href: 'mailto:hello@SastiTripsWale.com' },
  // { icon: 'fa-solid fa-phone', label: 'Phone', value: '+91 98765 43210', href: 'tel:+919876543210' },
  { icon: 'fa-solid fa-location-dot', label: 'Location', value: 'Sector 119, Mohali, Punjab 160055' },
  { icon: 'fa-solid fa-clock', label: 'Response time', value: 'Within 24 hours' },
];

const QA = [
  { q: 'How to join for free?', a: 'Use coupon FREEJOIN at checkout for 100% off the ₹99 fee.', icon: 'fa-solid fa-ticket' },
  { q: 'Is it safe?', a: 'Every member is ID-verified, with women-safe verified groups available.', icon: 'fa-solid fa-shield-halved' },
  { q: 'How are costs split?', a: 'Total trip budget is divided equally among all confirmed members.', icon: 'fa-solid fa-wallet' },
];

export default function Contact() {
  const navigate = useNavigate();
  const accessToken = useAuth((s) => s.accessToken);
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    name: '',
    mobile: '',
    email: '',
    subject: searchParams.get('subject') || '',
    message: searchParams.get('message') || '',
  });
  const [busy, setBusy] = useState(false);
  const [chatBusy, setChatBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const openSupportChat = async () => {
    if (!accessToken) {
      toast('fa-solid fa-lock', 'Log in to chat with support');
      navigate('/login');
      return;
    }
    setChatBusy(true);
    try {
      const { data } = await api.get('/chat/support');
      navigate(`/chat/${data.groupId}`);
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setChatBusy(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/contact', form);
      toast('fa-solid fa-envelope', "Message sent! We'll reply within 24 hours.");
      setForm({ name: '', mobile: '', email: '', subject: '', message: '' });
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setBusy(false);
    }
  };

  // Unused while the WhatsApp button above is temporarily hidden.
  // const whatsapp = () => {
  //   const text = encodeURIComponent(`Hi SastiTripsWale! I'm ${form.name || 'a traveler'}. ${form.message || ''}`);
  //   window.open(`https://wa.me/919876543210?text=${text}`, '_blank');
  // };

  return (
    <>
      <Seo
        title="Contact Us"
        description="Get in touch with SastiTripsWale - questions about joining, planning a trip, expense splitting or safety verification. We respond within 24 hours."
        path="/contact"
      />
      <PageHero tag="Get in Touch" tagIcon="fa-solid fa-headset" title="Contact" highlight="Us" sub="Questions about joining, trips or safety? We're here to help." />

      <section style={{ paddingTop: 40 }}>
        <div className="container">
          <div className="contact-grid">
            {/* Left: info */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="grid-3 mb-3">
                {INFO.map((i) => (
                  <div key={i.label} className="card contact-info-tile">
                    <div className="notif-icon"><i className={i.icon} /></div>
                    <div>
                      <div className="text-muted" style={{ fontSize: '0.72rem' }}>{i.label}</div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{i.value}</div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  className="card contact-info-tile contact-support-tile"
                  style={{ width: '100%', textAlign: 'left', font: 'inherit', color: 'inherit', cursor: 'pointer' }}
                  onClick={openSupportChat}
                  disabled={chatBusy}
                >
                  <div className="notif-icon"><i className="fa-solid fa-headset" /></div>
                  <div style={{ flex: 1 }}>
                    <div className="text-muted" style={{ fontSize: '0.72rem' }}>Support</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {chatBusy ? 'Opening chat…' : 'Chat with us'}
                    </div>
                  </div>
                  {chatBusy ? <span className="spinner" /> : <i className="fa-solid fa-arrow-right" style={{ color: 'var(--text-3)' }} />}
                </button>
              </div>

              <div className="card contact-faq-card" style={{ flex: 1 }}>
                <h4 className="mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                  <i className="fa-regular fa-circle-question" style={{ color: 'var(--fire)', marginRight: 8 }} /> Quick answers
                </h4>
                {QA.map((x) => (
                  <div key={x.q} className="contact-faq-item">
                    <div className="notif-icon" style={{ width: 32, height: 32, borderRadius: 9 }}><i className={x.icon} style={{ fontSize: '0.85rem' }} /></div>
                    <div>
                      <strong style={{ fontSize: '0.88rem' }}>{x.q}</strong>
                      <p className="text-muted" style={{ fontSize: '0.82rem', marginTop: 2 }}>{x.a}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: form */}
            <form className="card contact-form-card" onSubmit={submit}>
              <h3 className="mb-1" style={{ fontFamily: 'var(--font-display)' }}>Send a message</h3>
              <p className="text-muted mb-3" style={{ fontSize: '0.82rem' }}>Fill this out and we'll get back to you within 24 hours.</p>
              <div className="form-row">
                <div className="form-group"><label>Name *</label><input className="form-input" required value={form.name} onChange={set('name')} /></div>
                <div className="form-group"><label>Mobile</label><input className="form-input" value={form.mobile} onChange={set('mobile')} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Email</label><input className="form-input" type="email" value={form.email} onChange={set('email')} /></div>
                <div className="form-group"><label>Subject</label>
                  <CustomSelect
                    value={form.subject}
                    onChange={set('subject')}
                    options={[
                      { value: '', label: 'Select' },
                      'Joining / Membership',
                      'Trip question',
                      'Withdrawal / Wallet',
                      'Safety',
                      'Feedback',
                      'Other',
                    ]}
                  />
                </div>
              </div>
              <div className="form-group"><label>Message *</label><textarea className="form-input" required rows={6} value={form.message} onChange={set('message')} /></div>
              <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
                {busy ? <span className="spinner" /> : <i className="fa-solid fa-paper-plane" />} Send Message
              </button>
              {/* WhatsApp temporarily hidden along with the brand's mobile number.
              <button type="button" className="btn" style={{ background: '#25D366', color: '#05070c' }} onClick={whatsapp}>
                <i className="fa-brands fa-whatsapp" /> WhatsApp
              </button> */}
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
