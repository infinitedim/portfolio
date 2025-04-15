"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { memo, useEffect, useState, useRef } from "react";

const Hero = () => {
  const locale = useTranslations("hero");
  const [titleIndex, setTitleIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [waveRotation, setWaveRotation] = useState(0);

  // References for animation
  const animationRef = useRef<number | null>(null);
  const isMounted = useRef(false);
  const animationStartTime = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const technologies = ["Flutter", "React", "Web", "Frontend"];

  const name = locale("name");
  const greeting = locale("greeting");

  useEffect(() => {
    // Mark component as mounted
    isMounted.current = true;

    // Start wave animation after component is mounted
    setIsLoaded(true);

    // Wave animation using requestAnimationFrame
    const animateWave = (timestamp: number) => {
      if (!isMounted.current) return;

      // Initialize start time on first animation frame
      if (animationStartTime.current === null) {
        animationStartTime.current = timestamp;
      }

      // Calculate progress (0 to 1) over 2 seconds duration
      const elapsed = timestamp - animationStartTime.current;
      const duration = 2000; // 2 seconds
      const progress = Math.min(elapsed / duration, 1);

      if (progress < 1) {
        // Define keyframes for the wave animation
        // Similar to the original rotate: [0, 20, -10, 20, -5, 10, 0]
        let rotation = 0;

        if (progress < 0.15) {
          // 0 to 20 degrees
          rotation = progress * (20 / 0.15);
        } else if (progress < 0.3) {
          // 20 to -10 degrees
          rotation = 20 - (progress - 0.15) * (30 / 0.15);
        } else if (progress < 0.45) {
          // -10 to 20 degrees
          rotation = -10 + (progress - 0.3) * (30 / 0.15);
        } else if (progress < 0.6) {
          // 20 to -5 degrees
          rotation = 20 - (progress - 0.45) * (25 / 0.15);
        } else if (progress < 0.8) {
          // -5 to 10 degrees
          rotation = -5 + (progress - 0.6) * (15 / 0.2);
        } else {
          // 10 to 0 degrees
          rotation = 10 - (progress - 0.8) * (10 / 0.2);
        }

        setWaveRotation(rotation);
        animationRef.current = requestAnimationFrame(animateWave);
      } else {
        // Reset for the next animation cycle - after 5 seconds
        animationStartTime.current = null;

        // Wait 5 seconds before repeating wave animation
        setTimeout(() => {
          if (isMounted.current) {
            animationRef.current = requestAnimationFrame(animateWave);
          }
        }, 5000);
      }
    };

    // Start the wave animation
    animationRef.current = requestAnimationFrame(animateWave);

    // Set up interval for technology text change
    intervalRef.current = setInterval(() => {
      if (isMounted.current) {
        setTitleIndex((prev) => (prev + 1) % technologies.length);
      }
    }, 3000);

    return () => {
      // Clean up animations and intervals when component unmounts
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Mark component as unmounted
      isMounted.current = false;
    };
  }, [technologies.length]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  const techVariants = {
    initial: { y: 40, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -40, opacity: 0 },
  };

  return (
    <section className="min-h-fit flex flex-col justify-center px-8 md:px-16 py-16 relative items-center overflow-hidden bg-white dark:bg-woodsmoke-950">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="z-10"
      >
        <motion.h4
          variants={itemVariants}
          className="text-lg md:text-xl leading-tight max-w-4xl mb-3 text-center text-woodsmoke-800 dark:text-white"
        >
          {greeting.split("👋")[0]}
          {isLoaded && (
            <span
              style={{
                display: "inline-block",
                transform: `rotate(${waveRotation}deg)`,
                transformOrigin: "bottom right",
                marginLeft: "4px",
                marginRight: "4px",
              }}
            >
              👋
            </span>
          )}
          {greeting.split("👋")[1]} {name}
        </motion.h4>

        <motion.h2
          variants={itemVariants}
          className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-woodsmoke-950 dark:text-white max-w-4xl mb-6 text-center flex flex-wrap flex-col justify-center items-center gap-4"
        >
          <span>{locale("title").split("Flutter")[0]}</span>

          <span
            className="relative inline-block overflow-hidden mx-1 text-woodsmoke-950 dark:text-white"
            style={{ verticalAlign: "baseline", transform: "translateY(0)" }}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={technologies[titleIndex]}
                className="inline-block text-woodsmoke-950 dark:text-white"
                variants={techVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                {technologies[titleIndex]}
              </motion.span>
            </AnimatePresence>
            <span className="font-bold">
              {locale("title").split("Flutter")[1]}
            </span>
          </span>
        </motion.h2>
      </motion.div>
    </section>
  );
};

export default memo(Hero);
