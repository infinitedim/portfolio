"use client";

import { JSX, memo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LoadingScreen = (): JSX.Element => {
  const [loading, setLoading] = useState(true);
  const [percentage, setPercentage] = useState(0);
  const [currentResource, setCurrentResource] = useState("");

  useEffect(() => {
    // Failsafe timer to ensure loading screen doesn't get stuck
    const failsafeTimer = setTimeout(() => {
      setLoading(false);
    }, 8000);

    if (process.env.NODE_ENV === "development") {
      // Simplified loading for development
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

      return () => {
        clearInterval(interval);
        clearTimeout(failsafeTimer);
      };
    }

    if (typeof window !== "undefined") {
      // Skip full resource tracking if document is already complete
      if (document.readyState === "complete") {
        setPercentage(100);
        setTimeout(() => setLoading(false), 300);
        clearTimeout(failsafeTimer);
        return () => clearTimeout(failsafeTimer);
      }

      let resourceCount = 0;
      let loadedResources = 0;
      const eventListeners = new Map<
        Element,
        { loadHandler: () => void; errorHandler: () => void }
      >();

      const updatePercentage = () => {
        if (resourceCount === 0) return;
        const newPercentage = Math.min(
          Math.floor((loadedResources / resourceCount) * 100),
          100,
        );
        setPercentage(newPercentage);

        if (newPercentage >= 100) {
          setTimeout(() => setLoading(false), 500);
        }
      };

      const link = "link[rel='stylesheet']";

      const resourceElements = document.querySelectorAll(
        `script, ${link}, img`,
      );
      resourceCount = resourceElements.length;

      if (resourceCount === 0) {
        setPercentage(100);
        setTimeout(() => setLoading(false), 300);
        clearTimeout(failsafeTimer);
        return () => clearTimeout(failsafeTimer);
      }

      resourceElements.forEach((element) => {
        const isLoaded = () => {
          if (eventListeners.has(element)) {
            const { loadHandler, errorHandler } = eventListeners.get(
              element,
            ) as { loadHandler: () => void; errorHandler: () => void };
            element.removeEventListener("load", loadHandler);
            element.removeEventListener("error", errorHandler);
            eventListeners.delete(element);
          }

          loadedResources++;
          const src =
            element instanceof HTMLImageElement
              ? element.src
              : element instanceof HTMLScriptElement
                ? element.src
                : element instanceof HTMLLinkElement
                  ? element.href
                  : "";

          setCurrentResource(src.split("/").pop() || "");
          updatePercentage();
        };

        const loadHandler = isLoaded;
        const errorHandler = isLoaded;

        if (
          (element instanceof HTMLImageElement && element.complete) ||
          (element instanceof HTMLLinkElement && element.sheet)
        ) {
          isLoaded();
        } else {
          element.addEventListener("load", loadHandler);
          element.addEventListener("error", errorHandler);
          eventListeners.set(element, { loadHandler, errorHandler });
        }
      });

      const handleWindowLoad = () => {
        eventListeners.forEach(
          ({ loadHandler, errorHandler }, element: Element) => {
            element.removeEventListener("load", loadHandler);
            element.removeEventListener("error", errorHandler);
          },
        );
        eventListeners.clear();

        setPercentage(100);
        setTimeout(() => setLoading(false), 300);
      };

      window.addEventListener("load", handleWindowLoad);

      return () => {
        eventListeners.forEach(({ loadHandler, errorHandler }, element) => {
          element.removeEventListener("load", loadHandler);
          element.removeEventListener("error", errorHandler);
        });
        window.removeEventListener("load", handleWindowLoad);
        clearTimeout(failsafeTimer);
      };
    }

    return () => clearTimeout(failsafeTimer);
  }, []);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          className="fixed h-screen w-screen inset-0 dark:bg-woodsmoke-950 bg-white flex items-center justify-center z-50"
          exit={{
            opacity: 0,
            transition: { duration: 0.8, ease: "easeInOut" },
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
            className="absolute right-6 bottom-6 dark:text-white text-woodsmoke-950 font-['Inter'] font-bold text-4xl md:text-9xl"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: 1,
              scale: 1,
              transition: { duration: 0.5, ease: "easeOut" },
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
