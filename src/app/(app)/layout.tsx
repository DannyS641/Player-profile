import AppHeader from "@/components/AppHeader";
import PageTransition from "@/components/PageTransition";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-[100svh] overflow-x-hidden bg-app">
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-8 sm:pt-12">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
