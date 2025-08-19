import React, { ComponentProps } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { ScannedItem, ScanResult } from '@/types';
import Colors from '@/constants/colors';
import { formatDate } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';

type IoniconsIconProps = Omit<ComponentProps<typeof Ionicons>, 'name'>;

interface ScanResultCardProps {
  scan: ScanResult;
  onPress?: () => void;
  compact?: boolean;
}

export default function ScanResultCard({
  scan,
  onPress,
  compact = false
}: ScanResultCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 75) return Colors.light.success;
    if (score >= 50) return Colors.light.warning;
    return Colors.light.error;
  };

  const scoreColor = getScoreColor(scan.totalScore);

  const renderItemsList = () => {
    if (compact) {
      const itemCount = scan.items.length;
      return (
        <Text style={styles.itemsCount}>
          {itemCount} {itemCount === 1 ? 'item' : 'items'} scanned
        </Text>
      );
    }

    return (
      <View style={styles.itemsList}>
        {scan.items.slice(0, 3).map((item, index) => (
          <Text key={index} style={styles.itemText} numberOfLines={1} ellipsizeMode="tail">
            • {item.name}
          </Text>
        ))}
        {scan.items.length > 3 && (
          <Text style={styles.moreItems}>
            +{scan.items.length - 3} more items
          </Text>
        )}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[styles.container, compact && styles.compactContainer]}
      onPress={onPress}
      disabled={!onPress}
      testID="scan-result-card"
    >
      <View style={styles.contentContainer}>
        <View style={styles.scoreContainer}>
          <View style={[styles.scoreCircle, { backgroundColor: scoreColor }]}>
            <Text style={styles.scoreText}>{scan.totalScore}</Text>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.dateText}>{formatDate(scan.createdAt)}</Text>
          {renderItemsList()}
        </View>

        {scan.imageUrl && !compact && (
          <Image
            source={{ uri: scan.imageUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        )}

        {onPress && (
          <View style={styles.arrowContainer}>
            <Ionicons name="chevron-forward-outline" size={20} color={Colors.light.gray} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  compactContainer: {
    padding: 12,
    marginBottom: 12,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreContainer: {
    marginRight: 16,
  },
  scoreCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold' as const,
  },
  detailsContainer: {
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
    color: Colors.light.text,
  },
  itemsList: {
    marginTop: 4,
  },
  itemText: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 2,
  },
  itemsCount: {
    fontSize: 14,
    color: Colors.light.gray,
  },
  moreItems: {
    fontSize: 14,
    color: Colors.light.gray,
    marginTop: 2,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginLeft: 12,
  },
  arrowContainer: {
    marginLeft: 8,
  },
});
