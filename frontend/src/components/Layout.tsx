import type { ReactNode } from 'react';
import Navbar from './Navbar';

interface Props {
  children: ReactNode;
}

export default function Layout({ children }: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="max-w-content mx-auto px-6 py-6 w-full flex-1">
        {children}
      </main>
    </div>
  );
}