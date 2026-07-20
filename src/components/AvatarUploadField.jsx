import { useEffect, useRef, useState } from 'react';
import { imageUrl, AVATAR_FALLBACK } from '../lib/helpers.js';
import ImageCropModal from './ImageCropModal.jsx';

// Avatar upload box that always routes through a 1:1 crop step before
// handing the final file back — so every profile photo in the app ends up
// framed the same way it's displayed everywhere else (a circle).
export default function AvatarUploadField({ value, currentUrl, onChange, label = 'Change photo' }) {
  const inputRef = useRef(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (!value) {
      setPreviewUrl('');
      return undefined;
    }
    const url = URL.createObjectURL(value);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const pickFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) setPendingFile(file);
  };

  return (
    <>
      <div className="upload-box mb-3" onClick={() => inputRef.current?.click()}>
        <img className="avatar-preview" src={previewUrl || imageUrl(currentUrl, AVATAR_FALLBACK)} alt="" />
        <div className="upload-label">{value ? value.name : label}</div>
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={pickFile} />
      </div>

      <ImageCropModal
        file={pendingFile}
        onCancel={() => setPendingFile(null)}
        onCropped={(cropped) => {
          setPendingFile(null);
          onChange(cropped);
        }}
      />
    </>
  );
}
