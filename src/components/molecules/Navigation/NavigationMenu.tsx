"use client";

import { memo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { createNavigation } from "next-intl/navigation";
import { Bars3Icon } from "@heroicons/react/24/outline";
import {
  Button,
  LanguageSwitcher,
  NavigationLink,
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/atoms";
import { useSectionObserver } from "@/hooks/useSectionObserver";

const NavigationMenu = () => {
  const { usePathname } = createNavigation();
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  const sections = [
    {
      id: "home",
      ref: useRef<HTMLElement>(null) as React.RefObject<HTMLElement>,
    },
    {
      id: "works",
      ref: useRef<HTMLElement>(null) as React.RefObject<HTMLElement>,
    },
    {
      id: "about",
      ref: useRef<HTMLElement>(null) as React.RefObject<HTMLElement>,
    },
    {
      id: "contact",
      ref: useRef<HTMLElement>(null) as React.RefObject<HTMLElement>,
    },
    {
      id: "blog",
      ref: useRef<HTMLElement>(null) as React.RefObject<HTMLElement>,
    },
  ];

  const { activeSection, scrollToSection } = useSectionObserver(sections);

  const navItems = [
    { href: "/", label: t("home"), id: "home", isSection: true },
    { href: "/#/works", label: t("works"), id: "works", isSection: true },
    { href: "/#/about", label: t("about"), id: "about", isSection: true },
    { href: "/#/contact", label: t("contact"), id: "contact", isSection: true },
    { href: "/blog", label: t("blog"), id: "blog", isSection: false },
    {
      href: "/project/list",
      label: t("projects"),
      id: "projects",
      isSection: false,
    },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:block">
        <nav>
          <ul className="flex flex-col space-y-4">
            {navItems.map((item, i) => (
              <li
                key={item.href}
                className="overflow-hidden"
              >
                <NavigationLink
                  href={item.href}
                  label={item.label}
                  isActive={
                    item.isSection
                      ? activeSection === item.id
                      : pathname === item.href
                  }
                  onClick={
                    item.isSection ? () => scrollToSection(item.id) : undefined
                  }
                  delay={0.1 * i}
                />
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <Sheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        >
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-10 p-0 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Bars3Icon className="size-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="bg-white/95 dark:bg-gray-900/95 backdrop-blur border-r dark:border-gray-800"
          >
            <nav className="mt-16">
              <ul className="flex flex-col space-y-5">
                {navItems.map((item, i) => (
                  <li
                    key={item.href}
                    className="overflow-hidden"
                  >
                    <NavigationLink
                      href={item.href}
                      label={item.label}
                      isActive={
                        item.isSection
                          ? activeSection === item.id
                          : pathname === item.href
                      }
                      onClick={
                        item.isSection
                          ? () => {
                              scrollToSection(item.id);
                              setSheetOpen(false);
                            }
                          : () => setSheetOpen(false)
                      }
                      delay={0.1 * i}
                    />
                  </li>
                ))}
              </ul>
            </nav>
            <div className="absolute bottom-5 left-5">
              <LanguageSwitcher />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

export default memo(NavigationMenu);
