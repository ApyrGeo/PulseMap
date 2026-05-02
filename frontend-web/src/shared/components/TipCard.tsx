import { useState, useEffect } from 'react';
import './TipCard.css';

interface TipCardProps {
  id: string;
  message: string;
}

const STORAGE_KEY = 'pulsemap_dismissed_tips';

const getDismissed = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
};

const TipCard = ({ id, message }: TipCardProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!getDismissed().includes(id));
  }, [id]);

  const dismiss = () => {
    const dismissed = getDismissed();
    if (!dismissed.includes(id)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...dismissed, id]));
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="tip-card">
      <span className="tip-card-icon">💡</span>
      <span className="tip-card-message">{message}</span>
      <button className="tip-card-dismiss" onClick={dismiss} aria-label="Dismiss tip">✕</button>
    </div>
  );
};

export default TipCard;
