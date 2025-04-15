"use client";

import { JSX, memo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LoadingScreen = (): JSX.Element => {
  const [loading, setLoading] = useState(true);
  const [percentage, setPercentage] = useState(0);
  const [currentResource, setCurrentResource] = useState("");
  const [resourcesReady, setResourcesReady] = useState(false);

  useEffect(() => {
    const failsafeTimer = setTimeout(() => {
      setLoading(false);
    }, 15000);

    if (process.env.NODE_ENV === "development") {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 3;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setTimeout(() => {
            setResourcesReady(true);
            setTimeout(() => setLoading(false), 500);
          }, 800);
        }
        setPercentage(Math.floor(progress));
      }, 150); // Slower interval

      return () => {
        clearInterval(interval);
        clearTimeout(failsafeTimer);
      };
    }

    if (typeof window !== "undefined") {
      const documentReadyCheck = () => {
        if (
          document.readyState === "interactive" ||
          document.readyState === "complete"
        ) {
          startResourceTracking();
        } else {
          document.addEventListener("DOMContentLoaded", startResourceTracking);
        }
      };

      const startResourceTracking = () => {
        document.removeEventListener("DOMContentLoaded", startResourceTracking);

        let resourceCount = 0;
        let loadedResources = 0;
        const eventListeners = new Map<ResourceElement, EventListeners>();
        const resourcesTracked = new Set();

        const updatePercentage = () => {
          if (resourceCount === 0) return;

          const newPercentage = Math.min(
            Math.floor((loadedResources / resourceCount) * 100),
            99, // Cap at 99% until everything is confirmed loaded
          );

          setPercentage(newPercentage);

          // Only set as ready when all resources are loaded
          if (loadedResources >= resourceCount) {
            setPercentage(100);
            setResourcesReady(true);
            // Add a small delay for visual effect
            setTimeout(() => setLoading(false), 800);
          }
        };

        const collectResources = () => {
          const stylesheets = document.querySelectorAll(
            'link[rel="stylesheet"]',
          );

          const scripts = document.querySelectorAll("script[src]");

          const images = document.querySelectorAll("img");

          const fonts = document.querySelectorAll(
            'link[rel="preload"][as="font"]',
          );

          const allResources = [
            ...stylesheets,
            ...scripts,
            ...images,
            ...fonts,
          ];

          return allResources.filter((el) => {
            const src =
              el instanceof HTMLImageElement
                ? el.src
                : el instanceof HTMLScriptElement
                  ? el.src
                  : el instanceof HTMLLinkElement
                    ? el.href
                    : "";

            if (!src || resourcesTracked.has(src)) return false;

            resourcesTracked.add(src);
            return true;
          });
        };

        // Function to handle resource loading
        interface EventListeners {
          loadHandler: () => void;
          errorHandler: () => void;
        }

        type ResourceElement =
          | HTMLImageElement
          | HTMLScriptElement
          | HTMLLinkElement;

        const trackResourceLoad = (element: ResourceElement): void => {
          const isLoaded = (): void => {
            if (eventListeners.has(element)) {
              const { loadHandler, errorHandler } = eventListeners.get(
                element,
              ) as EventListeners;
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
            (element instanceof HTMLLinkElement && element.sheet) ||
            (element instanceof HTMLScriptElement && element.onload)
          ) {
            isLoaded();
          } else {
            element.addEventListener("load", loadHandler);
            element.addEventListener("error", errorHandler);
            eventListeners.set(element, { loadHandler, errorHandler });
          }
        };

        const resources = collectResources();
        resourceCount = resources.length;

        setPercentage(5);

        if (resourceCount === 0) {
          setPercentage(100);
          setResourcesReady(true);
          setTimeout(() => setLoading(false), 800);
          clearTimeout(failsafeTimer);
          return;
        }

        resources.forEach((element) =>
          trackResourceLoad(element as ResourceElement),
        );

        const observer = new MutationObserver((mutations) => {
          const newResources: Element[] = [];

          mutations.forEach((mutation) => {
            if (mutation.type === "childList") {
              mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                  const element = node as Element;

                  if (
                    element.tagName === "IMG" ||
                    (element.tagName === "SCRIPT" &&
                      element.hasAttribute("src")) ||
                    (element.tagName === "LINK" &&
                      (element.getAttribute("rel") === "stylesheet" ||
                        (element.getAttribute("rel") === "preload" &&
                          element.getAttribute("as") === "font")))
                  ) {
                    newResources.push(element);
                  }

                  const childResources = element.querySelectorAll(
                    'img, script[src], link[rel="stylesheet"], link[rel="preload"][as="font"]',
                  );
                  childResources.forEach((el) => newResources.push(el));
                }
              });
            }
          });

          const filteredNewResources = newResources.filter((el) => {
            const src =
              el instanceof HTMLImageElement
                ? el.src
                : el instanceof HTMLScriptElement
                  ? el.src
                  : el instanceof HTMLLinkElement
                    ? el.href
                    : "";

            if (!src || resourcesTracked.has(src)) return false;

            resourcesTracked.add(src);
            return true;
          });

          if (filteredNewResources.length > 0) {
            resourceCount += filteredNewResources.length;
            filteredNewResources.forEach((element) =>
              trackResourceLoad(element as ResourceElement),
            );
          }
        });

        observer.observe(document.documentElement, {
          childList: true,
          subtree: true,
        });

        window.addEventListener("load", () => {
          setTimeout(() => {
            setPercentage(100);
            setResourcesReady(true);
            setTimeout(() => setLoading(false), 500);
            observer.disconnect();
          }, 1000);
        });

        return () => {
          eventListeners.forEach((handlers, element) => {
            const { loadHandler, errorHandler } = handlers;
            element.removeEventListener("load", loadHandler);
            element.removeEventListener("error", errorHandler);
          });
          observer.disconnect();
          clearTimeout(failsafeTimer);
        };
      };

      documentReadyCheck();
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

          {/* Additional message when resources are ready */}
          {resourcesReady && (
            <motion.div
              className="absolute top-6 text-center w-full text-woodsmoke-950 dark:text-white text-xl"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            ></motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default memo(LoadingScreen);
