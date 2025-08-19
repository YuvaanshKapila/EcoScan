import React, { useState, ComponentProps } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  TextInputProps,
  ViewStyle,
  TextStyle
} from 'react-native';
import Colors from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';

type IoniconsIconProps = Omit<ComponentProps<typeof Ionicons>, 'name'>;

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: TextStyle;
  errorStyle?: TextStyle;
  isPassword?: boolean;
  testID?: string;
}

export default function Input({
  label,
  error,
  containerStyle,
  labelStyle,
  inputStyle,
  errorStyle,
  isPassword = false,
  testID,
  ...rest
}: InputProps) {
  const [secureTextEntry, setSecureTextEntry] = useState(isPassword);

  const toggleSecureEntry = () => {
    setSecureTextEntry(!secureTextEntry);
  };

  return (
    <View style={[styles.container, containerStyle]} testID={testID}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}

      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            error ? styles.inputError : {},
            inputStyle
          ]}
          placeholderTextColor={Colors.light.gray}
          secureTextEntry={secureTextEntry}
          {...rest}
        />

        {isPassword && (
          <TouchableOpacity style={styles.iconContainer} onPress={toggleSecureEntry}>
            {secureTextEntry ? (
              <Ionicons
                name="eye-outline"
                size={20}
                color={Colors.light.gray}
              />
            ) : (
              <Ionicons
                name="eye-off-outline"
                size={20}
                color={Colors.light.gray}
              />
            )}
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={[styles.errorText, errorStyle]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: Colors.light.text,
    fontWeight: '500' as const,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.light.lightGray,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: 'white',
    color: Colors.light.text,
  },
  inputError: {
    borderColor: Colors.light.error,
  },
  iconContainer: {
    position: 'absolute',
    right: 16,
    height: '100%',
    justifyContent: 'center',
  },
  errorText: {
    color: Colors.light.error,
    fontSize: 14,
    marginTop: 4,
  },
});
