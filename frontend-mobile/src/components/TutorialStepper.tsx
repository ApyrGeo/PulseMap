import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

const TUTORIAL_KEY = 'pulsemap_tutorial_seen';
const { width: SCREEN_W } = Dimensions.get('window');
// Modal is SCREEN_W-48 wide, padding 24 on each side → content width = SCREEN_W-96
const CONTENT_W = SCREEN_W - 96;

interface Step {
  title: string;
  description: string;
}

interface TutorialStepperProps {
  onDismiss: () => void;
}

const TutorialStepper: React.FC<TutorialStepperProps> = ({ onDismiss }) => {
  const { t } = useTranslation();
  const [current, setCurrent] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const connectors = useRef<Animated.Value[]>([]).current;

  const steps: Step[] = [
    { title: t('tutorial.step1Title'), description: t('tutorial.step1Desc') },
    { title: t('tutorial.step2Title'), description: t('tutorial.step2Desc') },
    { title: t('tutorial.step3Title'), description: t('tutorial.step3Desc') },
    { title: t('tutorial.step4Title'), description: t('tutorial.step4Desc') },
    { title: t('tutorial.step5Title'), description: t('tutorial.step5Desc') },
  ];

  // init connector animators lazily
  if (connectors.length === 0) {
    for (let i = 0; i < steps.length - 1; i++) {
      connectors.push(new Animated.Value(0));
    }
  }

  const dismiss = async () => {
    await AsyncStorage.setItem(TUTORIAL_KEY, 'true');
    onDismiss();
  };

  const goNext = () => {
    if (current < steps.length - 1) {
      const next = current + 1;
      // Animate connector
      Animated.timing(connectors[current], { toValue: 1, duration: 300, useNativeDriver: false }).start();
      // Slide content
      Animated.timing(slideAnim, { toValue: -next * CONTENT_W, duration: 280, useNativeDriver: true }).start();
      setCurrent(next);
    } else {
      dismiss();
    }
  };

  const isLast = current === steps.length - 1;

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        {/* Step indicators */}
        <View style={styles.indicators}>
          {steps.map((_, i) => (
            <React.Fragment key={i}>
              <View style={[styles.dot, i <= current && styles.dotActive, i < current && styles.dotDone]}>
                <Text style={[styles.dotText, i <= current && styles.dotTextActive]}>
                  {i < current ? '✓' : String(i + 1)}
                </Text>
              </View>
              {i < steps.length - 1 && (
                <View style={styles.connectorBg}>
                  <Animated.View
                    style={[
                      styles.connectorFill,
                      {
                        width: connectors[i]?.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }) ?? '0%',
                      },
                    ]}
                  />
                </View>
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Sliding content */}
        <View style={styles.contentViewport}>
          <Animated.View style={[styles.contentSlider, { transform: [{ translateX: slideAnim }] }]}>
            {steps.map((step, i) => (
              <View key={i} style={[styles.stepContent, { width: CONTENT_W }]}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.description}</Text>
              </View>
            ))}
          </Animated.View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.skipBtn} onPress={dismiss}>
            <Text style={styles.skipText}>{t('tutorial.skip')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextBtn} onPress={goNext}>
            <Text style={styles.nextText}>{isLast ? t('tutorial.finish') : t('tutorial.next')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  modal: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 24,
    width: SCREEN_W - 48,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.25)',
  },
  indicators: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2D2D44',
    borderWidth: 1.5,
    borderColor: '#3D3D5C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  dotDone: {
    backgroundColor: '#166534',
    borderColor: '#22C55E',
  },
  dotText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666',
  },
  dotTextActive: {
    color: '#fff',
  },
  connectorBg: {
    width: 32,
    height: 2,
    backgroundColor: '#2D2D44',
    overflow: 'hidden',
  },
  connectorFill: {
    height: '100%',
    backgroundColor: '#22C55E',
  },
  contentViewport: {
    overflow: 'hidden',
    width: CONTENT_W,
    minHeight: 80,
    marginBottom: 24,
  },
  contentSlider: {
    flexDirection: 'row',
  },
  stepContent: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  stepTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  stepDesc: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D3D5C',
  },
  skipText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  nextBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#22C55E',
  },
  nextText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default TutorialStepper;
