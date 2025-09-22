"use client";

import React, { useEffect, useRef } from "react";

interface LetterGlitchClientProps {
  className?: string;
}

interface GlitchChar {
  x: number;
  y: number;
  char: string;
  opacity: number;
  size: number;
}

const LetterGlitchClient: React.FC<LetterGlitchClientProps> = ({
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝ!@#$%^&*()_+-=[]{}|;":",./<>?';

    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    const glitchChars: GlitchChar[] = [];
    const numChars = Math.floor((window.innerWidth * window.innerHeight) / 400);

    // Initialize scattered characters
    for (let i = 0; i < numChars; i++) {
      glitchChars.push({
        y: Math.random() * canvas.height,
        x: Math.random() * canvas.width,
        opacity: Math.random() * 0.8 + 0.2,
        char: chars[Math.floor(Math.random() * chars.length)],
        size: Math.random() * 6 + 14,
      });
    }

    const animate = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.02)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      glitchChars.forEach((char) => {
        if (Math.random() < 0.1) {
          char.char = chars[Math.floor(Math.random() * chars.length)];
          char.opacity = Math.random() * 0.8 + 0.2;
        }

        ctx.font = `${char.size}px Courier New`;
        ctx.fillStyle = `rgba(0, 255, 65, ${char.opacity})`;
        ctx.fillText(char.char, char.x, char.y);
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ zIndex: 1, backgroundColor: "transparent" }}
    />
  );
};

export default LetterGlitchClient;
