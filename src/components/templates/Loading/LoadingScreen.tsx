"use client";

import { JSX, memo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LoadingScreen = (): JSX.Element => {
  const [loading, setLoading] = useState(true);
  const [percentage, setPercentage] = useState(0);
  const [currentResource, setCurrentResource] = useState("");

  useEffect(() => {
    // Don't run this on development as it will cause a fast flash
    if (process.env.NODE_ENV === "development") {
      // In development, show a simulated loading
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 5;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setTimeout(() => setLoading(false), 500);
        }
        setPercentage(Math.floor(progress));
      }, 100);

      return () => clearInterval(interval);
    }

    // For production - track actual resources loading
    if (typeof window !== "undefined") {
      let resourceCount = 0;
      let loadedResources = 0;

      // Function to update loading percentage
      const updatePercentage = () => {
        if (resourceCount === 0) return;
        const newPercentage = Math.min(Math.floor((loadedResources / resourceCount) * 100), 100);
        setPercentage(newPercentage);

        if (newPercentage >= 100) {
          setTimeout(() => setLoading(false), 500);
        }
      };

      // Count all resources that need to be loaded
      const resourceElements = document.querySelectorAll("script, link[rel=\"stylesheet\"], img");
      resourceCount = resourceElements.length;

      if (resourceCount === 0) {
        setPercentage(100);
        setTimeout(() => setLoading(false), 300);
        return;
      }

      // Track each resource
      resourceElements.forEach(element => {
        const isLoaded = () => {
          loadedResources++;
          const src = element instanceof HTMLImageElement ? element.src :
            element instanceof HTMLScriptElement ? element.src :
              element instanceof HTMLLinkElement ? element.href : "";

          setCurrentResource(src.split("/").pop() || "");
          updatePercentage();
        };

        if (
          (element instanceof HTMLScriptElement && element.onload) ||
          (element instanceof HTMLLinkElement && element.sheet) ||
          (element instanceof HTMLImageElement && element.complete)
        ) {
          isLoaded();
        } else {
          element.addEventListener("load", isLoaded);
          element.addEventListener("error", isLoaded);
        }
      });

      window.addEventListener("load", () => {
        setPercentage(100);
        setTimeout(() => setLoading(false), 300);
      });
    }
  }, []);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          className="fixed h-screen w-screen inset-0 dark:bg-woodsmoke-950 bg-white flex items-center justify-center z-50"
          exit={{
            opacity: 0,
            transition: { duration: 0.8, ease: "easeInOut" }
          }}
        >
          {/* Informasi sumber daya yang sedang dimuat */}
          <div className="absolute left-6 bottom-6 text-woodsmoke-950 dark:text-white text-sm max-w-[60%] overflow-hidden">
            {currentResource && (
              <motion.div
                key={currentResource}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                Loading: {currentResource}
              </motion.div>
            )}
          </div>

          {/* Persentase loading di kanan bawah */}
          <motion.div
            className="absolute right-6 bottom-6 dark:text-white text-woodsmoke-950 font-['Inter'] font-bold text-4xl md:text-7xl"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: 1,
              scale: 1,
              transition: { duration: 0.5, ease: "easeOut" }
            }}
          >
            {percentage}%
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default memo(LoadingScreen);