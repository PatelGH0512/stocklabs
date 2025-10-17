import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session?.user) redirect("/");

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background text-foreground">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-64 w-[32rem] translate-y-[-30%] rounded-full blur-3xl opacity-40 bg-primary/20" />
      <div className="relative z-10 w-full max-w-md p-6 md:p-8 rounded-2xl border bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/40 shadow-xl shadow-black/5">
        {children}
      </div>
    </main>
  );
};
export default Layout;
