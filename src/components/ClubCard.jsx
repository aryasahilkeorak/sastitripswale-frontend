import { Link } from 'react-router-dom';
import { imageUrl, DESTINATION_PLACEHOLDER, CLUB_CATEGORY_LABEL, CLUB_CATEGORY_ICON, COVER_ASPECT_RATIO } from '../lib/helpers.js';
import { useT } from '../i18n/index.js';

export default function ClubCard({ club }) {
  const t = useT();
  return (
    <div className="member-card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Cover strip behind the avatar - same Facebook/LinkedIn treatment as the club detail page. */}
      <div
        style={{
          width: '100%',
          aspectRatio: COVER_ASPECT_RATIO,
          background: club.coverPhotoUrl ? `url(${imageUrl(club.coverPhotoUrl)}) center/cover` : 'var(--grad-fire)',
        }}
      />
      <div style={{ padding: '0 28px 28px', textAlign: 'center', marginTop: -40 }}>
        <Link to={`/clubs/${club._id}`} style={{ color: 'inherit' }}>
          <div className="member-avatar" style={{ border: '3px solid var(--surface)' }}>
            <img
              src={imageUrl(club.photoUrl, DESTINATION_PLACEHOLDER)}
              alt={club.name}
              onError={(e) => (e.currentTarget.src = DESTINATION_PLACEHOLDER)}
            />
          </div>
          <h3 style={{ marginTop: 14, marginBottom: 12 }}>{club.name}</h3>
          <span className="badge badge-fire">
            <i className={CLUB_CATEGORY_ICON[club.category]} /> {CLUB_CATEGORY_LABEL[club.category]}
          </span>
        </Link>
        <p className="member-meta" style={{ marginTop: 14 }}>
          <i className="fa-solid fa-users" /> {t('clubCard.memberCount').replace('{count}', club.memberCount)}
        </p>
        {club.owner && (
          <p className="member-meta" style={{ marginTop: 8 }}>
            <i className="fa-solid fa-crown" /> {club.owner.fullName}
          </p>
        )}

        <div style={{ marginTop: 22 }}>
          <Link
            to={`/clubs/${club._id}`}
            className={`btn btn-sm ${club.isMember ? 'btn-primary' : 'btn-outline'}`}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <i className={club.isMember ? 'fa-solid fa-comment-dots' : 'fa-solid fa-eye'} /> {club.isMember ? t('clubCard.openClub') : t('clubCard.viewClub')}
          </Link>
        </div>
      </div>
    </div>
  );
}
