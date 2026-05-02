import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './BubbleMenu.css';

interface BubbleMenuItem {
  label: string;
  onClick: () => void;
  hoverStyles?: { bgColor?: string; textColor?: string };
}

interface BubbleMenuProps {
  logo: React.ReactNode;
  menuBg?: string;
  menuContentColor?: string;
  items: BubbleMenuItem[];
}

const BubbleMenu = ({
  logo,
  menuBg = '#1A1A2E',
  menuContentColor = '#22C55E',
  items,
}: BubbleMenuProps) => {
  const [open, setOpen] = useState(false);
  const bubblesRef = useRef<HTMLDivElement[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const els = bubblesRef.current.filter(Boolean);
    if (open) {
      gsap.fromTo(
        els,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)', stagger: 0.06 }
      );
    } else {
      gsap.to(els, { scale: 0, opacity: 0, duration: 0.2, stagger: 0.04, ease: 'power2.in' });
    }
  }, [open]);

  return (
    <div ref={containerRef} className="bubble-menu-container">
      <button
        className="bubble-trigger"
        style={{ background: menuBg, color: menuContentColor }}
        onClick={() => setOpen((v) => !v)}
        aria-label="Language menu"
      >
        {logo}
      </button>

      <div className={`bubble-list ${open ? 'bubble-list--open' : ''}`}>
        {items.map((item, i) => (
          <div
            key={i}
            ref={(el) => { if (el) bubblesRef.current[i] = el; }}
            className="bubble-item"
            style={{
              background: menuBg,
              color: menuContentColor,
              ['--bubble-hover-bg' as string]: item.hoverStyles?.bgColor ?? '#22C55E',
              ['--bubble-hover-color' as string]: item.hoverStyles?.textColor ?? '#fff',
            }}
            onClick={() => { item.onClick(); setOpen(false); }}
          >
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BubbleMenu;
