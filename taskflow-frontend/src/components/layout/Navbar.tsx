import type { ReactNode } from 'react';

interface NavbarProps {
  title: string;
  actions?: ReactNode;
}

export function Navbar({ title, actions }: NavbarProps) {
  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900/50 backdrop-blur
                        flex items-center justify-between px-6 sticky top-0 z-10">
      <h1 className="font-semibold text-slate-100 text-lg">{title}</h1>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}