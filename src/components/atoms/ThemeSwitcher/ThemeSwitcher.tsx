"use client";

import { memo, useState } from "react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/atoms";
import {
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/utils";

interface ThemeSwitcherProps {
  className?: string;
}

const ThemeSwitcher = ({ className }: ThemeSwitcherProps) => {
  const [currentTheme, setCurrentTheme] = useState("system");

  const themes = [
    { value: "light", label: "Light", icon: SunIcon },
    { value: "dark", label: "Dark", icon: MoonIcon },
    { value: "system", label: "System", icon: ComputerDesktopIcon },
  ];

  const changeTheme = (theme: string) => {
    setCurrentTheme(theme);
    console.log(
      `Theme would change to: ${theme} (No actual functionality implemented)`,
    );
  };

  const CurrentThemeIcon =
    themes.find((theme) => theme.value === currentTheme)?.icon || SunIcon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="default"
          size="icon"
          className={cn("mr-10 rounded-full", className)}
        >
          <div className="bg-white/95 backdrop-blur shadow-md rounded-full py-2 px-4 flex items-center gap-2">
            <CurrentThemeIcon className="size-5" />
            <span className="text-sm font-medium">Theme</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-32 bg-white"
      >
        {themes.map((theme) => {
          const ThemeIcon = theme.icon;
          return (
            <DropdownMenuItem
              key={theme.value}
              onClick={() => changeTheme(theme.value)}
              className={cn(
                "flex cursor-pointer items-center gap-2",
                currentTheme === theme.value && "font-bold",
              )}
            >
              <ThemeIcon className="size-4" />
              <span>{theme.label}</span>
              {currentTheme === theme.value && (
                <span className="ml-auto text-primary">✓</span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default memo(ThemeSwitcher);
