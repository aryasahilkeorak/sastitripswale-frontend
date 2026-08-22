import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth.js';
import ProfileEditForm from '../components/ProfileEditForm.jsx';

// A dedicated full-page editor (Instagram-style) instead of an inline
// dashboard tab or modal - reached from the "Edit profile" button on the
// Dashboard and a member's own profile page.
export default function EditProfile() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);

  return (
    <section className="cp-section">
      <div className="container" style={{ maxWidth: 640 }}>
        <div className="edit-profile-head">
          <button className="ig-id-btn" onClick={() => navigate(-1)} aria-label="Back">
            <i className="fa-solid fa-arrow-left" />
          </button>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', margin: 0 }}>Edit Profile</h1>
        </div>

        <ProfileEditForm
          user={user}
          onSaved={(updated) => {
            setUser(updated);
            navigate(-1);
          }}
          onCancel={() => navigate(-1)}
        />
      </div>
    </section>
  );
}
