// components/AnimatedScreen.tsx

import React from "react";
import { ViewStyle } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

type AnimatedScreenProps = React.PropsWithChildren<{
  style?: ViewStyle;
  delay?: number;
}>;

export default function AnimatedScreen({
  children,
  style,
  delay = 0,
}: AnimatedScreenProps) {
  return (
    <Animated.View
      style={[style]}
      entering={FadeInDown.duration(320).delay(delay).springify().damping(18)}
    >
      {children}
    </Animated.View>
  );
}
