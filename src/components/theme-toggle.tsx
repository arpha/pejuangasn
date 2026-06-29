'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl border border-border/40 shrink-0">
        <div className="h-4 w-4" />
      </Button>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="w-9 h-9 rounded-xl border border-border/40 hover:bg-muted/50 hover:text-foreground transition-all duration-300 relative overflow-hidden shrink-0"
      aria-label="Toggle Theme"
    >
      <div className="relative w-full h-full flex items-center justify-center">
        <Sun className={`h-4 w-4 absolute transition-all duration-500 transform ${
          isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
        } text-amber-500`} />
        <Moon className={`h-4 w-4 absolute transition-all duration-500 transform ${
          isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
        } text-indigo-400`} />
      </div>
    </Button>
  );
}
