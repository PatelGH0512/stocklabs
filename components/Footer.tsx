import Link from "next/link";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-gray-600 bg-gray-800/60">
      <div className="container py-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-gray-500">© {year} StockLabs. All rights reserved.</p>
          <p className="text-xs text-gray-500">
            Built for market insights, real-time data, and personalized alerts.
          </p>
        </div>

        <nav className="flex flex-wrap gap-4 text-sm text-gray-400">
          <Link href="/" className="hover:text-yellow-500 transition-colors">Home</Link>
          <a href="#" className="hover:text-yellow-500 transition-colors">Privacy</a>
          <a href="#" className="hover:text-yellow-500 transition-colors">Terms</a>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
