import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import { ThemeToggle } from '../components/ThemeToggle';

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <div className="app-root">
        <header className="app-header">
          <div className="brand">Nexus AI</div>
          <div className="header-controls">
            <ThemeToggle />
          </div>
        </header>
        <main className="app-main">
          <Component {...pageProps} />
        </main>
      </div>
    </SessionProvider>
  );
}

export default MyApp;
