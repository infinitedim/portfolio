"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { memo } from "react";

interface LogoProps {
  className?: string;
}

const Logo = ({ className = "" }: LogoProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Link
        href="/"
        className="text-xl font-medium tracking-tight"
      >
        D<span className="text-gray-400">.</span>
      </Link>
    </motion.div>
  );
};

export default memo(Logo);
