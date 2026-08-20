import SiteHeader from "@/components/SiteHeader";
import PageTransition from "@/components/PageTransition";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="safe-top min-h-[100svh] bg-app">
      <div className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6 sm:pt-6">
        <SiteHeader />
      </div>
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pt-12">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
