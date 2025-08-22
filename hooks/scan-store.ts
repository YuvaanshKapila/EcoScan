import { supabase } from '@/lib/supabase';
import { ScannedItem, ScanResult, NearbyStore, LocationResult } from '@/types';
import { useAuth } from '@/hooks/auth-store';
import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const [ScanProvider, useScan] = createContextHook(() => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentScan, setCurrentScan] = useState<ScanResult | null>(null);

  const scanHistoryQuery = useQuery({
    queryKey: ['scanHistory', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('scan_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data.map(scan => ({
        ...scan,
        totalScore: parseFloat(scan.total_score),
        createdAt: scan.created_at ? new Date(scan.created_at).toISOString() : new Date().toISOString()
      })) as ScanResult[];
    },
    enabled: !!user,
  });

  const saveScanMutation = useMutation({
    mutationFn: async (scanResult: Omit<ScanResult, 'id' | 'createdAt'>) => {
      if (!user) throw new Error('User not authenticated');
      
      const sanitizedScore = isNaN(scanResult.totalScore) ? 0 : scanResult.totalScore;
      
      const newScan: ScanResult = {
        id: `scan_${Date.now()}`,
        userId: user.id,
        items: scanResult.items,
        totalScore: sanitizedScore,
        imageUrl: scanResult.imageUrl,
        feedback: scanResult.feedback,
        nearbyStores: scanResult.nearbyStores,
        userLocation: scanResult.userLocation,
        createdAt: new Date().toISOString(),
      };
      
      const dbScan: any = {
        user_id: user.id,
        items: scanResult.items,
        total_score: sanitizedScore, 
        image_url: scanResult.imageUrl,
        feedback: scanResult.feedback,
        created_at: new Date().toISOString(),
      };
      

      if (scanResult.nearbyStores) {
        dbScan.nearby_stores = scanResult.nearbyStores;
      }
      if (scanResult.userLocation) {
        dbScan.user_location = scanResult.userLocation;
      }
      
      const { data, error } = await supabase
        .from('scan_results')
        .insert(dbScan)
        .select()
        .single();
      
      if (error) throw error;
      return data as ScanResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scanHistory', user?.id] });
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: async ({ base64Image, fileName }: { base64Image: string, fileName: string }) => {
      if (!user) throw new Error('User not authenticated');
      
      const base64Data = base64Image.includes('base64,') 
        ? base64Image.split('base64,')[1] 
        : base64Image;
      
      const byteCharacters = atob(base64Data);
      const byteArrays = [];
      
      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }
      
      const blob = new Blob(byteArrays, { type: 'image/jpeg' });
      
      const filePath = `${user.id}/${fileName}`;
      const { data, error } = await supabase.storage
        .from('receipt_images')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: true,
        });
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('receipt_images')
        .getPublicUrl(filePath);
      
      return publicUrl;
    },
  });

  const saveCurrentScan = async () => {
    if (!currentScan || !user) return null;
    
    try {
      const result = await saveScanMutation.mutateAsync({
        userId: user.id,
        items: currentScan.items,
        totalScore: currentScan.totalScore,
        imageUrl: currentScan.imageUrl,
        feedback: currentScan.feedback,
        nearbyStores: currentScan.nearbyStores,
        userLocation: currentScan.userLocation,
      });
      
      setCurrentScan(null);
      return result;
    } catch (error) {
      console.error('Error saving scan:', error);
      throw error;
    }
  };

  const uploadImage = async (base64Image: string) => {
    if (!user) return null;
    
    try {
      const fileName = `receipt_${Date.now()}.jpg`;
      const publicUrl = await uploadImageMutation.mutateAsync({
        base64Image,
        fileName,
      });
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return base64Image;
    }
  };

  const setNewScanResult = (
    items: ScannedItem[], 
    totalScore: number, 
    imageUrl?: string, 
    feedback?: string,
    nearbyStores?: NearbyStore[],
    userLocation?: LocationResult
  ) => {
    if (!user) return;
    
    const newScan: ScanResult = {
      id: `temp_${Date.now()}`,
      userId: user.id,
      items,
      totalScore,
      imageUrl,
      feedback,
      nearbyStores,
      userLocation,
      createdAt: new Date().toISOString(),
    };
    
    setCurrentScan(newScan);
    return newScan;
  };

  return {
    scanHistory: scanHistoryQuery.data || [],
    isLoadingHistory: scanHistoryQuery.isLoading,
    historyError: scanHistoryQuery.error,
    currentScan,
    isSaving: saveScanMutation.isPending,
    isUploading: uploadImageMutation.isPending,
    saveCurrentScan,
    uploadImage,
    setNewScanResult,
    setCurrentScan,
  };
});
