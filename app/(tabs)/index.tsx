import React, { useEffect, ComponentProps } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/auth-store';
import { useScan } from '@/hooks/scan-store';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import SustainabilityScore from '@/components/SustainabilityScore';
import ScanResultCard from '@/components/ScanResultCard';
import EmptyState from '@/components/EmptyState';
import { Ionicons } from '@expo/vector-icons';
import type { ScanResult } from '@/types';

type IoniconsIconProps = Omit<ComponentProps<typeof Ionicons>, 'name'>;

const CameraIcon = (props: IoniconsIconProps) => <Ionicons name="camera-outline" {...props} />;
const HistoryIcon = (props: IoniconsIconProps) => <Ionicons name="time-outline" {...props} />;
const LeafIcon = (props: IoniconsIconProps) => <Ionicons name="leaf-outline" {...props} />;

export default function HomeScreen() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { 
    scanHistory, 
    isLoadingHistory 
  } = useScan();

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace('/auth/login');
    }
  }, [user, isAuthLoading]);

  if (isAuthLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return null; 
  }

  const handleScanPress = () => {
    router.push('/scan');
  };

  const handleViewHistory = () => {
    router.push('/history');
  };

  const handleViewScanResult = (scanId: string) => {
    router.push(`/result?id=${scanId}`);
  };

  const calculateAverageScore = () => {
    if (!scanHistory || scanHistory.length === 0) return 0;
    
    const total = scanHistory.reduce((sum: number, scan: ScanResult) => sum + scan.totalScore, 0);
    return Math.round(total / scanHistory.length);
  };

  const averageScore = calculateAverageScore();
  const recentScans = scanHistory.slice(0, 3);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.emailText}>{user.email}</Text>
        </View>
        <View style={styles.logoContainer}>
          <LeafIcon size={24} color={Colors.light.primary} />
        </View>
      </View>
      
      <View style={styles.scoreOverviewCard}>
        <Text style={styles.scoreTitle}>Your Sustainability Score</Text>
        <View style={styles.scoreContent}>
          <SustainabilityScore score={averageScore} size="large" />
          <View style={styles.scoreInfo}>
            <Text style={styles.scoreInfoText}>
              Based on {scanHistory.length} {scanHistory.length === 1 ? 'scan' : 'scans'}
            </Text>
            <Text style={styles.scoreInfoDescription}>
              {averageScore >= 75 
                ? 'Great job! Your shopping habits are eco-friendly.'
                : averageScore >= 50
                ? 'Good progress! There\'s room for improvement.'
                : 'Let\'s work on making more sustainable choices.'}
            </Text>
          </View>
        </View>
      </View>
      
      <Button
        title="Scan New Receipt"
        onPress={handleScanPress}
        style={styles.scanButton}
        size="large"
        testID="scan-button"
      />
      
      <View style={styles.recentScansContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Scans</Text>
          <TouchableOpacity onPress={handleViewHistory} style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All</Text>
            <HistoryIcon size={16} color={Colors.light.primary} />
          </TouchableOpacity>
        </View>
        
        {isLoadingHistory ? (
          <Text style={styles.loadingText}>Loading recent scans...</Text>
        ) : recentScans.length > 0 ? (
        recentScans.map((scan: ScanResult) => (
          <ScanResultCard
            key={scan.id}
            scan={scan}
            onPress={() => handleViewScanResult(scan.id)}
          />
        ))
        ) : (
          <EmptyState
            title="No Scans Yet"
            message="Start scanning receipts to track your sustainability impact."
            icon={<CameraIcon size={48} color={Colors.light.gray} />}
            buttonTitle="Scan Now"
            onButtonPress={handleScanPress}
            style={styles.emptyState}
          />
        )}
      </View>
      
      <View style={styles.tipCard}>
        <View style={styles.tipIconContainer}>
          <LeafIcon size={24} color="white" />
        </View>
        <View style={styles.tipContent}>
          <Text style={styles.tipTitle}>Eco Tip</Text>
          <Text style={styles.tipText}>
            Bring reusable bags to the store to reduce plastic waste and improve your sustainability score.
          </Text>
        </View>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 16,
    color: Colors.light.gray,
  },
  emailText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.lightGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreOverviewCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 16,
  },
  scoreContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreInfo: {
    flex: 1,
    marginLeft: 16,
  },
  scoreInfoText: {
    fontSize: 14,
    color: Colors.light.gray,
    marginBottom: 8,
  },
  scoreInfoDescription: {
    fontSize: 16,
    color: Colors.light.text,
    lineHeight: 22,
  },
  scanButton: {
    marginBottom: 24,
  },
  recentScansContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: Colors.light.primary,
    marginRight: 4,
  },
  loadingText: {
    textAlign: 'center',
    color: Colors.light.gray,
    marginVertical: 16,
  },
  emptyState: {
    marginVertical: 16,
  },
  tipCard: {
    backgroundColor: Colors.light.lightGreen,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  tipIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
});
