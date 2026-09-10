type NotificationPreviewProps = {
  title: string;
  body: string;
};

/** A lock-screen-style mockup so the admin can see roughly what a push/
 *  local notification will look like, not just raw title/body fields. */
export function NotificationPreview({ title, body }: NotificationPreviewProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        padding: 12,
        borderRadius: 14,
        background: 'rgba(255,255,255,0.9)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
        maxWidth: 340,
      }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: 'linear-gradient(135deg, #E6C875, #996515)',
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 11, color: '#8a8578', fontWeight: 600 }}>החסד היומי</span>
          <span style={{ fontSize: 11, color: '#8a8578' }}>עכשיו</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1c1917', marginTop: 2 }}>{title || ' '}</div>
        <div style={{ fontSize: 13, color: '#44403c', marginTop: 2 }}>{body || ' '}</div>
      </div>
    </div>
  );
}
