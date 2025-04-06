import { memo } from "react";
import { motion } from "framer-motion";
import type { AnimationableSVGProps } from "@/interfaces";

const ChevronDownIcon = ({ ...props }: AnimationableSVGProps) => {
  return (
    <motion.svg
      className="size-4 text-gray-500"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 9l6 6 6-6" />
    </motion.svg>
  );
};

export default memo(ChevronDownIcon);
