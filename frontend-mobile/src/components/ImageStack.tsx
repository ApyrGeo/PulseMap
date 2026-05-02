import React, { useEffect, useRef, useState } from 'react';
import { View, Image, StyleSheet, Animated, PanResponder, Dimensions } from 'react-native';

const { width: SCREEN_W } = Dimensions.get('window');

interface ImageStackProps {
  images: string[];
  width?: number;
  height?: number;
  autoplayDelay?: number;
}

const ImageStack: React.FC<ImageStackProps> = ({
  images,
  width = SCREEN_W - 48,
  height = 200,
  autoplayDelay = 2000,
}) => {
  const [stack, setStack] = useState<string[]>([...images]);
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const advance = () => {
    setStack((prev) => {
      if (prev.length <= 1) return prev;
      const [first, ...rest] = prev;
      return [...rest, first];
    });
    translateX.setValue(0);
    rotate.setValue(0);
  };

  const resetInterval = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (autoplayDelay > 0) {
      intervalRef.current = setInterval(advance, autoplayDelay);
    }
  };

  useEffect(() => {
    resetInterval();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoplayDelay]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 10,
      onPanResponderMove: (_, gs) => {
        translateX.setValue(gs.dx);
        rotate.setValue(gs.dx / 15);
      },
      onPanResponderRelease: (_, gs) => {
        if (Math.abs(gs.dx) > 80) {
          advance();
          resetInterval();
        } else {
          Animated.parallel([
            Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
            Animated.spring(rotate, { toValue: 0, useNativeDriver: true }),
          ]).start();
        }
      },
    })
  ).current;

  if (stack.length === 0) return null;

  const rotateStr = rotate.interpolate({ inputRange: [-30, 30], outputRange: ['-30deg', '30deg'] });

  return (
    <View style={[styles.container, { width, height }]}>
      {stack.slice(0, 4).map((img, i) => {
        const isTop = i === 0;
        const cardStyle = isTop
          ? {
              transform: [{ translateX }, { rotate: rotateStr }],
              zIndex: stack.length - i,
            }
          : {
              transform: [{ rotate: `${(i - 1) * 4 - 2}deg` }, { scale: 1 - i * 0.04 }, { translateY: i * 6 }],
              zIndex: stack.length - i,
            };

        return (
          <Animated.View
            key={`${img}-${i}`}
            style={[styles.card, { width, height }, cardStyle]}
            {...(isTop ? panResponder.panHandlers : {})}
          >
            <Image source={{ uri: img }} style={styles.image} resizeMode="cover" />
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default ImageStack;
