import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import Colors from '@/constants/colors';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useScan } from '@/hooks/scan-store';
import { calculateSustainabilityScore } from '@/data/sustainabilityData';
import { BrowserMultiFormatReader, Result } from '@zxing/library';
import { identifyProductByBarcode, getSustainabilityFeedback } from '@/lib/ocr';

interface BarcodeResult {
  format: 'UPC' | 'EAN' | 'ISBN' | 'JAN' | 'UNKNOWN';
  code: string;
}

export default function BarcodeScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const [torch, setTorch] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const { setNewScanResult } = useScan();
  const [isDecoding, setIsDecoding] = useState<boolean>(false);

  useEffect(() => {
    if (!permission) return;
    if (!permission.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleLookup = useCallback(async (code: string, detectedType?: string) => {
    try {
      const format: BarcodeResult['format'] = inferFormatFromType(detectedType) ?? inferFormat(code);

      const ai = await identifyProductByBarcode(code, format);
      const name = ai.success && ai.productName ? ai.productName : inferProductName(format);

      const { matchedItems, totalScore } = calculateSustainabilityScore([name]);

      let feedback: string | undefined = undefined;
      try {
        const aiTips = await getSustainabilityFeedback([name]);
        const metaLines = [
          `Detected ${format}: ${code}`,
          `Product: ${name}${ai.brand ? ` (${ai.brand})` : ''}`,
          ai.likelyCategory ? `Category: ${ai.likelyCategory}` : undefined,
          typeof ai.confidence === 'number' ? `Confidence: ${(ai.confidence * 100).toFixed(0)}%` : undefined,
        ].filter(Boolean).join('\n');
        feedback = `${metaLines}\n\n${aiTips}`;
      } catch (err) {
        console.log('feedback failed', err);
        feedback = `Detected ${format}: ${code}\nProduct: ${name}`;
      }

      const scan = setNewScanResult(matchedItems, totalScore, undefined, feedback);
      if (scan) {
        router.push(`/result?id=${scan.id}`);
      } else {
        throw new Error('Failed to create scan');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Lookup failed', 'Unable to process this barcode right now.');
      setIsScanning(true);
    }
  }, [setNewScanResult]);

  const handleBarCodeScanned = useCallback(({ data, type }: { data: string; type: string }) => {
    if (!isScanning) return;
    setIsScanning(false);
    handleLookup(data, type);
  }, [isScanning, handleLookup]);

  const pickImageAndDecode = useCallback(async () => {
    try {
      setIsDecoding(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
        base64: true,
      });

      if (result.canceled) {
        setIsDecoding(false);
        return;
      }

      const asset = result.assets?.[0];
      const base64 = asset?.base64 ?? '';
      const uri = asset?.uri ?? '';

      if (!asset || (!base64 && !uri)) {
        throw new Error('No image selected');
      }

      if (Platform.OS === 'web') {
        const code = await decodeBarcodeFromImageWeb(uri || `data:${asset.mimeType ?? 'image/jpeg'};base64,${base64}`);
        if (!code) throw new Error('No barcode detected in image');
        await handleLookup(code);
      } else {
        Alert.alert('Not supported yet', 'Decoding barcodes from still images is currently supported on web. Use live camera scan on mobile.');
      }
    } catch (e) {
      console.error('Image decode failed', e);
      Alert.alert('Decode failed', 'Could not read a barcode from the selected image. Try another image or use live scan.');
      setIsScanning(true);
    } finally {
      setIsDecoding(false);
    }
  }, [handleLookup]);

  async function decodeBarcodeFromImageWeb(src: string): Promise<string | null> {
    try {
      const reader = new BrowserMultiFormatReader();
      const result: Result = await reader.decodeFromImageUrl(src);
      return result.getText();
    } catch (err) {
      console.log('ZXing decode error', err);
      return null;
    }
  }

  if (!permission) {
    return (
      <View style={styles.center}> 
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Camera permission required</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        onBarcodeScanned={isScanning ? handleBarCodeScanned : undefined}
        barcodeScannerSettings={{
          barcodeTypes: ['upc_a', 'upc_e', 'ean13', 'ean8', 'code128', 'code39', 'itf14', 'codabar'] as any,
        }}
        enableTorch={torch}
        testID="barcode-camera"
      >
        <View style={styles.overlay}>
          <View style={styles.frame} />
          <Text style={styles.hint} testID="barcode-hint">Align the barcode within the frame</Text>
        </View>
      </CameraView>

      <View style={styles.controls} testID="barcode-controls">
        <TouchableOpacity style={styles.iconBtn} onPress={() => setTorch(v => !v)} testID="torch-toggle">
          <Ionicons name="flashlight" size={22} color={Colors.light.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => setIsScanning(true)} testID="rescan-btn">
          <Ionicons name="scan" size={22} color="#fff" />
          <Text style={styles.primaryBtnText}>Scan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={pickImageAndDecode} disabled={isDecoding} testID="upload-image-btn">
          <Ionicons name="cloud-upload-outline" size={18} color={Colors.light.text} />
          <Text style={styles.secondaryBtnText}>{isDecoding ? 'Reading...' : 'Upload image'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()} testID="close-btn">
          <Ionicons name="close" size={22} color={Colors.light.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function inferFormat(code: string): BarcodeResult['format'] {
  if (/^\d{12}$/.test(code)) return 'UPC';
  if (/^\d{8}$/.test(code)) return 'EAN';
  if (/^\d{13}$/.test(code)) return 'EAN';
  if (/^(97(8|9))?\d{9}(\d|X)$/.test(code)) return 'ISBN';
  if (/^\d{8}$/.test(code) || /^\d{13}$/.test(code)) return 'JAN';
  return 'UNKNOWN';
}

function inferFormatFromType(type?: string): BarcodeResult['format'] | null {
  if (!type) return null;
  const t = type.toLowerCase();
  if (t.startsWith('upc')) return 'UPC';
  if (t.startsWith('ean')) return 'EAN';
  if (t.startsWith('isbn')) return 'ISBN';
  if (t.includes('jan')) return 'JAN';
  return null;
}

function inferProductName(format: BarcodeResult['format']): string {
  if (format === 'ISBN') return 'book';
  return 'product';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 18, fontWeight: '600' as const, color: Colors.light.text, marginBottom: 12 },
  camera: { flex: 1 },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  frame: { width: '80%', height: 200, borderWidth: 2, borderColor: '#fff', borderStyle: 'dashed' as const, borderRadius: 12 },
  hint: { color: '#fff', marginTop: 12 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#111' },
  iconBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 28, backgroundColor: Colors.light.primary },
  primaryBtnText: { color: '#fff', fontWeight: '600' as const, marginLeft: 8 },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 22, backgroundColor: '#222', gap: 6 },
  secondaryBtnText: { color: Colors.light.text, fontWeight: '600' as const, marginLeft: 6 },
  button: { backgroundColor: Colors.light.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, marginTop: 12 },
  buttonText: { color: '#fff', fontWeight: '600' as const },
});
