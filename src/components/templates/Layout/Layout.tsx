import { type ReactNode, memo } from "react";
import { Header } from "@/components/organisms";
import { useTranslations } from "next-intl";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const locale = useTranslations("common");
  return (
    <div className="min-h-screen w-screen justify-center bg-white dark:bg-woodsmoke-950">
      {/* Development notification banner */}
      <div className="bg-yellow-500 md:ml-[200px] text-center py-2 px-4 text-black font-medium">
        <p>🚧 {locale("development")} 🚧</p>
      </div>
      <Header />
      <main className="pt-24 md:ml-[200px] md:pt-28">
        <div className="container mx-auto px-6 md:px-12">{children}</div>
      </main>
    </div>
  );
};

export default memo(Layout);
