import PageTransition from "@/components/PageTransition";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="safe-top min-h-[100svh] bg-app">
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-3 sm:px-6 sm:pt-8">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
