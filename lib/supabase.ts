import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rvskrcchwqcyfenxzaml.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2c2tyY2Nod3FjeWZlbnh6YW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NzQwMDIsImV4cCI6MjA3MDU1MDAwMn0.XedZ-WZguqm7jbocayviQfMslDUVtijzMgclLur_BtM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});