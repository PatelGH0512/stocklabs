"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("theme") as "light" | "dark" | null;
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initial = saved ?? (prefersDark ? "dark" : "light");
      setTheme(initial);
    } catch {}
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement.classList;
    if (theme === "dark") root.add("dark");
    else root.remove("dark");
    try { localStorage.setItem("theme", theme); } catch {}
  }, [theme, mounted]);

  if (!mounted) return null;

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      className="group inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-muted transition-colors"
      title={theme === "dark" ? "Switch to light" : "Switch to dark"}
    >
      {theme === "dark" ? (
        // Sun icon
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
          <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z"/>
          <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75Zm0 16.5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V19.5a.75.75 0 0 1 .75-.75Zm9-6a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5H20.25a.75.75 0 0 1 .75.75Zm-16.5 0a.75.75 0 0 1-.75.75H2.25a.75.75 0 0 1 0-1.5H3.75a.75.75 0 0 1 .75.75Zm12.728 6.728a.75.75 0 0 1-1.06 0l-1.06-1.06a.75.75 0 1 1 1.06-1.061l1.06 1.06a.75.75 0 0 1 0 1.061Zm-9.546-9.546a.75.75 0 0 1-1.06 0L4.511 7.816a.75.75 0 0 1 1.06-1.06l1.061 1.06a.75.75 0 0 1 0 1.061Zm9.546-6.485a.75.75 0 0 1 0 1.06L16.167 5.07a.75.75 0 1 1-1.06-1.06l1.06-1.061a.75.75 0 0 1 1.061 0ZM7.29 18.238a.75.75 0 0 1 0-1.06l1.06-1.061a.75.75 0 1 1 1.061 1.06l-1.06 1.061a.75.75 0 0 1-1.061 0Z" clipRule="evenodd"/>
        </svg>
      ) : (
        // Moon icon
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
          <path d="M21.752 15.002A9 9 0 1 1 9 2.248a.75.75 0 0 1 .832.99A7.5 7.5 0 0 0 20.51 14.17a.75.75 0 0 1 1.242.832Z"/>
        </svg>
      )}
    </button>
  );
}
