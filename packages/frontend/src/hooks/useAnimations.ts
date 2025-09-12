import { useRef, useCallback, useEffect, useState } from "react";
import { useAccessibility } from "@portfolio/frontend/src/components/accessibility/AccessibilityProvider";
import { useMountRef, generateId, withErrorHandling } from "./utils/hookUtils";

export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
  fillMode?: "none" | "forwards" | "backwards" | "both";
}

export interface TypewriterConfig {
  speed: number;
  cursor: boolean;
  cursorChar: string;
  deleteSpeed?: number;
}

const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  duration: 300,
  easing: "cubic-bezier(0.4, 0, 0.2, 1)",
  delay: 0,
  fillMode: "forwards",
};

const DEFAULT_TYPEWRITER_CONFIG: TypewriterConfig = {
  speed: 50,
  cursor: true,
  cursorChar: "▋",
  deleteSpeed: 30,
};

/**
 * Hook for creating animations with improved memory management
 * @returns {object} - The animation functions and state
 */
export function useAnimations() {
  const { isReducedMotion } = useAccessibility();
  const isMountedRef = useMountRef();
  const animationRefs = useRef<Map<string, Animation>>(new Map());

  // Cleanup function for animations
  const cleanupAnimation = useCallback((id: string) => {
    const animation = animationRefs.current.get(id);
    if (animation) {
      try {
        animation.cancel();
      } catch (error) {
        console.warn("Error canceling animation:", error);
      }
      animationRefs.current.delete(id);
    }
  }, []);

  // Stop all animations if reduced motion is preferred
  useEffect(() => {
    if (isReducedMotion) {
      animationRefs.current.forEach((animation, id) => {
        cleanupAnimation(id);
      });
    }
  }, [isReducedMotion, cleanupAnimation]);

  // Cleanup all animations on unmount
  useEffect(() => {
    const animations = animationRefs.current;
    return () => {
      animations.forEach((animation) => {
        try {
          animation.cancel();
        } catch (error) {
          console.warn("Error canceling animation on unmount:", error);
        }
      });
      animations.clear();
    };
  }, []);

  /**
   * Create typewriter effect for text
   * @param {HTMLElement} element - The element to animate
   * @param {string} text - The text to animate
   * @param {Partial<TypewriterConfig>} config - The configuration for the typewriter effect
   * @returns {Promise<void>} - A promise that resolves when the animation is complete
   */
  const createTypewriterEffect = useCallback(
    async (
      element: HTMLElement,
      text: string,
      config: Partial<TypewriterConfig> = {},
    ): Promise<void> => {
      if (isReducedMotion) {
        element.textContent = text;
        return;
      }

      const fullConfig = { ...DEFAULT_TYPEWRITER_CONFIG, ...config };
      element.textContent = "";

      if (fullConfig.cursor) {
        element.classList.add("typing-cursor");
      }

      return new Promise((resolve) => {
        let i = 0;
        let timerId: NodeJS.Timeout;

        const typeNextChar = () => {
          if (!isMountedRef.current) {
            // Component unmounted, cleanup and resolve
            if (fullConfig.cursor) {
              element.classList.remove("typing-cursor");
            }
            resolve();
            return;
          }

          if (i < text.length) {
            element.textContent = text.slice(0, i + 1);
            i++;
            timerId = setTimeout(typeNextChar, fullConfig.speed);
          } else {
            if (fullConfig.cursor) {
              element.classList.remove("typing-cursor");
            }
            resolve();
          }
        };

        // Start typing
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        timerId = setTimeout(typeNextChar, fullConfig.speed);

        // Store cleanup function (though this approach with setTimeout is better than setInterval)
      });
    },
    [isReducedMotion, isMountedRef],
  );

  /**
   * Create glitch effect with improved memory management
   */
  const createGlitchEffect = useCallback(
    (element: HTMLElement, duration: number = 200): Animation | null => {
      if (isReducedMotion || !isMountedRef.current) return null;

      return withErrorHandling(() => {
        const keyframes = [
          { transform: "translate(0)", filter: "none", offset: 0 },
          {
            transform: "translate(-2px, 2px)",
            filter: "hue-rotate(90deg) saturate(1.5)",
            offset: 0.2,
          },
          {
            transform: "translate(-1px, -1px)",
            filter: "hue-rotate(180deg) saturate(2)",
            offset: 0.4,
          },
          {
            transform: "translate(1px, 1px)",
            filter: "hue-rotate(270deg) saturate(1.5)",
            offset: 0.6,
          },
          {
            transform: "translate(0.5px, -0.5px)",
            filter: "hue-rotate(45deg) saturate(1.2)",
            offset: 0.8,
          },
          { transform: "translate(0)", filter: "none", offset: 1 },
        ];

        const animation = element.animate(keyframes, {
          duration,
          easing: "steps(4, end)",
          iterations: 1,
        });

        const id = generateId("glitch");
        animationRefs.current.set(id, animation);

        animation.addEventListener("finish", () => {
          if (isMountedRef.current) {
            cleanupAnimation(id);
          }
        });

        return animation;
      }, null)();
    },
    [isReducedMotion, isMountedRef, cleanupAnimation],
  );

  /**
   * Create matrix rain effect
   */
  const createMatrixRain = useCallback(
    (
      container: HTMLElement,
      options: {
        characters?: string;
        drops?: number;
        speed?: number;
        color?: string;
      } = {},
    ): (() => void) => {
      if (isReducedMotion) return () => {};

      const {
        characters = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789",
        drops = 20,
        speed = 100,
        color = "#00ff00",
      } = options;

      const dropElements: HTMLElement[] = [];
      const dropIntervals: NodeJS.Timeout[] = [];

      // Create drops
      for (let i = 0; i < drops; i++) {
        const drop = document.createElement("div");
        drop.className = "matrix-drop";
        drop.style.cssText = `
          position: absolute;
          left: ${Math.random() * 100}%;
          top: -20px;
          color: ${color};
          font-family: monospace;
          font-size: 14px;
          animation: matrixFall ${2 + Math.random() * 3}s linear infinite;
          animation-delay: ${Math.random() * 2}s;
          opacity: ${0.7 + Math.random() * 0.3};
          pointer-events: none;
          z-index: -1;
        `;

        drop.textContent =
          characters[Math.floor(Math.random() * characters.length)];
        container.appendChild(drop);
        dropElements.push(drop);

        // Change character periodically
        const changeChar = setInterval(
          () => {
            drop.textContent =
              characters[Math.floor(Math.random() * characters.length)];
          },
          speed + Math.random() * 200,
        );

        // Store interval for cleanup
        dropIntervals.push(changeChar);

        drop.addEventListener("animationiteration", () => {
          drop.style.left = Math.random() * 100 + "%";
        });
      }

      // Enhanced cleanup function
      return () => {
        // Clear all intervals
        dropIntervals.forEach((interval) => {
          clearInterval(interval);
        });

        // Remove DOM elements
        dropElements.forEach((drop) => {
          if (drop.parentNode) {
            drop.parentNode.removeChild(drop);
          }
        });
      };
    },
    [isReducedMotion],
  );

  /**
   * Create pulse animation
   */
  const createPulseAnimation = useCallback(
    (
      element: HTMLElement,
      config: Partial<AnimationConfig> = {},
    ): Animation | null => {
      if (isReducedMotion) return null;

      const fullConfig = { ...DEFAULT_ANIMATION_CONFIG, ...config };
      const keyframes = [
        { transform: "scale(1)", opacity: 1 },
        { transform: "scale(1.05)", opacity: 0.8 },
        { transform: "scale(1)", opacity: 1 },
      ];

      const animation = element.animate(keyframes, {
        duration: fullConfig.duration,
        easing: fullConfig.easing,
        iterations: Infinity,
      });

      const id = `pulse-${Date.now()}`;
      animationRefs.current.set(id, animation);

      return animation;
    },
    [isReducedMotion],
  );

  /**
   * Create slide-in animation
   */
  const createSlideIn = useCallback(
    (
      element: HTMLElement,
      direction: "left" | "right" | "up" | "down" = "up",
      config: Partial<AnimationConfig> = {},
    ): Animation | null => {
      if (isReducedMotion) {
        element.style.opacity = "1";
        element.style.transform = "none";
        return null;
      }

      const fullConfig = { ...DEFAULT_ANIMATION_CONFIG, ...config };
      const transforms = {
        left: ["translateX(-100%)", "translateX(0)"],
        right: ["translateX(100%)", "translateX(0)"],
        up: ["translateY(50px)", "translateY(0)"],
        down: ["translateY(-50px)", "translateY(0)"],
      };

      const keyframes = [
        {
          transform: transforms[direction][0],
          opacity: 0,
          offset: 0,
        },
        {
          transform: transforms[direction][1],
          opacity: 1,
          offset: 1,
        },
      ];

      const animation = element.animate(keyframes, {
        duration: fullConfig.duration,
        easing: fullConfig.easing,
        delay: fullConfig.delay,
        fill: fullConfig.fillMode,
      });

      const id = `slide-${direction}-${Date.now()}`;
      animationRefs.current.set(id, animation);
      animation.addEventListener("finish", () => {
        animationRefs.current.delete(id);
      });

      return animation;
    },
    [isReducedMotion],
  );

  /**
   * Create bounce animation
   */
  const createBounceAnimation = useCallback(
    (
      element: HTMLElement,
      config: Partial<AnimationConfig> = {},
    ): Animation | null => {
      if (isReducedMotion) return null;

      const fullConfig = { ...DEFAULT_ANIMATION_CONFIG, ...config };
      const keyframes = [
        { transform: "scale(1)", offset: 0 },
        { transform: "scale(1.1)", offset: 0.5 },
        { transform: "scale(1)", offset: 1 },
      ];

      const animation = element.animate(keyframes, {
        duration: fullConfig.duration,
        easing: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        delay: fullConfig.delay,
      });

      const id = `bounce-${Date.now()}`;
      animationRefs.current.set(id, animation);
      animation.addEventListener("finish", () => {
        animationRefs.current.delete(id);
      });

      return animation;
    },
    [isReducedMotion],
  );

  /**
   * Create loading dots animation
   */
  const createLoadingDots = useCallback(
    (container: HTMLElement, dotCount: number = 3): (() => void) => {
      if (isReducedMotion) {
        container.textContent = "...";
        return () => {};
      }

      container.innerHTML = "";
      const dots: HTMLElement[] = [];

      for (let i = 0; i < dotCount; i++) {
        const dot = document.createElement("span");
        dot.textContent = "●";
        dot.style.cssText = `
          display: inline-block;
          margin: 0 2px;
          animation: loadingDot 1.4s ease-in-out infinite both;
          animation-delay: ${i * 0.16}s;
        `;
        container.appendChild(dot);
        dots.push(dot);
      }

      return () => {
        container.innerHTML = "";
      };
    },
    [isReducedMotion],
  );

  /**
   * Stop all animations with improved error handling
   */
  const stopAllAnimations = useCallback(() => {
    animationRefs.current.forEach((animation, id) => {
      cleanupAnimation(id);
    });
  }, [cleanupAnimation]);

  /**
   * Stop specific animation with improved error handling
   */
  const stopAnimation = useCallback(
    (animationId: string) => {
      cleanupAnimation(animationId);
    },
    [cleanupAnimation],
  );

  return {
    createTypewriterEffect,
    createGlitchEffect,
    createMatrixRain,
    createPulseAnimation,
    createSlideIn,
    createBounceAnimation,
    createLoadingDots,
    stopAllAnimations,
    stopAnimation,
    isReducedMotion,
  };
}

// Specialized hook for terminal animations
/**
 * Specialized hook for terminal animations
 * @returns {object} - The animation functions and state
 */
export function useTerminalAnimations() {
  const animations = useAnimations();
  const [isTyping, setIsTyping] = useState(false);

  const animateCommandOutput = useCallback(
    async (element: HTMLElement, content: string) => {
      setIsTyping(true);
      await animations.createTypewriterEffect(element, content, {
        speed: 30,
        cursor: false,
      });
      setIsTyping(false);
    },
    [animations],
  );

  const animateCommandError = useCallback(
    (element: HTMLElement) => {
      animations.createGlitchEffect(element, 300);
      element.style.color = "#ff0000";
    },
    [animations],
  );

  const animateThemeChange = useCallback(
    (element: HTMLElement) => {
      const animation = animations.createSlideIn(element, "up", {
        duration: 500,
      });
      if (animation) {
        animation.addEventListener("finish", () => {
          animations.createBounceAnimation(element, { duration: 200 });
        });
      }
    },
    [animations],
  );

  return {
    ...animations,
    animateCommandOutput,
    animateCommandError,
    animateThemeChange,
    isTyping,
  };
}
