import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useTips } from '../contexts/TipsContext';

interface TipCardProps {
  message: string;
  top?: number;
}

const TipCard: React.FC<TipCardProps> = ({ message, top = 60 }) => {
  const { tipsEnabled } = useTips();
  const opacity = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!tipsEnabled) return;

    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start(() => setVisible(false));
  }, []);

  if (!tipsEnabled || !visible) return null;

  return (
    <Animated.View style={[styles.card, { top, opacity }]}>
      <Text style={styles.icon}>💡</Text>
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(26,26,46,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.35)',
    borderRadius: 10,
    padding: 14,
    zIndex: 200,
  },
  icon: {
    fontSize: 16,
    marginTop: 1,
  },
  message: {
    flex: 1,
    fontSize: 13,
    color: '#ccc',
    lineHeight: 20,
  },
});

export default TipCard;
