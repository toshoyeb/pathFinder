import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";
import { Colors } from "../../constants/Colors";
import { Spacing } from "../../constants/Spacing";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  containerStyle?: ViewStyle;
  inputStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  containerStyle,
  inputStyle,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const inputContainerStyle = [
    styles.inputContainer,
    isFocused && styles.inputContainerFocused,
    error && styles.inputContainerError,
    containerStyle,
  ];

  const inputStyleCombined = [
    styles.input,
    isFocused && styles.inputFocused,
    error && styles.inputError,
    inputStyle,
  ];

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={inputContainerStyle}>
        <TextInput
          style={inputStyleCombined}
          placeholderTextColor={Colors.text.tertiary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...textInputProps}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {helperText && !error && (
        <Text style={styles.helperText}>{helperText}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.input.marginBottom,
  },
  label: {
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
    fontWeight: "500",
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: Spacing.input.borderRadius,
    backgroundColor: Colors.background.primary,
  },
  inputContainerFocused: {
    borderColor: Colors.primary[500],
    borderWidth: 2,
  },
  inputContainerError: {
    borderColor: Colors.error[500],
    borderWidth: 1,
  },
  input: {
    paddingVertical: Spacing.input.paddingVertical,
    paddingHorizontal: Spacing.input.paddingHorizontal,
    color: Colors.text.primary,
  },
  inputFocused: {
    // Additional focus styles if needed
  },
  inputError: {
    // Additional error styles if needed
  },
  errorText: {
    color: Colors.error[500],
    marginTop: Spacing.xs,
  },
  helperText: {
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
  },
});
