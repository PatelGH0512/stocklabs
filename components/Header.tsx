import Link from "next/link";
import NavItems from "@/components/NavItems";
import UserDropdown from "@/components/UserDropdown";
import {searchStocks} from "@/lib/actions/finnhub.actions";
import ThemeToggle from "@/components/ThemeToggle";

const Header = async ({ user }: { user: User }) => {
    const initialStocks = await searchStocks();

    return (
        <header className="sticky top-0 header">
            <div className="container header-wrapper">
                <Link href="/" className="cursor-pointer select-none">
                    <span className="text-xl font-semibold text-foreground tracking-tight">StockLabs</span>
                </Link>
                <nav className="hidden sm:block">
                    <NavItems initialStocks={initialStocks} />
                </nav>

                <div className="flex items-center gap-3">
                    <UserDropdown user={user} initialStocks={initialStocks} />
                    <ThemeToggle />
                </div>
            </div>
        </header>
    )
}
export default Header
