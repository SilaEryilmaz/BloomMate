import { createContext, createElement, PropsWithChildren, useContext } from "react";

import { ThemePreset } from "./types";

export const colors = {
  canvas: "#FDFBF7",
  surface: "#FFFFFF",
  petal: "#FAF6F0",
  petalSoft: "#FFFBF7",
  coral: "#E76F51",
  berry: "#9E2A51",
  berryDark: "#831F41",
  berrySoft: "#F8E6EE",
  mint: "#BDEDD8",
  butter: "#F4A261",
  sky: "#78B7E6",
  ink: "#2D2327",
  inkMuted: "#6D5A60",
  inkSoft: "#9C8A90",
  line: "#F5EDE2",
  danger: "#C94545"
};

export type AppPalette = typeof colors & {
  accent: string;
  accentDark: string;
  accentSoft: string;
  accentMuted: string;
  secondary: string;
  secondarySoft: string;
  tertiary: string;
  tertiarySoft: string;
};

export type ThemeDefinition = {
  id: ThemePreset;
  label: string;
  palette: AppPalette;
  swatches: string[];
};

export const themePresets: Record<ThemePreset, ThemeDefinition> = {
  classicRose: {
    id: "classicRose",
    label: "Classic Rose",
    palette: {
      ...colors,
      accent: colors.berry,
      accentDark: colors.berryDark,
      accentSoft: colors.berrySoft,
      accentMuted: "#C85D87",
      secondary: colors.coral,
      secondarySoft: "#FBE4D8",
      tertiary: colors.butter,
      tertiarySoft: "#FFF0D8"
    },
    swatches: [colors.berry, colors.coral, colors.butter, colors.berrySoft]
  },
  deepOrchid: {
    id: "deepOrchid",
    label: "Deep Orchid",
    palette: {
      ...colors,
      canvas: "#FEF8FC",
      petal: "#F7ECF7",
      petalSoft: "#FFF8FD",
      line: "#F0DFEB",
      berry: "#A62A91",
      berryDark: "#7B1B70",
      berrySoft: "#F6E2F4",
      coral: "#D9668E",
      butter: "#D9A7E8",
      mint: "#D7E8DE",
      sky: "#9A93DC",
      ink: "#302331",
      inkMuted: "#725E72",
      inkSoft: "#A18C9E",
      accent: "#A62A91",
      accentDark: "#7B1B70",
      accentSoft: "#F6E2F4",
      accentMuted: "#C35BB5",
      secondary: "#D9668E",
      secondarySoft: "#F9E2EB",
      tertiary: "#9A93DC",
      tertiarySoft: "#EEEAFB"
    },
    swatches: ["#A62A91", "#D9668E", "#9A93DC", "#F6E2F4"]
  },
  nordicSage: {
    id: "nordicSage",
    label: "Nordic Sage",
    palette: {
      ...colors,
      canvas: "#FBFAF3",
      petal: "#EEF3EA",
      petalSoft: "#FFFDF6",
      line: "#E5E9DA",
      berry: "#547D72",
      berryDark: "#365C53",
      berrySoft: "#E1EEE8",
      coral: "#D98A6A",
      butter: "#D8BA73",
      mint: "#B9D7BE",
      sky: "#7FA7A0",
      ink: "#28302D",
      inkMuted: "#60706A",
      inkSoft: "#8D9A93",
      accent: "#547D72",
      accentDark: "#365C53",
      accentSoft: "#E1EEE8",
      accentMuted: "#789C91",
      secondary: "#D98A6A",
      secondarySoft: "#F8E5D7",
      tertiary: "#D8BA73",
      tertiarySoft: "#F7EED2"
    },
    swatches: ["#547D72", "#D98A6A", "#D8BA73", "#E1EEE8"]
  }
};

const ThemeContext = createContext<AppPalette>(themePresets.classicRose.palette);

export function ThemeProvider({ children, preset }: PropsWithChildren<{ preset: ThemePreset }>) {
  return createElement(ThemeContext.Provider, { value: (themePresets[preset] ?? themePresets.classicRose).palette }, children);
}

export function useTheme() {
  return useContext(ThemeContext);
}

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32
};

export const radii = {
  sm: 8,
  md: 14,
  lg: 18,
  xl: 24
};

export const typography = {
  serif: "Georgia",
  sans: undefined
};
