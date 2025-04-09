"use client";

import { motion } from "framer-motion";
import { memo } from "react";
import type { JSX, ReactNode } from "react";

/**
 * A component that provides a page transition animation.
 * @param {object} root0 - The props object.
 * @param {ReactNode} root0.children - The child components to render inside the transition.
 * @returns {JSX.Element} The rendered page transition component.
 */
function PageTransition({ children }: { children: ReactNode }): JSX.Element {
  return (
    <>
      <motion.div
        className="fixed inset-0 dark:bg-woodsmoke-950 bg-white z-50"
        initial={{ scaleY: 0 }}
        animate={{
          scaleY: 0,
          transition: {
            duration: 0.8,
            ease: [0.76, 0, 0.24, 1],
          },
        }}
        exit={{
          scaleY: 1,
          transition: {
            duration: 0.8,
            ease: [0.76, 0, 0.24, 1],
          },
        }}
        style={{ originY: "0%" }}
      />
      <motion.div
        className="fixed inset-0 dark:bg-woodsmoke-950 bg-white z-40"
        initial={{ scaleY: 1 }}
        animate={{
          scaleY: 0,
          transition: {
            duration: 0.8,
            ease: [0.76, 0, 0.24, 1],
            delay: 0.2,
          },
        }}
        style={{ originY: "100%" }}
      />
      {children}
    </>
  );
}

export default memo(PageTransition);
