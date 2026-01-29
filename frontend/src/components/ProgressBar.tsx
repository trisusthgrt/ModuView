type Props = {
  value: number; // 0..100
};

export const ProgressBar = ({ value }: Props) => {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          width: 120,
          height: 8,
          background: '#e5e7eb',
          borderRadius: 999,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${v}%`,
            height: '100%',
            background: v === 100 ? '#16a34a' : '#2563eb',
          }}
        />
      </div>
      <span style={{ fontSize: 12 }}>{v}%</span>
    </div>
  );
};

