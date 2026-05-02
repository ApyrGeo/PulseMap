import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

interface CounterProps {
  value: number;
  fontSize?: number;
  textColor?: string;
  fontWeight?: string | number;
}

const Counter = ({ value, fontSize = 32, textColor = '#22C55E', fontWeight = 700 }: CounterProps) => {
  const motionValue = useMotionValue(value);
  const rounded = useTransform(motionValue, (v) => Math.round(v));
  const prevRef = useRef(value);

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 0.4,
      ease: 'easeOut',
    });
    prevRef.current = value;
    return controls.stop;
  }, [value, motionValue]);

  return (
    <motion.span
      style={{ fontSize, color: textColor, fontWeight, display: 'inline-block', minWidth: '2ch', textAlign: 'center' }}
    >
      {rounded}
    </motion.span>
  );
};

export default Counter;
