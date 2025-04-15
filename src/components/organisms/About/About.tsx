"use client";
import { Section } from "@/components/atoms";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, memo } from "react";

const About = () => {
  const containerRef = useRef(null);

  // Text content split into words
  const words =
    "Self-taught since my youngest age, I love learning new things to improve my skills. Very curious by nature, I love the world of the web and new technologies, what I like most is the art and the precision behind each design. With all my skills and knowledge, I will have the pleasure to devote myself fully to the development of your ideas in order to make them great projects".split(
      " ",
    );

  // Get scroll progress for the section with extended range
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Precompute transforms for all words with improved distribution
  const wordTransforms = words.map((_, index) => {
    // Calculate position in the sequence (0 to 1)
    const position = index / words.length;

    // Create a more evenly distributed range for word appearance
    const appearStart = Math.max(0, position - 0.1);
    const appearEnd = Math.max(0, position - 0.05);
    const fadeStart = Math.min(1, position + 0.05);
    const fadeEnd = Math.min(1, position + 0.1);

    const wordProgress = useTransform(
      scrollYProgress,
      [appearStart, appearEnd, fadeStart, fadeEnd],
      [0, 1, 1, 1], // Fixed to show and hide words
    );

    const wordY = useTransform(
      scrollYProgress,
      [appearStart, appearEnd, fadeStart, fadeEnd],
      [0, 0, 0, 0], // Reduced vertical motion
    );

    return { wordProgress, wordY };
  });

  return (
    <div
      id="about"
      ref={containerRef}
      className="mt-24 py-20 dark:bg-woodsmoke-950 bg-white overflow-x-hidden"
    >
      <Section className="mx-auto flex flex-row flex-wrap gap-2 justify-center max-w-4xl px-4">
        {words.map((word, index) => {
          const { wordProgress, wordY } = wordTransforms[index];

          return (
            <motion.div
              key={`${word}-${index}`}
              className="text-3xl md:text-5xl dark:text-white text-woodsmoke-950 inline-block mr-2 mb-2"
              style={{
                opacity: wordProgress,
                y: wordY,
                display: "inline-block",
              }}
            >
              {word}
            </motion.div>
          );
        })}
      </Section>
    </div>
  );
};

export default memo(About);
