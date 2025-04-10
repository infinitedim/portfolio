"use client";

import { useEffect, useState } from "react";

const Cursor = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [followerPosition, setFollowerPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const mouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });

      setTimeout(() => {
        setFollowerPosition({ x: e.clientX, y: e.clientY });
      }, 80);
    };

    const handleMouseOver = () => setIsHovering(true);
    const handleMouseLeave = () => setIsHovering(false);
    const handleMouseEnter = () => setIsVisible(true);
    const handleMouseOut = () => setIsVisible(false);

    document.addEventListener("mousemove", mouseMove);
    document.addEventListener("mouseenter", handleMouseEnter);
    document.addEventListener("mouseleave", handleMouseOut);

    const role = "[role='button']";

    const interactiveElements = document.querySelectorAll(
      `a, button, input, textarea, ${role}`,
    );
    interactiveElements.forEach((el) => {
      el.addEventListener("mouseover", handleMouseOver);
      el.addEventListener("mouseleave", handleMouseLeave);
    });

    return () => {
      document.removeEventListener("mousemove", mouseMove);
      document.removeEventListener("mouseenter", handleMouseEnter);
      document.removeEventListener("mouseleave", handleMouseOut);

      interactiveElements.forEach((el) => {
        el.removeEventListener("mouseover", handleMouseOver);
        el.removeEventListener("mouseleave", handleMouseLeave);
      });
    };
  }, []);

  if (typeof window === "undefined") return null;

  return (
    <div
      className={`fixed pointer-events-none z-50 ${isVisible ? "opacity-100" : "opacity-0"}`}
    >
      <div
        className={`fixed -translate-x-1/2 -translate-y-1/2 rounded-full transition-all${
          isHovering ? "size-4 bg-blue-600" : "size-2 bg-blue-600"
        }`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: 11,
        }}
      />
      <div
        className={`fixed -translate-x-1/2 -translate-y-1/2 rounded-full border transition-all${
          isHovering
            ? "size-12 border-blue-600/20"
            : "size-8 border-blue-600/30"
        }`}
        style={{
          left: `${followerPosition.x}px`,
          top: `${followerPosition.y}px`,
          zIndex: 10,
        }}
      />
    </div>
  );
};

export default Cursor;
