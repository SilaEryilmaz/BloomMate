import { Easing, ReduceMotion, WithSpringConfig, WithTimingConfig } from "react-native-reanimated";

export const motion = {
  duration: {
    instant: 1,
    fast: 140,
    base: 260,
    slow: 460,
    opening: 7200
  },
  easing: {
    standard: Easing.out(Easing.cubic),
    gentle: Easing.bezier(0.22, 1, 0.36, 1)
  },
  press: {
    opacity: 0.78,
    scale: 0.97
  },
  spring: {
    entrance: {
      damping: 18,
      mass: 0.85,
      stiffness: 180
    } satisfies WithSpringConfig,
    press: {
      damping: 16,
      mass: 0.65,
      stiffness: 260
    } satisfies WithSpringConfig
  },
  stagger: 70
};

export function timingConfig(duration: number, reduceMotion: boolean): WithTimingConfig {
  return {
    duration: reduceMotion ? motion.duration.instant : duration,
    easing: motion.easing.gentle,
    reduceMotion: reduceMotion ? ReduceMotion.Always : ReduceMotion.System
  };
}
