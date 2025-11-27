"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="h-8 w-8 rounded-full"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <Sun className={`h-4 w-4 ${isDark ? "hidden" : "inline-block"}`} />
      <Moon className={`h-4 w-4 ${isDark ? "inline-block" : "hidden"}`} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
