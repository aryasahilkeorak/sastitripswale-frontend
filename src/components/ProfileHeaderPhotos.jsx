import { useRef, useState } from 'react';
import { imageUrl, AVATAR_FALLBACK } from '../lib/helpers.js';
import ImageCropModal from './ImageCropModal.jsx';

// Facebook/LinkedIn-style header for profile-edit forms: a wide cover banner
// with the round avatar overlapping its bottom-left corner, each with its
// own camera-icon button - same pattern as the club header in PlanClub.jsx /
// ClubDetail.jsx, just self-contained so it drops into any card regardless
// of that card's own padding.
export default function ProfileHeaderPhotos({
  avatarFile, coverFile, currentAvatarUrl, currentCoverUrl, onAvatarChange, onCoverChange, editable = true,
}) {
  const avatarRef = useRef(null);
  const coverRef = useRef(null);
  const [pendingAvatar, setPendingAvatar] = useState(null);
  const [pendingCover, setPendingCover] = useState(null);

  const coverSrc = coverFile ? URL.createObjectURL(coverFile) : imageUrl(currentCoverUrl, '');

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <div style={{ position: 'relative', width: '100%', height: 140, borderRadius: 'var(--r)', overflow: 'hidden', background: 'var(--grad-fire)' }}>
          {coverSrc && (
            <img src={coverSrc} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          {editable && (
            <button
              type="button"
              className="btn btn-sm"
              style={{ position: 'absolute', right: 10, bottom: 10, borderRadius: '50%', width: 34, height: 34, padding: 0, justifyContent: 'center', background: 'rgba(0,0,0,0.55)', color: '#fff' }}
              onClick={() => coverRef.current?.click()}
              title="Change cover photo"
            >
              <i className="fa-solid fa-camera" />
            </button>
          )}
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

        <div style={{ position: 'relative', width: 96, margin: '-48px 0 0 20px' }}>
          <img
            src={avatarFile ? URL.createObjectURL(avatarFile) : imageUrl(currentAvatarUrl, AVATAR_FALLBACK)}
            alt=""
            style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--surface)', display: 'block' }}
          />
          {editable && (
            <button
              type="button"
              className="btn btn-sm"
              style={{ position: 'absolute', right: 0, bottom: 0, borderRadius: '50%', width: 30, height: 30, padding: 0, justifyContent: 'center', background: 'var(--fire)', color: '#fff' }}
              onClick={() => avatarRef.current?.click()}
              title="Change profile photo"
            >
              <i className="fa-solid fa-camera" />
            </button>
          )}
          <input
            ref={avatarRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) setPendingAvatar(f);
            }}
          />
        </div>
      </div>

      <ImageCropModal
        file={pendingAvatar}
        title="Crop profile photo"
        onCancel={() => setPendingAvatar(null)}
        onCropped={(cropped) => {
          setPendingAvatar(null);
          onAvatarChange(cropped);
        }}
      />
      <ImageCropModal
        file={pendingCover}
        aspect={3}
        guide="rect"
        title="Crop cover photo"
        onCancel={() => setPendingCover(null)}
        onCropped={(cropped) => {
          setPendingCover(null);
          onCoverChange(cropped);
        }}
      />
    </>
  );
}
