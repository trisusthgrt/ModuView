type Props = {
  label: string;
  variant?: 'neutral' | 'success' | 'warning' | 'danger';
};

const colors: Record<NonNullable<Props['variant']>, { bg: string; fg: string }> =
  {
    neutral: { bg: '#eef2ff', fg: '#3730a3' },
    success: { bg: '#dcfce7', fg: '#166534' },
    warning: { bg: '#fef9c3', fg: '#854d0e' },
    danger: { bg: '#fee2e2', fg: '#991b1b' },
  };

export const Badge = ({ label, variant = 'neutral' }: Props) => {
  const c = colors[variant];
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 999,
        background: c.bg,
        color: c.fg,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {label}
    </span>
  );
};

