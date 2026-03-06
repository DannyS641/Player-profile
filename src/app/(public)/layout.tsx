import SiteHeader from "@/components/SiteHeader";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className="min-h-[100svh] overflow-x-hidden"
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgba(246,241,232,0.78) 0%, rgba(255,255,255,0.82) 45%, rgba(243,239,229,0.86) 100%), url('/kobe-wallpaper.jpg')",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "top center",
      }}
    >
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-8 sm:pt-12">
        {children}
      </main>
    </div>
  );
}
