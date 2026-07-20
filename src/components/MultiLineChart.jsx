import { useMemo, useRef, useState } from 'react';

// Validated categorical triplet (dark + light, both pass lightness band,
// chroma floor, CVD/normal-vision separation and contrast — see dataviz skill).
const DEFAULT_COLORS = ['#e8650a', '#3e8ef7', '#b8860b'];

const W = 720;
const H = 260;
const PAD_L = 40;
const PAD_R = 12;
const PAD_T = 16;
const PAD_B = 28;

function niceMax(max) {
  if (max <= 0) return 4;
  const pow = Math.pow(10, Math.floor(Math.log10(max)));
  const n = max / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

// Multi-series line chart — plain SVG, no chart library. `series` is
// [{ key, label, color? }]; `data` is [{ date, [key]: number, ... }].
export default function MultiLineChart({ data, series, formatDate }) {
  const [hoverIdx, setHoverIdx] = useState(null);
  const svgRef = useRef(null);

  const colored = useMemo(
    () => series.map((s, i) => ({ ...s, color: s.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length] })),
    [series]
  );

  const maxVal = useMemo(() => {
    let m = 0;
    for (const row of data) for (const s of colored) m = Math.max(m, row[s.key] || 0);
    return niceMax(m);
  }, [data, colored]);

  const n = data.length;
  const x = (i) => PAD_L + (n <= 1 ? 0 : (i * (W - PAD_L - PAD_R)) / (n - 1));
  const y = (v) => H - PAD_B - (v / maxVal) * (H - PAD_T - PAD_B);

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(maxVal * f));

  // Show ~6 evenly-spaced date labels along the X axis.
  const xLabelEvery = Math.max(1, Math.round(n / 6));

  const paths = colored.map((s) => ({
    ...s,
    d: data.map((row, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(row[s.key] || 0)}`).join(' '),
  }));

  const onMove = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    let closest = 0;
    let bestDist = Infinity;
    for (let i = 0; i < n; i++) {
      const d = Math.abs(x(i) - px);
      if (d < bestDist) { bestDist = d; closest = i; }
    }
    setHoverIdx(closest);
  };

  const hovered = hoverIdx != null ? data[hoverIdx] : null;
  const tooltipLeftPct = hoverIdx != null ? (x(hoverIdx) / W) * 100 : 0;
  const flipTooltip = tooltipLeftPct > 65;

  return (
    <div style={{ position: 'relative' }}>
      {/* Legend — always present for 2+ series */}
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 10 }}>
        {colored.map((s) => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-2)' }}>
            <span style={{ width: 14, height: 2, background: s.color, display: 'inline-block', borderRadius: 1 }} />
            {s.label}
          </div>
        ))}
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
        onMouseMove={onMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        {/* Gridlines — recessive hairlines */}
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={PAD_L} x2={W - PAD_R} y1={y(t)} y2={y(t)} stroke="var(--glass-bdr)" strokeWidth="1" />
            <text x={PAD_L - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize="10" fill="var(--text-3)">
              {t}
            </text>
          </g>
        ))}

        {/* X-axis date labels */}
        {data.map((row, i) =>
          i % xLabelEvery === 0 ? (
            <text key={row.date} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--text-3)">
              {formatDate ? formatDate(row.date) : row.date}
            </text>
          ) : null
        )}

        {/* Lines */}
        {paths.map((p) => (
          <path key={p.key} d={p.d} fill="none" stroke={p.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        ))}

        {/* Crosshair + per-series markers at hover */}
        {hovered && (
          <g>
            <line x1={x(hoverIdx)} x2={x(hoverIdx)} y1={PAD_T} y2={H - PAD_B} stroke="var(--glass-bdr-2)" strokeWidth="1" />
            {colored.map((s) => (
              <circle
                key={s.key}
                cx={x(hoverIdx)}
                cy={y(hovered[s.key] || 0)}
                r="4"
                fill={s.color}
                stroke="var(--surface)"
                strokeWidth="2"
              />
            ))}
          </g>
        )}
      </svg>

      {hovered && (
        <div
          className="chart-tooltip"
          style={{
            position: 'absolute',
            top: 4,
            left: flipTooltip ? undefined : `${tooltipLeftPct}%`,
            right: flipTooltip ? `${100 - tooltipLeftPct}%` : undefined,
            transform: flipTooltip ? 'translateX(12px)' : 'translateX(12px)',
          }}
        >
          <div className="chart-tooltip-date">{formatDate ? formatDate(hovered.date) : hovered.date}</div>
          {colored.map((s) => (
            <div key={s.key} className="chart-tooltip-row">
              <span className="chart-tooltip-key" style={{ background: s.color }} />
              <span className="chart-tooltip-label">{s.label}</span>
              <strong className="chart-tooltip-val">{hovered[s.key] ?? 0}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
