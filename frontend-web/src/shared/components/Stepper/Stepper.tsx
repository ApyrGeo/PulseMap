import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Stepper.css';

export interface StepperStep {
  title: string;
  description: string;
}

interface StepperProps {
  steps: StepperStep[];
  onFinish: () => void;
  onSkip: () => void;
  finishLabel?: string;
  skipLabel?: string;
  nextLabel?: string;
}

const Stepper = ({ steps, onFinish, onSkip, finishLabel = 'Finish', skipLabel = 'Skip', nextLabel = 'Next' }: StepperProps) => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const goNext = () => {
    if (current < steps.length - 1) {
      setDirection(1);
      setCurrent((c) => c + 1);
    } else {
      onFinish();
    }
  };

  const isLast = current === steps.length - 1;

  return (
    <div className="stepper-root">
      {/* Step indicators */}
      <div className="stepper-indicators">
        {steps.map((_, i) => (
          <div key={i} className="stepper-indicator-wrapper">
            <div className={`stepper-dot ${i === current ? 'stepper-dot--active' : i < current ? 'stepper-dot--done' : ''}`}>
              {i < current ? '✓' : i + 1}
            </div>
            {i < steps.length - 1 && (
              <motion.div
                className="stepper-connector"
                animate={{ scaleX: i < current ? 1 : 0 }}
                initial={{ scaleX: 0 }}
                transition={{ duration: 0.4 }}
                style={{ originX: 0 }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="stepper-content-wrap">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            initial={{ x: direction * 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction * -60, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="stepper-content"
          >
            <h3 className="stepper-step-title">{steps[current].title}</h3>
            <p className="stepper-step-desc">{steps[current].description}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="stepper-actions">
        <button className="stepper-btn stepper-btn--skip" onClick={onSkip}>
          {skipLabel}
        </button>
        <button className="stepper-btn stepper-btn--next" onClick={goNext}>
          {isLast ? finishLabel : nextLabel}
        </button>
      </div>
    </div>
  );
};

export default Stepper;
