"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { memo, useEffect, useState } from "react";

const Hero = () => {
  const locale = useTranslations("hero");

  const [titleIndex, setTitleIndex] = useState(0);

  const technologies = ["Flutter", "React", "Web", "Frontend"];

  const name = locale("name");
  const greeting = locale("greeting");

  useEffect(() => {
    const interval = setInterval(() => {
      setTitleIndex((prev) => (prev + 1) % technologies.length);
    }, 3000);

    return () => clearInterval(interval);
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
          {greeting} {name}
        </motion.h4>

        <motion.h2
          variants={itemVariants}
          className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-woodsmoke-950 dark:text-white max-w-4xl mb-6 text-center flex flex-wrap flex-col justify-center items-center"
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
