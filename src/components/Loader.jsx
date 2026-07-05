export default function Loader({ label = 'Loading…' }) {
  return (
    <div className="page-loader">
      <span className="spinner" />
      <p>{label}</p>
    </div>
  );
}
