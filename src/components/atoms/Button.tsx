import { ButtonProps } from "@/interfaces";
import { cn } from "@/utils";
import { FC, memo } from "react";
import "@total-typescript/ts-reset";

export const Button: FC<ButtonProps> = ({ children, className, ...props }) => {
  return (
    <button
      type="button"
      {...props}
      className={cn(className)}
    >
      {children}
    </button>
  );
};
Button.displayName = "Button";

export default memo(Button);