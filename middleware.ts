import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "./src/i18n";

console.log(
  "Middleware loaded with locales:",
  locales,
  "default:",
  defaultLocale,
);

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localeDetection: true,
  localePrefix: "always",
});

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Cek apakah ini adalah path root
  if (pathname === "/") {
    // Redirect ke path dengan locale default
    return NextResponse.redirect(new URL(`/${defaultLocale}`, request.url));
  }

  // Untuk path lain, gunakan middleware next-intl
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
