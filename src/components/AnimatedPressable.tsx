import { PropsWithChildren } from "react";
import { Pressable, PressableProps, StyleProp, ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";

import { motion, timingConfig } from "../utils/animation";

const ReanimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = PropsWithChildren<
  Omit<PressableProps, "style"> & {
    activeOpacity?: number;
    activeScale?: number;
    style?: StyleProp<ViewStyle>;
  }
>;

export function AnimatedPressable({
  activeOpacity = motion.press.opacity,
  activeScale = motion.press.scale,
  children,
  onPressIn,
  onPressOut,
  style,
  ...props
}: Props) {
  const reduceMotion = useReducedMotion();
  const pressed = useSharedValue(0);
  const config = timingConfig(motion.duration.fast, reduceMotion);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - pressed.value * (1 - activeOpacity),
    transform: [{ scale: 1 - pressed.value * (1 - activeScale) }]
  }));

  return (
    <ReanimatedPressable
      {...props}
      onPressIn={(event) => {
        pressed.value = withTiming(1, config);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        pressed.value = withTiming(0, config);
        onPressOut?.(event);
      }}
      style={[animatedStyle, style]}
    >
      {children}
    </ReanimatedPressable>
  );
}
