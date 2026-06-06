import { useMemo } from 'react';
import type { RadarData } from '../types';

interface Props {
  data: RadarData;
  size?: number;
}

const axes = [
  { key: 'pronunciation' as const, label: '发音' },
  { key: 'grammar' as const, label: '语法' },
  { key: 'vocabulary' as const, label: '词汇量' },
  { key: 'fluency' as const, label: '流利度' },
  { key: 'confidence' as const, label: '自信心' },
];

export default function RadarChart({ data, size = 280 }: Props) {
  const center = size / 2;
  const maxR = center - 40;
  const angleStep = (2 * Math.PI) / axes.length;

  const points = useMemo(() => {
    return axes.map((axis, i) => {
      const angle = angleStep * i - Math.PI / 2;
      const value = data[axis.key] / 100;
      const r = maxR * value;
      return {
        x: center + r * Math.cos(angle),
        y: center + r * Math.sin(angle),
      };
    });
  }, [data, center, maxR, angleStep]);

  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  const gridPolygons = gridLevels.map((level) => {
    const pts = axes
      .map((_, i) => {
        const angle = angleStep * i - Math.PI / 2;
        const r = maxR * level;
        return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
      })
      .join(' ');
    return pts;
  });

  const dataPolygon = points.map((p) => `${p.x},${p.y}`).join(' ');

  const labelPoints = axes.map((axis, i) => {
    const angle = angleStep * i - Math.PI / 2;
    return {
      x: center + (maxR + 28) * Math.cos(angle),
      y: center + (maxR + 28) * Math.sin(angle),
      label: axis.label,
    };
  });

  return (
    <svg width={size} height={size} className="mx-auto">
      {gridPolygons.map((pts, i) => (
        <polygon
          key={i}
          points={pts}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="1"
        />
      ))}
      {axes.map((_, i) => {
        const angle = angleStep * i - Math.PI / 2;
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={center + maxR * Math.cos(angle)}
            y2={center + maxR * Math.sin(angle)}
            stroke="#E5E7EB"
            strokeWidth="1"
          />
        );
      })}
      <polygon
        points={dataPolygon}
        fill="rgba(37, 99, 235, 0.15)"
        stroke="#2563EB"
        strokeWidth="2"
      />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#2563EB" />
      ))}
      {labelPoints.map((lp, i) => (
        <text
          key={i}
          x={lp.x}
          y={lp.y}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-muted"
          fontSize="11"
          fontWeight="500"
        >
          {lp.label}
        </text>
      ))}
    </svg>
  );
}