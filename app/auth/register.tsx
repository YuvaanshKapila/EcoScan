import React, { useState, ComponentProps } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '@/hooks/auth-store';
import Input from '@/components/Input';
import Button from '@/components/Button';
import Colors from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';

type IoniconsIconProps = Omit<ComponentProps<typeof Ionicons>, 'name'>;

const LeafIcon = (props: IoniconsIconProps) => <Ionicons name="leaf-outline" {...props} />;

export default function RegisterScreen() {
  const { signUp, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    email: '',
    password: '',
  });

  const validateForm = () => {
    let isValid = true;
    const errors = {
      email: '',
      password: '',
    };
    
    if (!email) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email is invalid';
      isValid = false;
    }
    
    if (!password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
      isValid = false;
    }
    
    setValidationErrors(errors);
    return isValid;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    try {
      const result = await signUp(email, password);
      if (result && typeof result === 'object' && 'needsConfirmation' in result) {
        setRegistrationSuccess(true);
      } else {
        console.error("Sign up failed for an unknown reason or was handled by a caught error.");
      }
    } catch (e) {
      console.error('Registration error:', e);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <LeafIcon size={40} color="white" />
          </View>
          <Text style={styles.appName}>EcoScan</Text>
          <Text style={styles.tagline}>Scan receipts. Save the planet.</Text>
        </View>
        
        <View style={styles.formContainer}>
          <Text style={styles.title}>Create an Account</Text>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {registrationSuccess && (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>
                Registration successful! Please check your email to verify your account.
              </Text>
            </View>
          )}
          
          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={validationErrors.email}
            testID="email-input"
          />
          
          <Input
            label="Password"
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            isPassword
            error={validationErrors.password}
            testID="password-input"
          />
          
          <Button
            title="Sign Up"
            onPress={handleRegister}
            isLoading={isLoading}
            style={styles.button}
            testID="register-button"
          />
          
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Already have an account? </Text>
            <Link href="/auth/login" asChild>
              <TouchableOpacity>
                <Text style={styles.registerLink}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: Colors.light.gray,
  },
  formContainer: {
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: Colors.light.text,
  },
  errorContainer: {
    backgroundColor: Colors.light.error + '20',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: Colors.light.error,
    fontSize: 14,
  },
  successContainer: {
    backgroundColor: Colors.light.success + '20',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  successText: {
    color: Colors.light.success,
    fontSize: 14,
  },
  button: {
    marginTop: 16,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  registerText: {
    color: Colors.light.text,
    fontSize: 16,
  },
  registerLink: {
    color: Colors.light.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
