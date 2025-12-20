import { useRef, useCallback, useEffect, useState } from "react";
import { useAccessibility } from "@/components/accessibility/AccessibilityProvider";
import { useMountRef, generateId, withErrorHandling } from "./utils/hookUtils";

/**
 * Configuration options for Web Animations API
 * @interface AnimationConfig
 * @property {number} duration - Animation duration in milliseconds
 * @property {string} easing - CSS easing function (e.g., 'ease-in-out', 'cubic-bezier(0.4, 0, 0.2, 1)')
 * @property {number} [delay] - Delay before animation starts in milliseconds
 * @property {"none" | "forwards" | "backwards" | "both"} [fillMode] - How the animation applies styles before/after execution
 */
export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
  fillMode?: "none" | "forwards" | "backwards" | "both";
}

/**
 * Configuration options for typewriter effect animation
 * @interface TypewriterConfig
 * @property {number} speed - Typing speed in milliseconds per character
 * @property {boolean} cursor - Whether to show a blinking cursor during typing
 * @property {string} cursorChar - Character to use for the cursor (e.g., '▋', '|', '_')
 * @property {number} [deleteSpeed] - Speed for deleting text in milliseconds per character
 */
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
 * Custom hook for creating and managing Web Animations with automatic cleanup
 *
 * Provides a comprehensive set of animation utilities including typewriter effects,
 * glitch animations, matrix rain, and various transitions. Automatically respects
 * reduced motion preferences and handles memory cleanup.
 *
 * @returns {object} Animation functions and state
 * @property {Function} createTypewriterEffect - Create a typewriter effect on an element
 * @property {Function} createGlitchEffect - Create a glitch/distortion effect
 * @property {Function} createMatrixRain - Create a Matrix-style digital rain effect
 * @property {Function} createPulseAnimation - Create a pulsing scale animation
 * @property {Function} createSlideIn - Create a slide-in transition from any direction
 * @property {Function} createBounceAnimation - Create a bounce effect
 * @property {Function} createLoadingDots - Create animated loading dots
 * @property {Function} stopAllAnimations - Stop and cleanup all active animations
 * @property {Function} stopAnimation - Stop a specific animation by ID
 * @property {boolean} isReducedMotion - Whether user prefers reduced motion
 *
 * @example
 * ```tsx
 * const { createTypewriterEffect, createGlitchEffect, isReducedMotion } = useAnimations();
 *
 * // Typewriter effect
 * await createTypewriterEffect(element, "Hello, World!", { speed: 50 });
 *
 * // Glitch effect
 * createGlitchEffect(element, 200);
 * ```
 */
export function useAnimations() {
  const { isReducedMotion } = useAccessibility();
  const isMountedRef = useMountRef();
  const animationRefs = useRef<Map<string, Animation>>(new Map());

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

  useEffect(() => {
    if (isReducedMotion) {
      animationRefs.current.forEach((animation, id) => {
        cleanupAnimation(id);
      });
    }
  }, [isReducedMotion, cleanupAnimation]);

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

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        timerId = setTimeout(typeNextChar, fullConfig.speed);
      });
    },
    [isReducedMotion, isMountedRef],
  );

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

        const changeChar = setInterval(
          () => {
            drop.textContent =
              characters[Math.floor(Math.random() * characters.length)];
          },
          speed + Math.random() * 200,
        );

        dropIntervals.push(changeChar);

        drop.addEventListener("animationiteration", () => {
          drop.style.left = Math.random() * 100 + "%";
        });
      }

      return () => {
        dropIntervals.forEach((interval) => {
          clearInterval(interval);
        });

        dropElements.forEach((drop) => {
          if (drop.parentNode) {
            drop.parentNode.removeChild(drop);
          }
        });
      };
    },
    [isReducedMotion],
  );

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

  const stopAllAnimations = useCallback(() => {
    animationRefs.current.forEach((animation, id) => {
      cleanupAnimation(id);
    });
  }, [cleanupAnimation]);

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

/**
 * Specialized hook for terminal-specific animations
 *
 * Extends useAnimations with terminal-optimized presets for command output,
 * errors, and theme transitions.
 *
 * @returns {object} Terminal animation functions and state
 * @property {Function} animateCommandOutput - Animate command output with typewriter effect
 * @property {Function} animateCommandError - Animate error messages with glitch effect
 * @property {Function} animateThemeChange - Animate theme transitions with slide and bounce
 * @property {boolean} isTyping - Whether typewriter animation is currently active
 * @property {...} - All functions from useAnimations
 *
 * @example
 * ```tsx
 * const { animateCommandOutput, isTyping } = useTerminalAnimations();
 *
 * // Animate command output
 * await animateCommandOutput(outputElement, "Command executed successfully");
 * ```
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
