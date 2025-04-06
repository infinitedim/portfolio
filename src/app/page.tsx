import { redirect } from "next/navigation";
import { defaultLocale } from "@/i18n";

/**
 *
 */
export default function RootPage() {
  // Redirect ke halaman dengan locale default
  redirect(`/${defaultLocale}`);
}
