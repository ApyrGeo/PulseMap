import React, { useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Location } from '@pulse-map/shared';
import { Icons } from '../utils/icons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;

interface ProximityCardStackProps {
  locations: Location[];
  onConfirm: (location: Location) => void;
  onDismiss: (location: Location) => void;
  onReport: (location: Location) => void;
}

function ProximityCard({
  location,
  index,
  onConfirm,
  onDismiss,
  onReport,
}: {
  location: Location;
  index: number;
  onConfirm: (l: Location) => void;
  onDismiss: (l: Location) => void;
  onReport: (l: Location) => void;
}) {
  const opacity = useRef(new Animated.Value(1)).current;

  const animateAndCall = (cb: () => void) => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(cb);
  };

  const translateY = index * 8;
  const scale = 1 - index * 0.03;

  return (
    <Animated.View
      style={[
        styles.card,
        {
          transform: [{ translateY }, { scale }],
          zIndex: 10 - index,
          opacity: index === 0 ? opacity : 0.85 - index * 0.15,
        },
      ]}
      pointerEvents={index === 0 ? 'auto' : 'none'}
    >
      <View style={styles.cardContent}>
        <View style={styles.nearbyLabelRow}>
          <Image source={Icons.location} style={styles.nearbyIcon} />
          <Text style={styles.nearbyLabel}>Ești în apropiere</Text>
        </View>
        <Text style={styles.locationName}>{location.name}</Text>
        {location.category ? (
          <Text style={styles.category}>{location.category}</Text>
        ) : null}

        {/* Primary action — full width */}
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={() => animateAndCall(() => onConfirm(location))}
        >
          <Text style={styles.confirmText}>Am fost aici</Text>
        </TouchableOpacity>

        {/* Secondary actions — two small buttons in a row */}
        <View style={styles.secondaryRow}>
          <TouchableOpacity
            style={[styles.smallBtn, styles.dismissBtn]}
            onPress={() => animateAndCall(() => onDismiss(location))}
          >
            <Text style={styles.dismissText}>Ignoră</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.smallBtn, styles.reportBtn]}
            onPress={() => animateAndCall(() => onReport(location))}
          >
            <Text style={styles.reportText}>⚑ Nu există</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

export default function ProximityCardStack({
  locations,
  onConfirm,
  onDismiss,
  onReport,
}: ProximityCardStackProps) {
  if (locations.length === 0) return null;

  const visible = locations.slice(0, 3);

  return (
    <View style={styles.container} pointerEvents="box-none">
      {[...visible].reverse().map((location, revIdx) => {
        const index = visible.length - 1 - revIdx;
        return (
          <ProximityCard
            key={location.id}
            location={location}
            index={index}
            onConfirm={onConfirm}
            onDismiss={onDismiss}
            onReport={onReport}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    height: 190,
  },
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FF6B35',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardContent: {
    padding: 16,
  },
  nearbyLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  nearbyIcon: { width: 14, height: 14, tintColor: '#FF6B35' },
  nearbyLabel: { fontSize: 12, color: '#FF6B35', fontWeight: '600' },
  locationName: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 2 },
  category: { fontSize: 13, color: '#8E8E8E', marginBottom: 10 },

  confirmBtn: {
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  confirmText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  secondaryRow: { flexDirection: 'row', gap: 8 },
  smallBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  dismissBtn: { backgroundColor: '#2D2D44' },
  dismissText: { color: '#8E8E8E', fontWeight: '600', fontSize: 13 },
  reportBtn: { backgroundColor: '#2D0A0A', borderWidth: 1, borderColor: '#EF444433' },
  reportText: { color: '#EF4444', fontWeight: '600', fontSize: 13 },
});
