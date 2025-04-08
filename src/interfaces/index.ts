import type { SVGMotionProps, Variants } from "framer-motion";

export interface AnimationableSVGProps extends SVGMotionProps<SVGSVGElement> {
  className?: string;
  pathVariants?: Variants;
  svgVariants?: Variants;
}

export interface HeroProps {
  name: string;
  description: string;
  title: string;
  greeting: string;
  ctaText: string;
}
