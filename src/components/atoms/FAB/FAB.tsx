"use client";

import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cog6ToothIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/utils";
import { Button, LanguageSwitcher, ThemeSwitcher } from "@/components/atoms";

interface SettingsFABProps {
  className?: string;
}

const SettingsFAB = ({ className }: SettingsFABProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleFAB = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={cn("fixed bottom-6 right-6 z-50", className)}>
      <Button
        onClick={toggleFAB}
        size="icon"
        className="size-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
      >
        <AnimatePresence
          mode="wait"
          initial={false}
        >
          <motion.div
            key={isOpen ? "close" : "settings"}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {isOpen ? (
              <XMarkIcon className="size-10 text-black" />
            ) : (
              <Cog6ToothIcon className="size-10 text-black" />
            )}
          </motion.div>
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
