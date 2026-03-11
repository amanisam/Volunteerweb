'use client';
import React from 'react';

interface ChartProps {
  data: number[];
  labels: string[];
  color?: string;
  height?: number;
}

export const BarChart = ({ data, labels, color = 'var(--primary)', height = 200 }: ChartProps) => {
  const max = Math.max(...data, 1);
  return (
    <div className="chart-container" style={{ height: height + 100 }}>
      <div style={{ display: 'flex', height: height, alignItems: 'flex-end', gap: '8px', paddingBottom: '20px' }}>
        {data.map((val, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div 
              style={{ 
                width: '100%', 
                height: `${(val / max) * 100}%`, 
                background: color, 
                borderRadius: '4px 4px 0 0',
                transition: 'height 0.5s ease',
                position: 'relative'
              }}
              className="chart-bar-hover"
            >
              <div className="chart-tooltip">{val}</div>
            </div>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
              {labels[i]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const LineChart = ({ data, labels, color = 'var(--primary)', height = 200 }: ChartProps) => {
  const max = Math.max(...data, 1);
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (val / max) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="chart-container" style={{ height: height + 100 }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: height, overflow: 'visible' }}>
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={points}
          style={{ transition: 'all 0.5s' }}
        />
        {data.map((val, i) => (
          <circle 
            key={i} 
            cx={(i / (data.length - 1)) * 100} 
            cy={100 - (val / max) * 100} 
            r="1.5" 
            fill="white" 
            stroke={color} 
            strokeWidth="1"
          />
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
        {labels.map((l, i) => (
          <span key={i} style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{l}</span>
        ))}
      </div>
    </div>
  );
};

export const PieChart = ({ data, labels, colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'] }: { data: number[], labels: string[], colors?: string[] }) => {
  if (total === 0) {
    return (
      <div className="chart-container" style={{ display: 'flex', alignItems: 'center', gap: '2rem', minHeight: '150px' }}>
        <svg viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)', width: '150px', height: '150px' }}>
          <circle cx="0" cy="0" r="1" fill="#f3f4f6" />
        </svg>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No data available yet</div>
      </div>
    );
  }

  return (
    <div className="chart-container" style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
      <svg viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)', width: '150px', height: '150px' }}>
        {data.map((val, i) => {
          const percent = val / total;
          const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
          cumulativePercent += percent;
          const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
          const largeArcFlag = percent > 0.5 ? 1 : 0;
          const pathData = [
            `M ${startX} ${startY}`,
            `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            'L 0 0',
          ].join(' ');
          return <path key={i} d={pathData} fill={colors[i % colors.length]} />;
        })}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {labels.map((l, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: colors[i % colors.length] }}></div>
            <span style={{ color: 'var(--text-secondary)' }}>{l}: <strong>{data[i]}</strong></span>
          </div>
        ))}
      </div>
    </div>
  );
};
