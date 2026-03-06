import SiteHeader from "@/components/SiteHeader";
import PageTransition from "@/components/PageTransition";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-[100svh] overflow-x-hidden bg-app">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-8 sm:pt-12">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
