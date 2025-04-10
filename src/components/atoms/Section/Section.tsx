import { cn } from "@/utils";
import { memo } from "react";
import type { CSSProperties, ReactNode } from "react";

interface Section {
  children: ReactNode;
  className?: string;
  isFullScreen?: boolean;
  isFullWidth?: boolean;
  hidePaddingX?: boolean;
  style?: CSSProperties;
}

const Section = ({
  children,
  className,
  isFullScreen,
  style,
  isFullWidth,
  hidePaddingX,
}: Section) => {
  return (
    <section
      style={style}
      className={cn(
        isFullScreen ? "min-h-dvh" : "h-auto",
        isFullWidth
          ? ""
          : `px-4 desktop:px-0 desktop:max-w-layout ${hidePaddingX ? "" : "mx-auto"}`,
        className,
      )}
    >
      {children}
    </section>
  );
};

export default memo(Section);
