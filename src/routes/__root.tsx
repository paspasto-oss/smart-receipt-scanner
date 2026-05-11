import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, LogIn } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Učtenky pokope" },
      { title: "BločkoSken – Skener bločkov" },
      { name: "description", content: "Skenujte bločky a sledujte svoje výdavky jednoducho a rýchlo." },
      { property: "og:title", content: "Učtenky pokope" },
      { property: "og:description", content: "Skenujte bločky a sledujte svoje výdavky jednoducho a rýchlo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Učtenky pokope" },
      { name: "twitter:description", content: "Skenujte bločky a sledujte svoje výdavky jednoducho a rýchlo." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/c3f5b52e-fb9a-41c8-b9da-8a41017278dc/id-preview-ced3cd5e--8ed6eed3-12f4-468c-889e-23c37eff7f3c.lovable.app-1778006883637.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/c3f5b52e-fb9a-41c8-b9da-8a41017278dc/id-preview-ced3cd5e--8ed6eed3-12f4-468c-889e-23c37eff7f3c.lovable.app-1778006883637.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <>
      <AuthBar />
      <Outlet />
      <Toaster />
    </>
  );
}

function AuthBar() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="w-full border-b bg-card/50 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-end gap-3 text-sm">
        {email ? (
          <>
            <span className="text-muted-foreground hidden sm:inline">{email}</span>
            <Button size="sm" variant="ghost" onClick={logout}>
              <LogOut className="w-4 h-4" /> Odhlásiť
            </Button>
          </>
        ) : (
          <Link to="/auth">
            <Button size="sm" variant="ghost">
              <LogIn className="w-4 h-4" /> Prihlásiť sa
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
