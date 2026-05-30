import { PropsWithChildren } from "react";
import { StyleProp, ViewStyle } from "react-native";

import { AnimatedEntrance } from "./AnimatedEntrance";

type Props = PropsWithChildren<{
  step: number;
  style?: StyleProp<ViewStyle>;
}>;

export function AnimatedStep({ children, step, style }: Props) {
  return (
    <AnimatedEntrance key={step} distance={18} style={style}>
      {children}
    </AnimatedEntrance>
  );
}
