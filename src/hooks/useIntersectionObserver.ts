/* eslint-disable jsdoc/no-undefined-types */

"use client";

import React, { useState, useEffect, useRef, RefObject } from "react";

interface UseIntersectionObserverProps {
  threshold?: number;
  rootMargin?: string;
}

/**
 * A custom hook to observe the intersection of an element with the viewport.
 * @param {object} root0 - The options for the intersection observer.
 * @param {number} [root0.threshold] - A number between 0 and 1 indicating the percentage of the target's visibility the observer's callback should trigger.
 * @param {string} [root0.rootMargin] - A margin around the root. Can have values similar to the CSS margin property.
 * @returns {{ ref: React.RefObject<T>, isIntersecting: boolean }} - An object containing the ref to attach to the element and a boolean indicating if the element is intersecting.
 */
export function useIntersectionObserver<T extends HTMLElement>({
  threshold = 0.3,
  rootMargin = "0px",
}: UseIntersectionObserverProps = {}): {
  ref: RefObject<T | null>;
  isIntersecting: boolean;
} {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<T>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold, rootMargin },
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold, rootMargin]);

  return { ref, isIntersecting };
}
