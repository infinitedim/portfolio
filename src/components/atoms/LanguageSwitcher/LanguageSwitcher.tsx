"use client";

import { useLocale, useTranslations } from "next-intl";
import { createNavigation } from "next-intl/navigation";
import { GlobeAltIcon } from "@heroicons/react/24/outline";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/atoms";
import { cn } from "@/utils";

interface LanguageSwitcherProps {
  className?: string;
}

export const LanguageSwitcher = ({ className }: LanguageSwitcherProps) => {
  const t = useTranslations("language");
  const { useRouter, usePathname } = createNavigation();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const locales = [
    { code: "en", name: t("en") },
    { code: "id", name: t("id") },
    { code: "pt", name: t("pt") },
  ];

  const changeLanguage = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("mr-10 rounded-full", className)}
        >
          {/* <GlobeAltIcon className="h-[1.2rem] w-[1.2rem]" /> */}
          <div className="bg-white dark:bg-woodsmoke-950 backdrop-blur shadow-md rounded-full py-2 px-4 flex items-center gap-2">
            <GlobeAltIcon className="size-5 text-woodsmoke-950 dark:text-white" />
            <span className="sr-only">Switch language</span>
            <span className="text-sm font-medium">Language</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-white dark:bg-woodsmoke-950"
      >
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc.code}
            onClick={() => changeLanguage(loc.code)}
            className={cn("cursor-pointer", locale === loc.code && "font-bold")}
          >
            {loc.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
