import { useEffect, useRef, useState } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, radii, spacing } from "../theme";
import { OpeningFact } from "../content/openingFacts";

type Props = {
  displayName: string;
  facts: OpeningFact[];
  onComplete: () => void;
};

export function OpeningScreen({ displayName, facts, onComplete }: Props) {
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const floatA = useRef(new Animated.Value(0)).current;
  const floatB = useRef(new Animated.Value(0)).current;
  const factFade = useRef(new Animated.Value(1)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const [factIndex, setFactIndex] = useState(0);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        duration: 700,
        toValue: 1,
        useNativeDriver: true
      }),
      Animated.spring(scale, {
        friction: 7,
        tension: 55,
        toValue: 1,
        useNativeDriver: true
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatA, { duration: 900, toValue: 1, useNativeDriver: true }),
          Animated.timing(floatA, { duration: 900, toValue: 0, useNativeDriver: true })
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatB, { duration: 1100, toValue: 1, useNativeDriver: true }),
          Animated.timing(floatB, { duration: 1100, toValue: 0, useNativeDriver: true })
        ])
      ),
      Animated.timing(progress, {
        duration: 11400,
        toValue: 1,
        useNativeDriver: false
      })
    ]).start();

    let changes = 0;
    const factTimer = setInterval(() => {
      changes += 1;
      if (changes > 1) {
        clearInterval(factTimer);
        return;
      }
      Animated.sequence([
        Animated.timing(factFade, { duration: 450, toValue: 0, useNativeDriver: true }),
        Animated.timing(factFade, { duration: 450, toValue: 1, useNativeDriver: true })
      ]).start();
      setFactIndex((current) => (current + 1) % facts.length);
    }, 4800);

    const timer = setTimeout(onComplete, 11800);
    return () => {
      clearInterval(factTimer);
      clearTimeout(timer);
    };
  }, [factFade, facts.length, fade, floatA, floatB, onComplete, progress, scale]);

  const name = displayName.trim();
  const fact = facts[factIndex];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.scene}>
        <Animated.View style={[styles.petals, styles.petalOne, { transform: [{ translateY: floatA.interpolate({ inputRange: [0, 1], outputRange: [0, -18] }) }] }]} />
        <Animated.View style={[styles.petals, styles.petalTwo, { transform: [{ translateY: floatB.interpolate({ inputRange: [0, 1], outputRange: [0, 22] }) }] }]} />
        <Animated.View style={[styles.petals, styles.petalThree, { transform: [{ translateY: floatA.interpolate({ inputRange: [0, 1], outputRange: [0, 14] }) }] }]} />

        <Animated.View style={[styles.content, { opacity: fade, transform: [{ scale }] }]}>
          <View style={styles.imageFrame}>
            <Image source={require("../../assets/bloom-mascot.png")} style={styles.image} />
          </View>
          <Text style={styles.kicker}>BloomMate</Text>
          <Text style={styles.title}>{name ? `Welcome, ${name}` : "Welcome to BloomMate"}</Text>
          <Text style={styles.copy}>Preparing your cycle space...</Text>
          <Animated.View style={[styles.factCard, { opacity: factFade }]}>
            <Text style={styles.factLabel}>{fact?.title ?? "Did you know?"}</Text>
            <Text style={styles.factText}>{fact?.body ?? "Cycle facts are general info, not medical advice."}</Text>
          </Animated.View>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["8%", "100%"]
                  })
                }
              ]}
            />
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: "center",
    padding: spacing.lg
  },
  copy: {
    color: colors.inkMuted,
    fontSize: 16,
    fontWeight: "800",
    marginTop: spacing.sm
  },
  factCard: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderRadius: radii.md,
    borderWidth: 1,
    marginTop: spacing.lg,
    minHeight: 112,
    padding: spacing.md,
    width: "100%"
  },
  factLabel: {
    color: colors.berry,
    fontSize: 12,
    fontWeight: "900",
    marginBottom: spacing.xs,
    textTransform: "uppercase"
  },
  factText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 23
  },
  image: {
    borderRadius: radii.lg,
    height: 230,
    width: 230
  },
  imageFrame: {
    backgroundColor: colors.surface,
    borderRadius: 34,
    padding: spacing.sm,
    shadowColor: colors.berryDark,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 22
  },
  kicker: {
    color: colors.berry,
    fontSize: 15,
    fontWeight: "900",
    marginTop: spacing.lg,
    textTransform: "uppercase"
  },
  petals: {
    position: "absolute"
  },
  petalOne: {
    backgroundColor: colors.petal,
    borderRadius: 44,
    height: 88,
    left: 24,
    top: 120,
    width: 88
  },
  petalThree: {
    backgroundColor: colors.butter,
    borderRadius: 24,
    bottom: 140,
    height: 48,
    left: 54,
    width: 48
  },
  petalTwo: {
    backgroundColor: colors.mint,
    borderRadius: 58,
    height: 116,
    right: -24,
    top: 230,
    width: 116
  },
  progressFill: {
    backgroundColor: colors.berry,
    borderRadius: 999,
    height: 8
  },
  progressTrack: {
    backgroundColor: colors.line,
    borderRadius: 999,
    height: 8,
    marginTop: spacing.md,
    overflow: "hidden",
    width: "100%"
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
  title: {
    color: colors.ink,
    fontSize: 34,
    fontWeight: "900",
    marginTop: spacing.xs,
    textAlign: "center"
  }
});
