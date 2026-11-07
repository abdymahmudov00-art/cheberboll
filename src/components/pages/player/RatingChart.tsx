import type { RatingPoint } from "@/lib/rating";

/** Простой график рейтинга на SVG, без сторонних библиотек */
export default function RatingChart({ points }: { points: RatingPoint[] }) {
  if (points.length < 2) {
    return <div className="py-10 text-center text-sm text-muted">График появится после первого матча</div>;
  }
  const W = 600;
  const H = 180;
  const PAD = 24;
  const values = points.map((p) => p.rating);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 10);
  const x = (i: number) => PAD + (i / (points.length - 1)) * (W - PAD * 2);
  const y = (v: number) => H - PAD - ((v - min) / span) * (H - PAD * 2);
  const line = points.map((p, i) => `${x(i)},${y(p.rating)}`).join(" ");
  const area = `${x(0)},${H - PAD} ${line} ${x(points.length - 1)},${H - PAD}`;
  const last = points[points.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="График изменения рейтинга">
      <line x1={PAD} x2={W - PAD} y1={y(max)} y2={y(max)} stroke="var(--border)" strokeDasharray="4 4" />
      <line x1={PAD} x2={W - PAD} y1={y(min)} y2={y(min)} stroke="var(--border)" strokeDasharray="4 4" />
      <text x={W - PAD} y={y(max) - 6} textAnchor="end" fontSize="11" fill="var(--muted)">
        {max}
      </text>
      <text x={W - PAD} y={y(min) + 14} textAnchor="end" fontSize="11" fill="var(--muted)">
        {min}
      </text>
      <polygon points={area} fill="var(--accent)" opacity="0.08" />
      <polyline points={line} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx={x(points.length - 1)} cy={y(last.rating)} r="4.5" fill="var(--accent)" />
    </svg>
  );
}
