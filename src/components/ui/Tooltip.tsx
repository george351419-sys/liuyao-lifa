import { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setVisible(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <span
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={() => setVisible(v => !v)}
        className="cursor-help"
        style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 4, userSelect: 'none' }}
      >
        ？
      </span>
      {visible && (
        <div
          className="absolute z-50"
          style={{
            left: '50%',
            bottom: '100%',
            transform: 'translateX(-50%)',
            marginBottom: 6,
            background: '#1A1F26',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '8px 12px',
            minWidth: 220,
            maxWidth: 300,
            fontSize: 12,
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            pointerEvents: 'none',
          }}
        >
          {content}
        </div>
      )}
      {children}
    </div>
  );
}
