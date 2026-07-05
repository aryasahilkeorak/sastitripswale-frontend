import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section style={{ minHeight: '70vh', display: 'flex', alignItems: 'center' }}>
      <div className="container text-center">
        <div style={{ fontSize: '4rem' }}>🧭</div>
        <h1 className="section-title" style={{ fontSize: '2.4rem' }}>Lost the <span className="highlight">trail?</span></h1>
        <p className="section-sub" style={{ margin: '0 auto 28px' }}>The page you're looking for doesn't exist.</p>
        <Link to="/" className="btn btn-primary btn-lg"><i className="ri-home-5-line" /> Back home</Link>
      </div>
    </section>
  );
}
