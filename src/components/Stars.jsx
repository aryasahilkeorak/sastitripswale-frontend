export default function Stars({ value = 5 }) {
  const v = Math.round(value);
  return (
    <span className="stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ opacity: i < v ? 1 : 0.25 }}>
          ★
        </span>
      ))}
    </span>
  );
}
