import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Share
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '@/hooks/auth-store';
import { useScan } from '@/hooks/scan-store';
import { ScannedItem, ScanResult } from '@/types';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import SustainabilityScore from '@/components/SustainabilityScore';
import { formatDateTime } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';

// Use a type for props that excludes the 'name' property
type IoniconsIconProps = Omit<ComponentProps<typeof Ionicons>, 'name'>;

// Create aliases for the icons using Ionicons with the correct names
const Leaf = (props: IoniconsIconProps) => <Ionicons name="leaf-outline" {...props} />;
const AlertTriangle = (props: IoniconsIconProps) => <Ionicons name="warning-outline" {...props} />;
const CheckCircle2 = (props: IoniconsIconProps) => <Ionicons name="checkmark-circle-outline" {...props} />;

export default function ResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const {
    scanHistory,
    currentScan,
    saveCurrentScan,
    isSaving
  } = useScan();
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace('/auth/login');
      return;
    }

    if (!id) {
      router.back();
      return;
    }

    // Check if this is the current scan
    if (currentScan && currentScan.id === id) {
      setScan(currentScan);
      setIsSaved(false);
      return;
    }

    // Check if this is a saved scan from history
    const historyScan = scanHistory.find((s: ScanResult) => s.id === id);
    if (historyScan) {
      setScan(historyScan);
      setIsSaved(true);
      return;
    }

    // If not found, go back
    Alert.alert('Error', 'Scan result not found');
    router.back();
  }, [id, currentScan, scanHistory, user]);

  const handleSave = async () => {
    try {
      if (!currentScan) return;

      const savedScan = await saveCurrentScan();
      if (savedScan) {
        setIsSaved(true);
        Alert.alert('Success', 'Scan saved successfully!');
      }
    } catch (error) {
      console.error('Error saving scan:', error);
      Alert.alert('Error', 'Failed to save scan. Please try again.');
    }
  };

  const handleShare = async () => {
    if (!scan) return;

    try {
      const message = `My EcoScan Sustainability Score: ${scan.totalScore}/100\n\n` +
        `Items scanned:\n${scan.items.map(item => `• ${item.name} (${item.impact} impact)`).join('\n')}\n\n` +
        'Scanned with EcoScan - Make sustainable shopping choices!';

      await Share.share({
        message,
        title: 'My EcoScan Results',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleScanAgain = () => {
    router.push('/scan');
  };

  if (!scan) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Loading scan results...</Text>
      </View>
    );
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'low':
        return Colors.light.success;
      case 'medium':
        return Colors.light.warning;
      case 'high':
        return Colors.light.error;
      default:
        return Colors.light.gray;
    }
  };

  const renderItemRow = (item: ScannedItem, index: number) => (
    <View key={index} style={styles.itemRow}>
      <View style={styles.itemNameContainer}>
        <View
          style={[
            styles.impactIndicator,
            { backgroundColor: getImpactColor(item.impact) }
          ]}
        />
        <Text style={styles.itemName}>{item.name}</Text>
      </View>

      <View style={styles.itemScoreContainer}>
        <Text style={styles.itemScore}>{item.score}</Text>
      </View>
    </View>
  );

  // Group items by impact
  const highImpactItems = scan.items.filter(item => item.impact === 'high');
  const mediumImpactItems = scan.items.filter(item => item.impact === 'medium');
  const lowImpactItems = scan.items.filter(item => item.impact === 'low');

  // Get alternatives for high impact items
  const alternatives = highImpactItems
    .filter(item => item.alternatives && item.alternatives.length > 0)
    .map(item => ({
      name: item.name,
      alternatives: item.alternatives
    }));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan Results</Text>
        <Text style={styles.timestamp}>{formatDateTime(scan.createdAt)}</Text>
      </View>

      <View style={styles.scoreCard}>
        <SustainabilityScore score={scan.totalScore} size="large" />

        <View style={styles.scoreBreakdown}>
          <Text style={styles.scoreBreakdownTitle}>Score Breakdown</Text>

          <View style={styles.breakdownItem}>
            <View style={styles.breakdownIndicator}>
              <View
                style={[styles.indicatorDot, { backgroundColor: Colors.light.error }]}
              />
              <Text style={styles.breakdownLabel}>High Impact</Text>
            </View>
            <Text style={styles.breakdownValue}>{highImpactItems.length} items</Text>
          </View>

          <View style={styles.breakdownItem}>
            <View style={styles.breakdownIndicator}>
              <View
                style={[styles.indicatorDot, { backgroundColor: Colors.light.warning }]}
              />
              <Text style={styles.breakdownLabel}>Medium Impact</Text>
            </View>
            <Text style={styles.breakdownValue}>{mediumImpactItems.length} items</Text>
          </View>

          <View style={styles.breakdownItem}>
            <View style={styles.breakdownIndicator}>
              <View
                style={[styles.indicatorDot, { backgroundColor: Colors.light.success }]}
              />
              <Text style={styles.breakdownLabel}>Low Impact</Text>
            </View>
            <Text style={styles.breakdownValue}>{lowImpactItems.length} items</Text>
          </View>
        </View>
      </View>

      {scan.imageUrl && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: scan.imageUrl }} style={styles.receiptImage} />
        </View>
      )}

      <View style={styles.itemsContainer}>
        <Text style={styles.sectionTitle}>Scanned Items</Text>

        <View style={styles.itemsHeader}>
          <Text style={styles.itemsHeaderText}>Item</Text>
          <Text style={styles.itemsHeaderText}>Score</Text>
        </View>

        <View style={styles.itemsList}>
          {scan.items.length > 0 ? (
            scan.items.map((item, index) => renderItemRow(item, index))
          ) : (
            <Text style={styles.noItemsText}>No items detected</Text>
          )}
        </View>
      </View>

      {alternatives.length > 0 && (
        <View style={styles.alternativesContainer}>
          <View style={styles.alternativesHeader}>
            <Leaf size={20} color={Colors.light.primary} />
            <Text style={styles.alternativesTitle}>Eco-Friendly Alternatives</Text>
          </View>

          {alternatives.map((item, index) => (
            <View key={index} style={styles.alternativeItem}>
              <View style={styles.alternativeItemHeader}>
                <AlertTriangle size={16} color={Colors.light.error} />
                <Text style={styles.alternativeItemName}>{item.name}</Text>
              </View>

              <View style={styles.alternativesList}>
                {item.alternatives.map((alt, altIndex) => (
                  <View key={altIndex} style={styles.alternativeOption}>
                    <CheckCircle2 size={16} color={Colors.light.success} />
                    <Text style={styles.alternativeOptionText}>{alt}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}

      {scan.feedback && (
        <View style={styles.feedbackContainer}>
          <View style={styles.feedbackHeader}>
            <Leaf size={20} color={Colors.light.primary} />
            <Text style={styles.feedbackTitle}>AI Sustainability Insights</Text>
          </View>
          <Text style={styles.feedbackText}>{scan.feedback}</Text>
        </View>
      )}

      <View style={styles.actionsContainer}>
        {!isSaved && currentScan && (
          <Button
            title="Save Result"
            onPress={handleSave}
            isLoading={isSaving}
            style={styles.actionButton}
            testID="save-button"
          />
        )}

        <Button
          title="Share Results"
          onPress={handleShare}
          variant="outline"
          style={styles.actionButton}
          testID="share-button"
        />

        <Button
          title="Scan Another Receipt"
          onPress={handleScanAgain}
          variant={isSaved ? 'primary' : 'outline'}
          style={styles.actionButton}
          testID="scan-again-button"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.light.gray,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 14,
    color: Colors.light.gray,
  },
  scoreCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  scoreBreakdown: {
    width: '100%',
    marginTop: 24,
  },
  scoreBreakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  breakdownIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicatorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    color: Colors.light.text,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  imageContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  receiptImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'contain',
  },
  itemsContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.lightGray,
    marginBottom: 8,
  },
  itemsHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.gray,
  },
  itemsList: {
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.lightGray,
  },
  itemNameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  impactIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  itemName: {
    fontSize: 16,
    color: Colors.light.text,
  },
  itemScoreContainer: {
    backgroundColor: Colors.light.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 40,
    alignItems: 'center',
  },
  itemScore: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  noItemsText: {
    textAlign: 'center',
    color: Colors.light.gray,
    padding: 16,
  },
  alternativesContainer: {
    backgroundColor: Colors.light.lightGreen,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  alternativesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  alternativesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 8,
  },
  alternativeItem: {
    marginBottom: 16,
  },
  alternativeItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alternativeItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginLeft: 8,
  },
  alternativesList: {
    marginLeft: 24,
  },
  alternativeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alternativeOptionText: {
    fontSize: 14,
    color: Colors.light.text,
    marginLeft: 8,
  },
  actionsContainer: {
    marginBottom: 24,
  },
  actionButton: {
    marginBottom: 12,
  },
  feedbackContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 8,
  },
  feedbackText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.text,
  },
});