import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './Masonry.css';

interface MasonryItem {
  id: number | string;
  img: string;
  url?: string;
  height?: number;
  label?: string;
}

interface MasonryProps {
  items: MasonryItem[];
  columns?: number;
  gap?: number;
  ease?: string;
  duration?: number;
  stagger?: number;
  animateFrom?: 'bottom' | 'top' | 'left' | 'right';
  scaleOnHover?: boolean;
  hoverOverlay?: string;
}

const Masonry = ({
  items,
  columns = 3,
  gap = 12,
  ease = 'power3.out',
  duration = 0.6,
  stagger = 0.05,
  animateFrom = 'bottom',
  scaleOnHover = true,
  hoverOverlay = 'rgba(0,0,0,0.2)',
}: MasonryProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState(columns);

  useEffect(() => {
    const update = () => {
      const w = containerRef.current?.offsetWidth ?? 0;
      if (w < 480) setCols(1);
      else if (w < 768) setCols(2);
      else setCols(columns);
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [columns]);

  useEffect(() => {
    if (!containerRef.current) return;
    const cards = containerRef.current.querySelectorAll<HTMLElement>('.masonry-item');
    const fromProps =
      animateFrom === 'bottom' ? { y: 60, opacity: 0 }
      : animateFrom === 'top' ? { y: -60, opacity: 0 }
      : animateFrom === 'left' ? { x: -60, opacity: 0 }
      : { x: 60, opacity: 0 };

    gsap.fromTo(cards, fromProps, {
      x: 0,
      y: 0,
      opacity: 1,
      duration,
      ease,
      stagger,
    });
  }, [items, cols, animateFrom, duration, ease, stagger]);

  const columnArrays: MasonryItem[][] = Array.from({ length: cols }, () => []);
  items.forEach((item, i) => columnArrays[i % cols].push(item));

  return (
    <div
      ref={containerRef}
      className="masonry-grid"
      style={{ gap }}
    >
      {columnArrays.map((col, ci) => (
        <div key={ci} className="masonry-column" style={{ gap }}>
          {col.map((item) => (
            <div
              key={item.id}
              className="masonry-item"
              style={scaleOnHover ? { '--hover-overlay': hoverOverlay } as React.CSSProperties : {}}
            >
              <img
                src={item.img}
                alt=""
                style={{ height: item.height ?? 'auto' }}
              />
              {scaleOnHover && <div className="masonry-overlay" />}
              {item.label && (
                <div className="masonry-label">
                  <span>@{item.label}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Masonry;
