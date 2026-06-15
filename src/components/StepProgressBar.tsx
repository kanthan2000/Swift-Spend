import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Radius } from '../theme/colors';

interface Props {
  currentStep: number;
  totalSteps?: number;
}

export default function StepProgressBar({ currentStep, totalSteps = 3 }: Props) {
  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.bar,
            i < currentStep ? styles.active : styles.inactive,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: Radius.pill,
  },
  active: {
    backgroundColor: Colors.primary,
  },
  inactive: {
    backgroundColor: Colors.border,
  },
});
