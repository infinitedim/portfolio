import { createNavigation } from "next-intl/navigation";
import { motion } from "framer-motion";
import { memo } from "react";

interface LogoProps {
  className?: string;
}

const Logo = ({ className = "" }: LogoProps) => {
  const { Link } = createNavigation();
  return (
    <Link
      href="/"
      className={`inline-block ${className}`}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-xl font-medium tracking-tight block"
      >
        Dimas<span className="text-gray-400">.</span>
      </motion.span>
    </Link>
  );
};

export default memo(Logo);
