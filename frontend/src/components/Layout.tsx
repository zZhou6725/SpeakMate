import type { ReactNode } from 'react';
import Navbar from './Navbar';

interface Props {
  children: ReactNode;
}

export default function Layout({ children }: Props) {
  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <main className="max-w-content mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}