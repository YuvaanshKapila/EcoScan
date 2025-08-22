import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { router } from 'expo-router';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/hooks/auth-store';
import { useScan } from '@/hooks/scan-store';
import { processReceiptImage, getSustainabilityFeedback, getStoreRecommendationsForItems } from '@/lib/ocr';
import { calculateSustainabilityScore } from '@/data/sustainabilityData';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import { Ionicons } from '@expo/vector-icons';

export default function ScanScreen() {
  const { user } = useAuth();
  const { uploadImage, setNewScanResult, isUploading } = useScan();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const cameraRef = useRef<any>(null);
  
  useEffect(() => {
    if (!user) {
      router.replace('/auth/login');
    }
  }, [user]);
  
  useEffect(() => {
    const requestPermissions = async () => {
      await requestCameraPermission();
    };
    requestPermissions();
  }, [requestCameraPermission]);
  
  const takePicture = async () => {
    if (!cameraRef.current) return;
    
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });
      
      setCapturedImage(photo.uri);
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
    }
  };
  
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCapturedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };
  
  const resetImage = () => {
    setCapturedImage(null);
  };
  
  const processReceipt = async () => {
    if (!capturedImage || !user) return;
    
    try {
      setIsProcessing(true);
      
      setProcessingStep('Preparing image...');
      let base64Image = '';
      
      if (Platform.OS === 'web') {
        const response = await fetch(capturedImage);
        const blob = await response.blob();
        const reader = new FileReader();
        
        base64Image = await new Promise((resolve) => {
          reader.onloadend = () => {
            if (typeof reader.result === 'string') {
              resolve(reader.result);
            }
          };
          reader.readAsDataURL(blob);
        });
      } else {
        const response = await fetch(capturedImage);
        const blob = await response.blob();
        
        const fileReaderInstance = new FileReader();
        base64Image = await new Promise((resolve) => {
          fileReaderInstance.onload = () => {
            const base64data = fileReaderInstance.result;
            resolve(base64data as string);
          };
          fileReaderInstance.readAsDataURL(blob);
        });
      }
      
      setProcessingStep('Uploading image...');
      const imageUrl = await uploadImage(base64Image);
      
      setProcessingStep('Analyzing receipt with AI...');
      const ocrResult = await processReceiptImage(base64Image);
      
      if (!ocrResult.success) {
        throw new Error(ocrResult.error || 'OCR processing failed');
      }
      
      console.log('OCR Result:', ocrResult);
      const items = ocrResult.items || [];
      console.log('Extracted items:', items);
      
      if (items.length === 0) {
        Alert.alert(
          'No Items Found',
          'Could not identify any items from the receipt. Please try again with a clearer image.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      setProcessingStep('Calculating sustainability score...');
      const { matchedItems, totalScore } = calculateSustainabilityScore(items);
      console.log('Matched items:', matchedItems);
      console.log('Total score:', totalScore);
      
      setProcessingStep('Finding nearby eco-friendly stores...');
      const storeRecommendations = await getStoreRecommendationsForItems(items);
      
      setProcessingStep('Getting sustainability feedback...');
      const feedback = await getSustainabilityFeedback(items);
      
      const scanResult = setNewScanResult(
        matchedItems, 
        totalScore, 
        imageUrl || undefined, 
        feedback,
        storeRecommendations.success ? storeRecommendations.stores : undefined,
        storeRecommendations.success ? storeRecommendations.userLocation : undefined
      );
      
      if (scanResult) {
        router.push(`/result?id=${scanResult.id}`);
      } else {
        throw new Error('Failed to create scan result');
      }
    } catch (error) {
      console.error('Error processing receipt:', error);
      Alert.alert(
        'Processing Error',
        'Failed to process the receipt. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };
  
  if (!cameraPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }
  
  if (!cameraPermission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Camera Permission Required</Text>
        <Text style={styles.permissionText}>
          We need camera permission to scan receipts. Please grant permission to continue.
        </Text>
        <Button
          title="Grant Permission"
          onPress={requestCameraPermission}
          style={styles.permissionButton}
        />
      </View>
    );
  }
  
  if (isProcessing) {
    return (
      <View style={styles.processingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.processingText}>{processingStep || 'Processing...'}</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {capturedImage ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedImage }} style={styles.previewImage} />
          
          <View style={styles.previewActions}>
            <Button
              title="Scan Again"
              onPress={resetImage}
              variant="outline"
              style={styles.previewButton}
            />
            <Button
              title="Process Receipt"
              onPress={processReceipt}
              isLoading={isUploading}
              style={styles.previewButton}
            />
          </View>
        </View>
      ) : (
        <>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={facing}
            testID="camera-view"
          >
            <View style={styles.cameraOverlay}>
              <View style={styles.receiptFrame} />
              <Text style={styles.instructionText}>
                Position your receipt within the frame
              </Text>
            </View>
          </CameraView>
          
          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={styles.galleryButton}
              onPress={pickImage}
              testID="gallery-button"
            >
              <Ionicons name="image" size={24} color={Colors.light.text} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePicture}
              testID="capture-button"
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.flipButton}
              onPress={() => setFacing(current => (current === 'back' ? 'front' : 'back'))}
              testID="flip-button"
            >
              <Ionicons name="camera-reverse" size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.light.background,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: Colors.light.text,
    marginBottom: 16,
  },
  permissionText: {
    fontSize: 16,
    color: Colors.light.gray,
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    minWidth: 200,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptFrame: {
    width: '80%',
    height: '70%',
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 8,
    borderStyle: 'dashed' as const,
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'black',
    paddingVertical: 20,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.light.primary,
    borderWidth: 2,
    borderColor: 'white',
  },
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  previewImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: 'white',
  },
  previewButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    padding: 24,
  },
  processingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.light.text,
    textAlign: 'center',
  },
});
