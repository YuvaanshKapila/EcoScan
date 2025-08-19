import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import Colors from '@/constants/colors';
import Button from './Button';

interface EmptyStateProps {
  title: string;
  message: string;

  icon?: React.ReactNode;
  buttonTitle?: string;
  onButtonPress?: () => void;
  style?: ViewStyle;
}

export default function EmptyState({
  title,
  message,
  icon,
  buttonTitle,
  onButtonPress,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]} testID="empty-state">
      {icon && <View style={styles.iconContainer}>{icon}</View>}

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      {buttonTitle && onButtonPress && (
        <Button
          title={buttonTitle}
          onPress={onButtonPress}
          style={styles.button}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: Colors.light.gray,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    minWidth: 150,
  },
});
