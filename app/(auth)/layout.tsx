import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session?.user) redirect("/");

  return (
    <main className="min-h-screen text-gray-100">
      <div className="grid min-h-screen grid-cols-1 md:grid-cols-2 md:gap-0">
        {/* Left: Image panel */}
        <section className="relative hidden md:flex items-center justify-end pr-3 md:pr-6">
          <Image
            src="/assets/images/logincard.png"
            alt="Welcome to SockLabs"
            width={520}
            height={520}
            priority
            className="w-[65%] max-w-[420px] h-auto object-contain"
          />
        </section>

        {/* Right: Form panel */}
        <section className="relative flex min-h-screen flex-col md:border-l md:border-white/10">
          {/* Form content centered */}
          <div className="flex flex-1 items-center justify-center md:justify-start px-4 md:pl-6 pb-8">
            <div className="w-full max-w-md">{children}</div>
          </div>
        </section>
      </div>
    </main>
  );
};
export default Layout;
