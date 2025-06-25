import LottieView from "lottie-react-native";
import React from "react";
import { ViewStyle } from "react-native";

interface LottieAnimationProps {
  source: any; // Lottie animation source
  autoPlay?: boolean;
  loop?: boolean;
  style?: ViewStyle;
  speed?: number;
}

export const LottieAnimation: React.FC<LottieAnimationProps> = ({
  source,
  autoPlay = true,
  loop = true,
  style,
  speed = 1,
}) => {
  return (
    <LottieView
      source={source}
      autoPlay={autoPlay}
      loop={loop}
      style={style}
      speed={speed}
    />
  );
};
