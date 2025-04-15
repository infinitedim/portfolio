"use client";

import { memo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cog6ToothIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { cn } from "@/utils";
import { Button, LanguageSwitcher, ThemeSwitcher } from "@/components/atoms";

interface SettingsFABProps {
  className?: string;
}

const SettingsFAB = ({ className }: SettingsFABProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [rotation, setRotation] = useState(0);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const isMounted = useRef(false);

  // Use custom animation frame-based rotation instead of Framer Motion controls
  useEffect(() => {
    // Mark component as mounted
    isMounted.current = true;

    const animate = (time: number) => {
      if (!isMounted.current) return;

      if (lastTimeRef.current === null) {
        lastTimeRef.current = time;
      }

      // Calculate time difference and update rotation
      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;

      // Full rotation (360 degrees) in 8 seconds (45 degrees per second)
      const rotationSpeed = 45 / 1000; // 45 degrees per second
      setRotation((prev) => (prev + rotationSpeed * deltaTime) % 360);

      // Continue animation loop if component is still mounted and menu is closed
      if (!isOpen && isMounted.current) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    if (!isOpen && isMounted.current) {
      // Start the animation
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      // Clean up animation when component unmounts or menu opens
      if (isMounted.current && animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      if (isMounted.current) {
        lastTimeRef.current = null;
      }

      // Mark component as unmounted
      isMounted.current = false;
    };
  }, [isOpen]);

  const toggleFAB = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={cn("fixed bottom-6 right-6 z-50 rounded-full", className)}>
      <Button
        onClick={toggleFAB}
        size="icon"
        className="size-14 rounded-full shadow-lg dark:bg-woodsmoke-950 bg-white hover:bg-primary/90"
      >
        <AnimatePresence
          mode="wait"
          initial={false}
        >
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <XMarkIcon className="size-6 text-woodsmoke-950 dark:text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="settings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              <Cog6ToothIcon className="size-6 text-woodsmoke-950 dark:text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <div className="absolute bottom-20 right-1 flex flex-col items-end gap-3">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="flex items-center gap-3"
            >
              <LanguageSwitcher />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              transition={{ duration: 0.2, delay: 0.2 }}
              className="flex items-center gap-3"
            >
              <ThemeSwitcher />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default memo(SettingsFAB);
