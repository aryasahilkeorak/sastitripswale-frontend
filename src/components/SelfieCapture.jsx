import { useEffect, useRef, useState } from 'react';

// A live, camera-only capture - deliberately offers no "choose from
// gallery" fallback, since the whole point is that the photo is taken
// right now, of the person completing verification.
export default function SelfieCapture({ onChange }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [active, setActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => () => stopCamera(), []);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setActive(false);
  };

  const startCamera = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      setActive(true);
      // Video element mounts this render; attach the stream right after.
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 0);
    } catch {
      setError('Camera access is required for a live verification photo. Please allow camera permission and try again.');
    }
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    // Mirror the shot to match the on-screen (mirrored) preview.
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
        setPreviewUrl(URL.createObjectURL(blob));
        onChange(file);
        stopCamera();
      },
      'image/jpeg',
      0.9
    );
  };

  const retake = () => {
    setPreviewUrl('');
    onChange(null);
    startCamera();
  };

  return (
    <div className="form-group">
      <label>Live selfie photo *</label>
      {previewUrl ? (
        <div className="upload-box" style={{ padding: 0, overflow: 'hidden', position: 'relative', cursor: 'default' }}>
          <img src={previewUrl} alt="Your captured selfie" style={{ width: '100%', display: 'block', maxHeight: 260, objectFit: 'cover' }} />
          <button
            type="button"
            className="btn btn-sm btn-outline"
            style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(10,18,32,0.7)' }}
            onClick={retake}
          >
            <i className="fa-solid fa-rotate" /> Retake
          </button>
        </div>
      ) : active ? (
        <div>
          <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', borderRadius: 12, background: '#000', transform: 'scaleX(-1)' }} />
          <button type="button" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} onClick={capture}>
            <i className="fa-solid fa-camera" /> Capture photo
          </button>
        </div>
      ) : (
        <div className="upload-box" onClick={startCamera}>
          <div className="upload-label"><i className="fa-solid fa-camera" /> Turn on camera &amp; take a live photo</div>
        </div>
      )}
      {error && <p style={{ color: '#fca5a5', fontSize: '0.75rem', marginTop: 6 }}>{error}</p>}
      <p className="text-muted" style={{ fontSize: '0.72rem', marginTop: 6 }}>
        <i className="fa-solid fa-shield-halved" /> Used only for identity verification - gallery uploads aren't accepted, this must be a live photo of your face.
      </p>
    </div>
  );
}
