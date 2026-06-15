import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Radius } from '../theme/colors';

interface Props {
  currentStep: number;
  totalSteps?: number;
}

export default function PaginationDots({ currentStep, totalSteps = 3 }: Props) {
  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }).map((_, i) => (
        <View
          key={i}
          style={[
            i === currentStep - 1 ? styles.activeDot : styles.dot,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  activeDot: {
    width: 24,
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
});
