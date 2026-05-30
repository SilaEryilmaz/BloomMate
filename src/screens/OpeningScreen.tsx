import { useEffect, useRef, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, spacing, useTheme } from "../theme";
import { OpeningFact } from "../content/openingFacts";
import { motion, timingConfig } from "../utils/animation";

type Props = {
  displayName: string;
  facts: OpeningFact[];
  onComplete: () => void;
};

export function OpeningScreen({ displayName, facts, onComplete }: Props) {
  const theme = useTheme();
  const [factIndex, setFactIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const backgroundProgress = useSharedValue(reduceMotion ? 1 : 0);
  const heroProgress = useSharedValue(reduceMotion ? 1 : 0);
  const textProgress = useSharedValue(reduceMotion ? 1 : 0);
  const factProgress = useSharedValue(reduceMotion ? 1 : 0);
  const factTransition = useSharedValue(1);
  const floatLoop = useSharedValue(0);
  const driftLoop = useSharedValue(0);
  const progress = useSharedValue(0);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    backgroundProgress.value = withTiming(1, timingConfig(520, reduceMotion));
    heroProgress.value = reduceMotion ? 1 : withDelay(140, withSpring(1, motion.spring.entrance));
    textProgress.value = withDelay(320, withTiming(1, timingConfig(560, reduceMotion)));
    factProgress.value = withDelay(620, withTiming(1, timingConfig(620, reduceMotion)));
    progress.value = withTiming(1, timingConfig(reduceMotion ? motion.duration.slow : motion.duration.opening - 350, reduceMotion));

    if (!reduceMotion) {
      floatLoop.value = withRepeat(
        withSequence(
          withTiming(1, timingConfig(2600, false)),
          withTiming(0, timingConfig(2600, false))
        ),
        -1,
        false
      );
      driftLoop.value = withRepeat(
        withSequence(
          withTiming(1, timingConfig(4200, false)),
          withTiming(0, timingConfig(4200, false))
        ),
        -1,
        false
      );
    }

    let changes = 0;
    let swapTimer: ReturnType<typeof setTimeout> | null = null;
    const factTimer = setInterval(() => {
      changes += 1;
      if (changes > 1) {
        clearInterval(factTimer);
        return;
      }
      factTransition.value = withTiming(0, timingConfig(520, reduceMotion));
      swapTimer = setTimeout(() => {
        setFactIndex((current) => (current + 1) % Math.max(1, facts.length));
        factTransition.value = withTiming(1, timingConfig(620, reduceMotion));
      }, reduceMotion ? 1 : 540);
    }, 3300);

    const timer = setTimeout(() => onCompleteRef.current(), reduceMotion ? 3600 : motion.duration.opening);
    return () => {
      clearInterval(factTimer);
      if (swapTimer) {
        clearTimeout(swapTimer);
      }
      clearTimeout(timer);
      cancelAnimation(floatLoop);
      cancelAnimation(driftLoop);
      cancelAnimation(progress);
    };
  }, [backgroundProgress, driftLoop, factProgress, factTransition, facts.length, floatLoop, heroProgress, progress, reduceMotion, textProgress]);

  const name = displayName.trim();
  const fact = facts[factIndex];
  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroProgress.value,
    transform: [
      { translateY: reduceMotion ? 0 : (1 - heroProgress.value) * 18 + floatLoop.value * -8 },
      { rotate: reduceMotion ? "0deg" : `${(driftLoop.value - 0.5) * 1.6}deg` },
      { scale: reduceMotion ? 1 : 0.92 + heroProgress.value * 0.08 + floatLoop.value * 0.012 }
    ]
  }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: textProgress.value,
    transform: [{ translateY: reduceMotion ? 0 : (1 - textProgress.value) * 12 }]
  }));
  const factBlockStyle = useAnimatedStyle(() => ({
    opacity: factProgress.value,
    transform: [{ translateY: reduceMotion ? 0 : (1 - factProgress.value) * 14 }]
  }));
  const petalOneStyle = useAnimatedStyle(() => ({
    opacity: backgroundProgress.value * 0.8,
    transform: [
      { translateX: reduceMotion ? 0 : driftLoop.value * 18 },
      { translateY: reduceMotion ? 0 : (1 - backgroundProgress.value) * 18 + floatLoop.value * -24 },
      { rotate: reduceMotion ? "0deg" : `${-8 + driftLoop.value * 14}deg` },
      { scale: reduceMotion ? 1 : 0.88 + backgroundProgress.value * 0.12 + floatLoop.value * 0.04 }
    ]
  }));
  const petalTwoStyle = useAnimatedStyle(() => ({
    opacity: backgroundProgress.value * 0.76,
    transform: [
      { translateX: reduceMotion ? 0 : driftLoop.value * -24 },
      { translateY: reduceMotion ? 0 : (1 - backgroundProgress.value) * 22 + floatLoop.value * 26 },
      { rotate: reduceMotion ? "0deg" : `${10 - driftLoop.value * 18}deg` },
      { scale: reduceMotion ? 1 : 0.9 + backgroundProgress.value * 0.1 + driftLoop.value * 0.035 }
    ]
  }));
  const petalThreeStyle = useAnimatedStyle(() => ({
    opacity: backgroundProgress.value * 0.82,
    transform: [
      { translateX: reduceMotion ? 0 : driftLoop.value * 16 },
      { translateY: reduceMotion ? 0 : floatLoop.value * 18 },
      { rotate: reduceMotion ? "0deg" : `${driftLoop.value * 24}deg` },
      { scale: reduceMotion ? 1 : 0.96 + floatLoop.value * 0.08 }
    ]
  }));
  const petalFourStyle = useAnimatedStyle(() => ({
    opacity: backgroundProgress.value * 0.56,
    transform: [
      { translateX: reduceMotion ? 0 : driftLoop.value * -20 },
      { translateY: reduceMotion ? 0 : floatLoop.value * -16 },
      { rotate: reduceMotion ? "0deg" : `${18 - driftLoop.value * 32}deg` },
      { scale: reduceMotion ? 1 : 0.92 + driftLoop.value * 0.08 }
    ]
  }));
  const petalFiveStyle = useAnimatedStyle(() => ({
    opacity: backgroundProgress.value * 0.58,
    transform: [
      { translateX: reduceMotion ? 0 : driftLoop.value * 22 },
      { translateY: reduceMotion ? 0 : floatLoop.value * 20 },
      { rotate: reduceMotion ? "0deg" : `${-12 + driftLoop.value * 28}deg` }
    ]
  }));
  const factStyle = useAnimatedStyle(() => ({
    opacity: factTransition.value,
    transform: [{ translateY: reduceMotion ? 0 : (1 - factTransition.value) * 8 }]
  }));
  const progressStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progress.value }]
  }));

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.canvas }]}>
      <View style={styles.scene}>
        <Animated.View style={[styles.petals, styles.petalOne, { backgroundColor: theme.petal }, petalOneStyle]} />
        <Animated.View style={[styles.petals, styles.petalTwo, { backgroundColor: theme.mint }, petalTwoStyle]} />
        <Animated.View style={[styles.petals, styles.petalThree, { backgroundColor: theme.tertiary }, petalThreeStyle]} />
        <Animated.View style={[styles.petals, styles.petalFour, petalFourStyle]} />
        <Animated.View style={[styles.petals, styles.petalFive, petalFiveStyle]} />

        <View style={styles.content}>
          <Animated.View style={[styles.imageFrame, { backgroundColor: theme.surface, shadowColor: theme.accentDark }, heroStyle]}>
            <Image source={require("../../assets/bloom-mascot.png")} style={styles.image} />
          </Animated.View>

          <Animated.View style={[styles.titleBlock, textStyle]}>
            <Text style={[styles.kicker, { color: theme.accent }]}>BloomMate</Text>
            <Text style={[styles.title, { color: theme.ink }]}>{name ? `Welcome, ${name}` : "Welcome to BloomMate"}</Text>
            <Text style={[styles.copy, { color: theme.inkMuted }]}>Preparing your cycle space...</Text>
          </Animated.View>

          <Animated.View style={[styles.factSection, factBlockStyle]}>
            <Animated.View style={[styles.factCard, factStyle]}>
              <View style={styles.factHeader}>
                <Text style={[styles.factPill, { backgroundColor: theme.accentSoft, color: theme.accent }]}>{fact?.category?.replace("-", " ") ?? "cycle"}</Text>
                <Text style={[styles.factLabel, { color: theme.accent }]}>{fact?.title ?? "Did you know?"}</Text>
              </View>
              <Text style={[styles.factText, { color: theme.ink }]}>{fact?.body ?? "Cycle facts are general info, not medical advice."}</Text>
            </Animated.View>
            <View style={[styles.progressTrack, { backgroundColor: theme.accentSoft }]}>
              <Animated.View style={[styles.progressFill, { backgroundColor: theme.accent }, progressStyle]} />
            </View>
          </Animated.View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: "center",
    justifyContent: "center",
    maxWidth: 430,
    paddingHorizontal: spacing.lg,
    width: "100%"
  },
  copy: {
    color: colors.inkMuted,
    fontSize: 16,
    fontWeight: "800",
    marginTop: spacing.xs,
    textAlign: "center"
  },
  factCard: {
    backgroundColor: "transparent",
    minHeight: 130,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    width: "100%"
  },
  factHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm
  },
  factLabel: {
    color: colors.berry,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  factPill: {
    backgroundColor: "rgba(198, 60, 121, 0.11)",
    borderRadius: 999,
    color: colors.berry,
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    textTransform: "uppercase"
  },
  factSection: {
    marginTop: spacing.xl,
    width: "100%"
  },
  factText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 23
  },
  image: {
    borderRadius: 28,
    height: 250,
    width: 250
  },
  imageFrame: {
    backgroundColor: colors.surface,
    borderRadius: 40,
    padding: spacing.sm,
    shadowColor: colors.berryDark,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.1,
    shadowRadius: 24
  },
  kicker: {
    color: colors.berry,
    fontSize: 15,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  petals: {
    position: "absolute"
  },
  petalOne: {
    backgroundColor: colors.petal,
    borderRadius: 64,
    height: 128,
    left: -28,
    top: 170,
    width: 128
  },
  petalThree: {
    backgroundColor: colors.butter,
    borderRadius: 30,
    bottom: 178,
    height: 60,
    left: 66,
    width: 60
  },
  petalTwo: {
    backgroundColor: colors.mint,
    borderRadius: 82,
    height: 164,
    right: -64,
    top: 314,
    width: 164
  },
  petalFour: {
    backgroundColor: "rgba(255, 123, 103, 0.25)",
    borderRadius: 34,
    height: 68,
    right: 44,
    top: 132,
    width: 68
  },
  petalFive: {
    backgroundColor: "rgba(116, 184, 226, 0.2)",
    borderRadius: 26,
    bottom: 260,
    height: 52,
    right: 28,
    width: 52
  },
  progressFill: {
    alignSelf: "flex-start",
    backgroundColor: colors.berry,
    borderRadius: 999,
    height: 5,
    width: "100%"
  },
  progressTrack: {
    backgroundColor: "rgba(198, 60, 121, 0.14)",
    borderRadius: 999,
    height: 5,
    marginHorizontal: spacing.sm,
    marginTop: spacing.sm,
    overflow: "hidden",
    width: "92%"
  },
  safeArea: {
    backgroundColor: colors.canvas,
    flex: 1
  },
  scene: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    overflow: "hidden"
  },
  titleBlock: {
    alignItems: "center",
    marginTop: spacing.lg
  },
  title: {
    color: colors.ink,
    fontSize: 36,
    fontWeight: "900",
    lineHeight: 42,
    marginTop: spacing.sm,
    textAlign: "center"
  }
});
