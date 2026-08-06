export function WidgetSkeleton() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60px',
        padding: '12px 16px',
        borderRadius: '12px',
        background: 'rgba(0, 0, 0, 0.04)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '220px',
          height: '16px',
          borderRadius: '9999px',
          background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)',
          backgroundSize: '200% 100%',
          animation: 'cw-skeleton-pulse 1.5s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes cw-skeleton-pulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
