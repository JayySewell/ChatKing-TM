import { ReactNode } from "react";
import { Navigation } from "./Navigation";

interface LayoutProps {
  children: ReactNode;
  isAuthenticated?: boolean;
  isOwner?: boolean;
  username?: string;
}

export function Layout({
  children,
  isAuthenticated = false,
  isOwner = false,
  username,
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-main-bg">
      <Navigation
        isAuthenticated={isAuthenticated}
        isOwner={isOwner}
        username={username}
      />
      <main className="pt-14 sm:pt-16">
        <div className="min-h-screen">{children}</div>
      </main>
    </div>
  );
}
