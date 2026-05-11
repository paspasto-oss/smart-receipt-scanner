import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Receipt } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        toast.success("Účet vytvorený, prihlasujem...");
        const { error: e2 } = await supabase.auth.signInWithPassword({ email, password });
        if (e2) throw e2;
        navigate({ to: "/" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Prihlásený");
        navigate({ to: "/" });
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Chyba pri prihlásení");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
            <Receipt className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">{mode === "login" ? "Prihlásenie" : "Registrácia"}</h1>
          <p className="text-sm text-muted-foreground">
            {mode === "login" ? "Prihláste sa do svojho účtu" : "Vytvorte si nový účet"}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Heslo</Label>
            <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Pracujem..." : mode === "login" ? "Prihlásiť sa" : "Zaregistrovať sa"}
          </Button>
        </form>
        <div className="text-center text-sm">
          {mode === "login" ? (
            <>Nemáte účet?{" "}
              <button className="text-primary underline" onClick={() => setMode("signup")}>Registrovať sa</button>
            </>
          ) : (
            <>Máte už účet?{" "}
              <button className="text-primary underline" onClick={() => setMode("login")}>Prihlásiť sa</button>
            </>
          )}
        </div>
        <div className="text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:underline">Späť na úvod</Link>
        </div>
      </Card>
    </div>
  );
}