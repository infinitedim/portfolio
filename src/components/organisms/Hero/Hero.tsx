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
  const greeting = locale("greeting");
  const description = locale("description");

  // Effect untuk animasi mengetik
  useEffect(() => {
    setTypedText("");
    setIsTypingComplete(false);

    const typingSpeed = 30;
    const completionDelay = 300;

    let currentIndex = 0;

    const typeNextCharacter = () => {
      if (currentIndex < description.length) {
        // Tambahkan karakter berikutnya
        setTypedText((prev) => prev + description[currentIndex]);
        currentIndex++;
        // Jadwalkan karakter berikutnya
        setTimeout(typeNextCharacter, typingSpeed);
      } else {
        // Selesai mengetik
        setTimeout(() => {
          setIsTypingComplete(true);
          // Buat cursor berkedip 5 kali sebelum menghilang
          let blinkCount = 0;
          const cursorInterval = setInterval(() => {
            blinkCount++;
            if (blinkCount >= 10) {
              // 5 siklus on/off
              clearInterval(cursorInterval);
            }
          }, 400);
        }, completionDelay);
      }
    };

    // Tunggu sebentar sebelum mulai mengetik
    setTimeout(typeNextCharacter, 800);

    // Cleanup function
    return () => {
      setTypedText("");
      setIsTypingComplete(false);
    };
  }, [description]);

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
    <section className="min-h-screen flex flex-col justify-center px-8 md:px-16 py-16 relative overflow-hidden">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="z-10"
      >
        <motion.h2
          variants={itemVariants}
          className="text-lg md:text-xl text-gray-500 mb-2"
        >
          {greeting}
        </motion.h2>

        <motion.h1
          variants={itemVariants}
          className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight max-w-4xl mb-3"
        >
          {name}
        </motion.h1>

        <motion.h2
          variants={itemVariants}
          className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-gray-700 max-w-4xl mb-6"
        >
          {title}
        </motion.h2>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="text-lg md:text-xl text-gray-600 max-w-2xl mb-10 leading-relaxed relative"
        >
          {typedText.replaceAll("undefined", "")}
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
              href="#projects"
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
