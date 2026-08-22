import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import PageTransition from "@/components/PageTransition";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="safe-top min-h-[100svh] bg-app">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <AppHeader />
      </div>
      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-4 sm:px-6 sm:pb-16 sm:pt-6">
        <PageTransition>{children}</PageTransition>
      </main>
      <BottomNav />
    </div>
  );
}
