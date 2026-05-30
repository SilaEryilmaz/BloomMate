import { PropsWithChildren, useEffect } from "react";
import { StyleProp, ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from "react-native-reanimated";

import { motion, timingConfig } from "../utils/animation";

type Props = PropsWithChildren<{
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  distance?: number;
  index?: number;
  style?: StyleProp<ViewStyle>;
}>;

export function AnimatedEntrance({ children, delay = 0, direction = "up", distance = 14, index = 0, style }: Props) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(reduceMotion ? 1 : 0);
  const progress = useSharedValue(reduceMotion ? 1 : 0);
  const effectiveDistance = reduceMotion ? 0 : distance;

  useEffect(() => {
    const entranceDelay = reduceMotion ? 0 : delay + index * motion.stagger;
    opacity.value = withDelay(entranceDelay, withTiming(1, timingConfig(motion.duration.base, reduceMotion)));
    progress.value = withDelay(entranceDelay, withTiming(1, timingConfig(motion.duration.base, reduceMotion)));
  }, [delay, index, opacity, progress, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => {
    const offset = effectiveDistance * (1 - progress.value);
    const translateX = direction === "left" ? offset : direction === "right" ? -offset : 0;
    const translateY = direction === "up" ? offset : direction === "down" ? -offset : 0;

    return {
      opacity: opacity.value,
      transform: [{ translateX }, { translateY }, { scale: reduceMotion ? 1 : 0.985 + progress.value * 0.015 }]
    };
  });

  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
}
