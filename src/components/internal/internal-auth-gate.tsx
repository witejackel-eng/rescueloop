"use client";

import { useState, useCallback } from "react";
import { ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface InternalAuthGateProps {
  children: React.ReactNode;
}

export function InternalAuthGate({ children }: InternalAuthGateProps) {
  const [token, setToken] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("rl_internal_token") ?? "";
    }
    return "";
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== "undefined") {
      return !!sessionStorage.getItem("rl_internal_token");
    }
    return false;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/internal/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        sessionStorage.setItem("rl_internal_token", token);
        setIsAuthenticated(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Authentication failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem("rl_internal_token");
    setToken("");
    setIsAuthenticated(false);
  }, []);

  if (isAuthenticated) {
    return (
      <div>
        {/* Logout bar */}
        <div className="fixed top-0 right-0 z-50 p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-xs text-muted-foreground"
          >
            Sign out
          </Button>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <ShieldAlert className="h-7 w-7 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle>Internal Operations</CardTitle>
          <CardDescription>
            This workspace requires authentication.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <Input
              type="password"
              placeholder="Internal token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={isLoading || !token}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Authenticate
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
