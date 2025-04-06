import { NextFont } from "next/dist/compiled/@next/font";
import { Inter, Oswald } from "next/font/google";

export const inter: NextFont = Inter({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const oswald: NextFont = Oswald({
  weight: ["200", "300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  preload: true,
});
