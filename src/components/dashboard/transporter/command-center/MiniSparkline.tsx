const MiniSparkline = ({ data, color, height = 28, width = 90 }: { data: number[]; color: string; height?: number; width?: number }) => {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * (height - 4) - 2}`).join(' ');
  const areaPoints = `0,${height} ${points} ${width},${height}`;
  const gradientId = `spark-${color.replace(/[^a-z0-9]/gi, '')}`;

  return (
    <svg width={width} height={height} className="shrink-0">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${gradientId})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {data.length > 0 && (
        <circle cx={width} cy={height - ((data[data.length - 1] - min) / range) * (height - 4) - 2} r="3" fill={color} />
      )}
    </svg>
  );
};

export default MiniSparkline;
