import React, { ComponentProps } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import Colors from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';

type IoniconsIconProps = Omit<ComponentProps<typeof Ionicons>, 'name'>;

interface SustainabilityScoreProps {
  score: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  style?: ViewStyle;
}

export default function SustainabilityScore({
  score,
  size = 'medium',
  showLabel = true,
  style,
}: SustainabilityScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 75) return Colors.light.success;
    if (score >= 50) return Colors.light.warning;
    return Colors.light.error;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 75) return 'Excellent';
    if (score >= 50) return 'Good';
    if (score >= 25) return 'Fair';
    return 'Poor';
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.smallContainer,
          circle: styles.smallCircle,
          text: styles.smallText,
          label: styles.smallLabel,
          icon: 16,
        };
      case 'large':
        return {
          container: styles.largeContainer,
          circle: styles.largeCircle,
          text: styles.largeText,
          label: styles.largeLabel,
          icon: 28,
        };
      default:
        return {
          container: styles.mediumContainer,
          circle: styles.mediumCircle,
          text: styles.mediumText,
          label: styles.mediumLabel,
          icon: 22,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const scoreColor = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);

  return (
    <View style={[styles.container, sizeStyles.container, style]} testID="sustainability-score">
      <View style={[styles.scoreCircle, sizeStyles.circle, { backgroundColor: scoreColor }]}>
        <Text style={[styles.scoreText, sizeStyles.text]}>{score}</Text>
        <Ionicons name="leaf-outline" size={sizeStyles.icon} color="white" style={styles.leafIcon} />
      </View>

      {showLabel && (
        <Text style={[styles.scoreLabel, sizeStyles.label, { color: scoreColor }]}>
          {scoreLabel}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  scoreCircle: {
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    color: 'white',
    fontWeight: 'bold' as const,
  },
  scoreLabel: {
    fontWeight: '600' as const,
    marginTop: 8,
  },
  leafIcon: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    opacity: 0.5,
  },

  smallContainer: {},
  smallCircle: {
    width: 60,
    height: 60,
  },
  smallText: {
    fontSize: 22,
  },
  smallLabel: {
    fontSize: 12,
  },

  mediumContainer: {},
  mediumCircle: {
    width: 100,
    height: 100,
  },
  mediumText: {
    fontSize: 36,
  },
  mediumLabel: {
    fontSize: 16,
  },

  largeContainer: {},
  largeCircle: {
    width: 150,
    height: 150,
  },
  largeText: {
    fontSize: 48,
  },
  largeLabel: {
    fontSize: 20,
  },
});
