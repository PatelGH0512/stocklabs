"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import NavItems from "@/components/NavItems";
import { signOut } from "@/lib/actions/auth.actions";
import { useRouter } from "next/navigation";

const MobileNav = ({
  initialStocks,
}: {
  initialStocks: StockWithWatchlistStatus[];
}) => {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
    router.push("/sign-in");
  };

  return (
    <div className="sm:hidden relative">
      <button
        aria-label={open ? "Close navigation" : "Open navigation"}
        className="p-2 rounded-md border border-border hover:bg-muted transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-40 w-[min(92vw,24rem)]">
          <div className="rounded-2xl border border-white/10 bg-background/100 text-foreground shadow-2xl shadow-black/40 backdrop-blur-xl ring-1 ring-white/10 max-h-[70vh] overflow-y-auto">
            <NavItems initialStocks={initialStocks} />
            <div className="p-2">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full text-left rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/90 hover:bg-white/10 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileNav;
