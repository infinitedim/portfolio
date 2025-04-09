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

/**
 * Middleware function to handle locale-based routing.
 * @param {NextRequest} request - The incoming request object.
 * @returns {NextResponse} The response object after processing the request.
 */
export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    return NextResponse.redirect(new URL(`/${defaultLocale}`, request.url));
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
