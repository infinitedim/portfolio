"use client";

import { ForwardedRef, forwardRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/utils";

interface SectionProps {
  id: string;
  className?: string;
  children: React.ReactNode;
}

export const Section = forwardRef(
  (
    { id, className, children }: SectionProps,
    ref: ForwardedRef<HTMLElement>,
  ) => {
    return (
      <section
        id={id}
        ref={ref}
        className={cn(
          "min-h-screen scroll-mt-20 py-16 md:py-24", // scroll-mt-20 kompensasi untuk header
          className,
        )}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true, amount: 0.2 }}
          className="container mx-auto px-4"
        >
          {children}
        </motion.div>
      </section>
    );
  },
);

Section.displayName = "Section";
