import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { Colors } from "../../constants/Colors";
import { Spacing } from "../../constants/Spacing";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: "default" | "elevated" | "outlined";
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = "default",
}) => {
  const cardStyle = [styles.base, styles[variant], style];

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.background.primary,
    borderRadius: Spacing.card.borderRadius,
    padding: Spacing.card.padding,
  },
  default: {
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  elevated: {
    shadowColor: Colors.shadow.medium,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  outlined: {
    borderWidth: 1,
    borderColor: Colors.border.medium,
  },
});
