"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "../../hooks/useTheme";

interface LetterGlitchClientProps {
  glitchSpeed?: number;
  centerVignette?: boolean;
  outerVignette?: boolean;
  smooth?: boolean;
  characters?: string;
  className?: string;
}

interface MatrixColumn {
  x: number;
  y: number;
  speed: number;
  chars: string[];
  opacity: number[];
  lastUpdate: number;
  height: number;
}

const LetterGlitchClient: React.FC<LetterGlitchClientProps> = ({
  glitchSpeed = 50,
  centerVignette: _centerVignette = true,
  outerVignette: _outerVignette = false,
  smooth = true,
  characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝ!@#$%^&*()_+-=[]{}|;':\",./<>?",
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const columnsRef = useRef<MatrixColumn[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const isActiveRef = useRef<boolean>(true);
  const { themeConfig } = useTheme();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    isActiveRef.current = true;
    let ctx: CanvasRenderingContext2D | null = null;

    try {
      ctx = canvas.getContext("2d");
      if (!ctx) return;
    } catch (error) {
      console.error("Canvas context error:", error);
      return;
    }

    // Use the characters prop instead of hardcoded string
    const matrixChars = characters;

    const fontSize = 14;
    const columnWidth = fontSize;

    // Set canvas size and pixel ratio for crisp rendering
    const updateCanvasSize = () => {
      const { innerWidth, innerHeight, devicePixelRatio = 1 } = window;

      canvas.width = innerWidth * devicePixelRatio;
      canvas.height = innerHeight * devicePixelRatio;
      canvas.style.width = `${innerWidth}px`;
      canvas.style.height = `${innerHeight}px`;

      ctx.scale(devicePixelRatio, devicePixelRatio);
      ctx.font = `${fontSize}px 'Courier New', monospace`;
      ctx.textBaseline = "top";

      // Reinitialize columns
      initializeColumns();
    };

    // Initialize matrix columns
    const initializeColumns = () => {
      const numColumns = Math.floor(
        canvas.width / (window.devicePixelRatio || 1) / columnWidth,
      );
      columnsRef.current = [];

      for (let i = 0; i < numColumns; i++) {
        const columnHeight = Math.floor(Math.random() * 20) + 10; // 10-30 characters per column
        const column: MatrixColumn = {
          x: i * columnWidth,
          y: Math.random() * -500 - 100, // Start above screen
          speed: Math.random() * 2 + 1, // Speed between 1-3
          chars: Array.from(
            { length: columnHeight },
            () => matrixChars[Math.floor(Math.random() * matrixChars.length)],
          ),
          opacity: Array.from({ length: columnHeight }, (_, idx) =>
            Math.max(0, 1 - idx / columnHeight),
          ),
          lastUpdate: Date.now(),
          height: columnHeight,
        };
        columnsRef.current.push(column);
      }
    };

    // Get theme colors with fallbacks
    const getThemeColors = () => {
      const colors = themeConfig?.colors;
      if (!colors) {
        return {
          bg: "#000000",
          text: "#00ff41",
          accent: "#00ff41",
          muted: "#008f11",
        };
      }

      return {
        bg: colors.bg,
        text: colors.text,
        accent: colors.accent,
        muted: colors.muted,
      };
    };

    const hexToRgba = (hex: string, alpha: number = 1): string => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    // Safe requestAnimationFrame wrapper
    const safeRequestAnimationFrame = (callback: () => void): number => {
      if (
        typeof window === "undefined" ||
        !window?.requestAnimationFrame ||
        !isActiveRef.current ||
        typeof callback !== "function"
      ) {
        return 0;
      }

      try {
        return window.requestAnimationFrame(() => {
          if (typeof callback === "function" && isActiveRef.current) {
            callback();
          }
        });
      } catch (error) {
        console.error("Animation frame error:", error);
        return 0;
      }
    };

    // Animation loop with better error handling
    const animate = (): void => {
      if (!isActiveRef.current || !ctx || !canvas) return;

      try {
        const currentTime = Date.now();
        const { bg, text, accent, muted } = getThemeColors();

        // Clear canvas with slight trail effect
        ctx.fillStyle = hexToRgba(bg, 0.1);
        ctx.fillRect(
          0,
          0,
          canvas.width / (window.devicePixelRatio || 1),
          canvas.height / (window.devicePixelRatio || 1),
        );

        // Update and draw columns safely
        if (columnsRef.current && Array.isArray(columnsRef.current)) {
          columnsRef.current.forEach((column) => {
            if (!column || typeof column !== "object") return;

            column.y += column.speed;

            const newLocal =
              canvas.height / (window.devicePixelRatio || 1) +
              column.height * fontSize;

            if (column.y > newLocal) {
              column.y = Math.random() * -500 - 100;
              column.speed = Math.random() * 2 + 1;

              if (
                Math.random() < 0.3 &&
                column.chars &&
                Array.isArray(column.chars)
              ) {
                const randomIndex = Math.floor(
                  Math.random() * column.chars.length,
                );
                if (randomIndex >= 0 && randomIndex < column.chars.length) {
                  column.chars[randomIndex] =
                    matrixChars[Math.floor(Math.random() * matrixChars.length)];
                }
              }
            }

            if (
              currentTime - column.lastUpdate >
              glitchSpeed + Math.random() * 200
            ) {
              if (column.chars && Array.isArray(column.chars)) {
                const randomIndex = Math.floor(
                  Math.random() * column.chars.length,
                );
                if (randomIndex >= 0 && randomIndex < column.chars.length) {
                  column.chars[randomIndex] =
                    matrixChars[Math.floor(Math.random() * matrixChars.length)];
                  column.lastUpdate = currentTime;
                }
              }
            }

            // Draw column characters safely
            if (column.chars && Array.isArray(column.chars)) {
              column.chars.forEach((char, charIndex) => {
                if (typeof char !== "string" || !char) return;

                const charY = column.y + charIndex * fontSize;

                const newLocal_1 =
                  charY >
                  canvas.height / (window.devicePixelRatio || 1) + fontSize;

                if (charY < -fontSize || newLocal_1) {
                  return;
                }

                // Determine character color and opacity
                let color: string;
                let opacity = column.opacity?.[charIndex] || 0.5;

                if (charIndex === 0) {
                  color = accent;
                  opacity = 1;
                } else if (charIndex < 3) {
                  color = text;
                  opacity = 0.8 - charIndex * 0.2;
                } else {
                  color = muted;
                  opacity = Math.max(0.1, 0.6 - charIndex * 0.1);
                }

                ctx.fillStyle = hexToRgba(color, opacity);
                ctx.fillText(char, column.x || 0, charY);
              });
            }
          });
        }
      } catch (error) {
        console.error("Animation error:", error);
      }

      // Continue animation safely
      if (isActiveRef.current) {
        animationRef.current = safeRequestAnimationFrame(animate);
      }
    };

    setIsVisible(true);
    animate();

    return () => {
      isActiveRef.current = false;
      window.removeEventListener("resize", updateCanvasSize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [themeConfig, characters, glitchSpeed]); // Re-run when theme or props change

  if (!isVisible) {
    return <div className={`w-full h-full ${className}`} />;
  }

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 w-full h-full pointer-events-none ${className}`}
      style={{
        zIndex: -1,
        backgroundColor: "transparent",
        imageRendering: smooth ? "auto" : "pixelated",
      }}
      aria-hidden="true"
    />
  );
};

export default LetterGlitchClient;
