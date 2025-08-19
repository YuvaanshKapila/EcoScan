import React, { ComponentProps } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useScan } from '@/hooks/scan-store';
import Colors from '@/constants/colors';
import ScanResultCard from '@/components/ScanResultCard';
import EmptyState from '@/components/EmptyState';
import { Ionicons } from '@expo/vector-icons';

type IoniconsIconProps = Omit<ComponentProps<typeof Ionicons>, 'name'>;

const CameraIcon = (props: IoniconsIconProps) => <Ionicons name="camera-outline" {...props} />;
const SearchIcon = (props: IoniconsIconProps) => <Ionicons name="search-outline" {...props} />;


export default function HistoryScreen() {
  const { scanHistory, isLoadingHistory } = useScan();

  const handleScanPress = () => {
    router.push('/scan');
  };

  const handleViewScanResult = (scanId: string) => {
    router.push(`/result?id=${scanId}`);
  };

  if (isLoadingHistory) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Loading scan history...</Text>
      </View>
    );
  }

  if (scanHistory.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          title="No Scan History"
          message="You haven't scanned any receipts yet. Start scanning to track your sustainability impact."
          icon={<CameraIcon size={48} color={Colors.light.gray} />}
          buttonTitle="Scan Now"
          onButtonPress={handleScanPress}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={scanHistory}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ScanResultCard
            scan={item}
            onPress={() => handleViewScanResult(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Scan History</Text>
            <Text style={styles.subtitle}>
              {scanHistory.length} {scanHistory.length === 1 ? 'scan' : 'scans'} recorded
            </Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No Results Found"
            message="Try scanning a receipt to get started."
            icon={<SearchIcon size={48} color={Colors.light.gray} />}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  loadingText: {
    marginTop: 16,
    color: Colors.light.gray,
    fontSize: 16,
  },
  listContent: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.gray,
  },
});
