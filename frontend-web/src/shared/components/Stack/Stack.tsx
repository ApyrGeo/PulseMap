import { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import './Stack.css';

interface StackCard {
  id: number | string;
  img: string;
}

interface StackProps {
  cards: StackCard[];
  autoplayDelay?: number;
  sensitivity?: number;
  cardDimensions?: { width: number; height: number };
}

const Stack = ({
  cards,
  autoplayDelay = 2000,
  sensitivity = 150,
  cardDimensions = { width: 220, height: 260 },
}: StackProps) => {
  const [stack, setStack] = useState<StackCard[]>([...cards]);
  const dragX = useMotionValue(0);
  const rotate = useTransform(dragX, [-sensitivity, sensitivity], [-18, 18]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const advance = () => {
    setStack((prev) => {
      if (prev.length <= 1) return prev;
      const [first, ...rest] = prev;
      return [...rest, first];
    });
  };

  useEffect(() => {
    if (autoplayDelay > 0) {
      intervalRef.current = setInterval(advance, autoplayDelay);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoplayDelay]);

  const resetInterval = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (autoplayDelay > 0) {
      intervalRef.current = setInterval(advance, autoplayDelay);
    }
  };

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (Math.abs(info.offset.x) > sensitivity) {
      advance();
      resetInterval();
    }
  };

  return (
    <div className="stack-container" style={{ width: cardDimensions.width, height: cardDimensions.height }}>
      <AnimatePresence>
        {stack.slice(0, 4).map((card, i) => {
          const isTop = i === 0;
          return (
            <motion.div
              key={card.id}
              className="stack-card"
              style={{
                width: cardDimensions.width,
                height: cardDimensions.height,
                zIndex: stack.length - i,
                rotate: isTop ? rotate : i * 4 - 4,
                scale: 1 - i * 0.05,
                y: i * 8,
                x: isTop ? dragX : 0,
              }}
              drag={isTop ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={isTop ? handleDragEnd : undefined}
              whileDrag={{ cursor: 'grabbing' }}
            >
              <img src={card.img} alt="" draggable={false} />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default Stack;
