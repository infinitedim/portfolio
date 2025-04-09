"use client";

import { memo, useEffect, useState } from "react";
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
import { useTheme } from "next-themes";
import { cn } from "@/utils";

interface ThemeSwitcherProps {
  className?: string;
}

const ThemeSwitcher = ({ className }: ThemeSwitcherProps) => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const themes = [
    { value: "light", label: "Light", icon: SunIcon },
    { value: "dark", label: "Dark", icon: MoonIcon },
    { value: "system", label: "System", icon: ComputerDesktopIcon },
  ];

  const changeTheme = (newTheme: string) => {
    setTheme(newTheme);
  };

  const currentTheme = theme || "system";

  const CurrentThemeIcon =
    themes.find((t) => t.value === currentTheme)?.icon || SunIcon;

  if (!mounted) {
    return (
      <Button
        variant="default"
        size="icon"
        className={cn("mr-10 rounded-full", className)}
      >
        <div className="bg-white/95 backdrop-blur shadow-md rounded-full py-2 px-4 flex items-center gap-2">
          <SunIcon className="size-5" />
          <span className="text-sm font-medium">Theme</span>
        </div>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="default"
          size="icon"
          className={cn("mr-10 rounded-full", className)}
        >
          <div className="bg-white dark:bg-woodsmoke-950 backdrop-blur shadow-md rounded-full py-2 px-4 flex items-center gap-2">
            <CurrentThemeIcon className="size-5" />
            <span className="text-sm font-medium">Theme</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-32 bg-white dark:bg-woodsmoke-950"
      >
        {themes.map((themeOption) => {
          const ThemeIcon = themeOption.icon;
          return (
            <DropdownMenuItem
              key={themeOption.value}
              onClick={() => changeTheme(themeOption.value)}
              className={cn(
                "flex cursor-pointer items-center gap-2",
                currentTheme === themeOption.value && "font-bold",
              )}
            >
              <ThemeIcon className="size-4" />
              <span>{themeOption.label}</span>
              {currentTheme === themeOption.value && (
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
