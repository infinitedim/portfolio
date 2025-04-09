import { type ReactNode, memo } from "react";
import { Header } from "@/components/organisms";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen w-screen bg-white dark:bg-woodsmoke-950">
      <Header />
      <main className="pt-24 md:ml-[200px] md:pt-28">
        <div className="container mx-auto px-6 md:px-12">{children}</div>
      </main>
    </div>
  );
};

export default memo(Layout);
