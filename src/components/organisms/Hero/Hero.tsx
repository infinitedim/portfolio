"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/atoms";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const Hero = () => {
  const locale = useTranslations("hero");

  const [typedText, setTypedText] = useState("");
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  const cta = locale("cta");
  const name = locale("name");
  const title = locale("title");
  const description = locale("description");

  useEffect(() => {
    // Reset state at the beginning of effect
    setTypedText("");
    setIsTypingComplete(false);

    // Guard clause - exit early if description isn't available
    if (!description || typeof description !== "string") return;

    const typingSpeed = 30;
    const completionDelay = 300;
    let currentIndex = 0;
    let typingTimeout: ReturnType<typeof setTimeout>;
    let completionTimeout: NodeJS.Timeout;
    let cursorInterval: NodeJS.Timeout;

    const typeNextCharacter = () => {
      if (currentIndex < description.length) {
        // Safely extract the substring
        const textToShow = description.substring(0, currentIndex + 1);
        setTypedText(textToShow);
        currentIndex++;
        // Schedule next character
        typingTimeout = setTimeout(typeNextCharacter, typingSpeed);
      } else {
        // Typing complete - make sure we use the full description without any extras
        setTypedText(description);

        completionTimeout = setTimeout(() => {
          setIsTypingComplete(true);
          // Blink cursor 5 times before disappearing
          let blinkCount = 0;
          cursorInterval = setInterval(() => {
            blinkCount++;
            if (blinkCount >= 10) {
              // 5 cycles on/off
              clearInterval(cursorInterval);
            }
          }, 400);
        }, completionDelay);
      }
    };

    // Wait before starting to type
    const initialDelay = setTimeout(typeNextCharacter, 800);

    // Cleanup function to clear all timers
    return () => {
      clearTimeout(initialDelay);
      clearTimeout(typingTimeout);
      clearTimeout(completionTimeout);
      if (cursorInterval) clearInterval(cursorInterval);

      // Important: set the final value on cleanup to avoid stale state
      if (description) setTypedText(description);
    };
  }, [description]); // Only re-run when description changes

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

  const buttonVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.6,
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      },
    },
    hover: {
      x: 5,
      transition: { duration: 0.3 },
    },
  };

  return (
    <section className="min-h-fit flex flex-col justify-center px-8 md:px-16 py-16 relative overflow-hidden bg-woodsmoke-50 dark:bg-woodsmoke-950">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="z-10"
      >
        <motion.h1
          variants={itemVariants}
          className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight max-w-4xl mb-3"
        >
          {name}
        </motion.h1>

        <motion.h2
          variants={itemVariants}
          className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-woodsmoke-700 dark:text-woodsmoke-100 max-w-4xl mb-6"
        >
          {title}
        </motion.h2>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="text-lg md:text-xl text-woodsmoke-600 dark:text-woodsmoke-200 max-w-2xl mb-10 leading-relaxed relative"
        >
          {typedText}
        </motion.div>

        <motion.div
          variants={buttonVariants}
          initial="hidden"
          animate={isTypingComplete ? "visible" : "hidden"}
          whileHover="hover"
          className="inline-block"
        >
          <Button
            asChild
            size="lg"
            className="group"
          >
            <a
              href="/#/projects"
              className="flex items-center -ml-6"
            >
              {cta}
              <motion.span
                initial={{ x: 0 }}
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <ArrowRightIcon className="size-4" />
              </motion.span>
            </a>
          </Button>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;
