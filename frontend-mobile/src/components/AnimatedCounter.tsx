import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

interface AnimatedCounterProps {
  value: number;
  fontSize?: number;
  color?: string;
  fontWeight?: 'normal' | 'bold' | '400' | '700';
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  fontSize = 28,
  color = '#22C55E',
  fontWeight = 'bold',
}) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current === value) return;
    prevValue.current = value;

    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 80, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -10, duration: 80, useNativeDriver: true }),
    ]).start(() => {
      translateY.setValue(10);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]).start();
    });
  }, [value, opacity, translateY]);

  return (
    <View style={styles.wrap}>
      <Animated.Text
        style={[styles.text, { fontSize, color, fontWeight, opacity, transform: [{ translateY }] }]}
      >
        {value}
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {},
});

export default AnimatedCounter;
