import AdminHeader from "@/components/AdminHeader";
import PageTransition from "@/components/PageTransition";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-[100svh] overflow-x-hidden bg-app">
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 sm:pt-6">
        <AdminHeader />
      </div>
      <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
