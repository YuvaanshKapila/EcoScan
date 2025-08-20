import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, ActivityIndicator, TextInput, Modal } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import Colors from '@/constants/colors';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useScan } from '@/hooks/scan-store';
import { calculateSustainabilityScore } from '@/data/sustainabilityData';
import { identifyProductByBarcode, getSustainabilityFeedback, processReceiptImage } from '@/lib/ocr';

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
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastScannedCode, setLastScannedCode] = useState<string>('');
  const [showManualInput, setShowManualInput] = useState<boolean>(false);
  const [manualCode, setManualCode] = useState<string>('');

  useEffect(() => {
    if (!permission) return;
    if (!permission.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleLookup = useCallback(async (code: string, detectedType?: string) => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      setLastScannedCode(code);
      
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
    } finally {
      setIsProcessing(false);
    }
  }, [setNewScanResult, isProcessing]);

  const handleBarCodeScanned = useCallback(({ data, type }: { data: string; type: string }) => {
    if (!isScanning || isProcessing) return;
    
    console.log('Barcode scanned:', { data, type });
    setIsScanning(false);
    handleLookup(data, type);
  }, [isScanning, handleLookup, isProcessing]);

  const manualBarcodeInput = useCallback(() => {
    setShowManualInput(true);
  }, []);

  const submitManualCode = useCallback(() => {
    if (manualCode.trim()) {
      setShowManualInput(false);
      setManualCode('');
      handleLookup(manualCode.trim());
    }
  }, [manualCode, handleLookup]);

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
      if (!asset) {
        throw new Error('No image selected');
      }

      if (asset.base64) {
        try {
          const ocrResult = await processReceiptImage(asset.base64);
          if (ocrResult.success && ocrResult.items && ocrResult.items.length > 0) {
            const { matchedItems, totalScore } = calculateSustainabilityScore(ocrResult.items);
            const scan = setNewScanResult(matchedItems, totalScore, ocrResult.storeName, `Receipt processed: ${ocrResult.items.length} items found`);
            if (scan) {
              router.push(`/result?id=${scan.id}`);
            }
          } else {
            Alert.alert('No items found', 'Could not extract product information from the image. Try a clearer image or manual input.');
          }
        } catch (ocrError) {
          console.error('OCR failed:', ocrError);
          Alert.alert('Processing failed', 'Could not process the image. Try manual input or live scanning.');
        }
      }
    } catch (e) {
      console.error('Image decode failed', e);
      Alert.alert('Upload failed', 'Could not process the image. Try manual input or live scanning.');
    } finally {
      setIsDecoding(false);
    }
  }, [setNewScanResult]);

  if (!permission) {
    return (
      <View style={styles.center}> 
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.title}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Camera permission required</Text>
        <Text style={styles.subtitle}>We need camera access to scan barcodes</Text>
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
          <Text style={styles.hint} testID="barcode-hint">
            {isScanning ? 'Align the barcode within the frame' : 'Processing...'}
          </Text>
          {lastScannedCode && (
            <Text style={styles.lastCode}>Last: {lastScannedCode}</Text>
          )}
        </View>
      </CameraView>

      <View style={styles.controls} testID="barcode-controls">
        <TouchableOpacity style={styles.iconBtn} onPress={() => setTorch(v => !v)} testID="torch-toggle">
          <Ionicons name="flashlight" size={22} color={Colors.light.text} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.primaryBtn, isProcessing && styles.disabledBtn]} 
          onPress={() => setIsScanning(true)} 
          disabled={isProcessing}
          testID="rescan-btn"
        >
          <Ionicons name="scan" size={22} color="#fff" />
          <Text style={styles.primaryBtnText}>
            {isProcessing ? 'Processing...' : 'Scan'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.secondaryBtn} 
          onPress={pickImageAndDecode} 
          disabled={isProcessing || isDecoding}
          testID="upload-btn"
        >
          <Ionicons name="image-outline" size={18} color={Colors.light.text} />
          <Text style={styles.secondaryBtnText}>
            {isDecoding ? 'Processing...' : 'Upload'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.iconBtn} 
          onPress={manualBarcodeInput} 
          disabled={isProcessing}
          testID="manual-input-btn"
        >
          <Ionicons name="keypad-outline" size={18} color={Colors.light.text} />
          <Text style={styles.secondaryBtnText}>Manual</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.iconBtn} 
          onPress={() => router.back()} 
          testID="close-btn"
        >
          <Ionicons name="close" size={22} color={Colors.light.text} />
        </TouchableOpacity>
      </View>
      
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.processingText}>Processing barcode...</Text>
        </View>
      )}

      <Modal
        visible={showManualInput}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowManualInput(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Barcode</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter barcode number"
              value={manualCode}
              onChangeText={setManualCode}
              keyboardType="numeric"
              autoFocus={true}
              maxLength={13}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButton} 
                onPress={() => setShowManualInput(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonPrimary]} 
                onPress={submitManualCode}
                disabled={!manualCode.trim()}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  subtitle: { fontSize: 14, color: Colors.light.gray, textAlign: 'center', marginBottom: 24 },
  camera: { flex: 1 },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  frame: { width: '80%', height: 200, borderWidth: 2, borderColor: '#fff', borderStyle: 'dashed' as const, borderRadius: 12 },
  hint: { color: '#fff', marginTop: 12, textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  lastCode: { color: '#fff', marginTop: 8, fontSize: 12, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#111' },
  iconBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 28, backgroundColor: Colors.light.primary },
  primaryBtnText: { color: '#fff', fontWeight: '600' as const, marginLeft: 8 },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 22, backgroundColor: '#222', gap: 6 },
  secondaryBtnText: { color: Colors.light.text, fontWeight: '600' as const, marginLeft: 6 },
  button: { backgroundColor: Colors.light.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, marginTop: 12 },
  buttonText: { color: '#fff', fontWeight: '600' as const },
  disabledBtn: { opacity: 0.6 },
  processingOverlay: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    backgroundColor: 'rgba(0,0,0,0.8)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  processingText: { color: '#fff', marginTop: 16, fontSize: 16, textAlign: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    color: Colors.light.text,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  modalButtonTextPrimary: {
    color: '#fff',
  },
});
