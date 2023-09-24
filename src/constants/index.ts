import { Variants } from "framer-motion";

export const ButtonType = {
  button: "button",
  submit: "submit",
  reset: "reset",
} as const;

export const HeadingTypeAs = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
} as const;

export const menuItems: Array<String> = [
  "About",
  "Blog",
  "Projects",
  "Contact",
  "Resume",
];

export const closeIconAnimation: Variants = {
  hidden: {
    pathLength: 0,
    opacity: 1,
  },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      duration: 1,
      ease: "easeInOut",
    },
  },
};

export const menuIconAnimation: Variants = {
  hidden: {
    pathLength: 0,
    opacity: 1,
  },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      duration: 1,
      ease: "easeInOut",
    },
  },
};

export const myFirstName: Array<String> = ["D", "i", "m", "a", "s"];
export const myLastName: Array<String> = ["Sa", "pu", "tr", "a"];
