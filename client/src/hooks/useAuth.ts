import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";

interface SessionResponse {
  authenticated: boolean;
  user?: User;
}

interface AuthResponse {
  success: boolean;
  user?: User;
  message?: string;
}

async function authRequest(url: string, credentials: { email: string; password: string }): Promise<AuthResponse> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
    credentials: "include",
  });
  
  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.message || "Authentication failed");
  }
  
  return data;
}

export function useAuth() {
  const { data: session, isLoading, error, refetch } = useQuery<SessionResponse>({
    queryKey: ["/api/auth/session"],
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: (credentials: { email: string; password: string }) => 
      authRequest("/api/auth/login", credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: (credentials: { email: string; password: string }) => 
      authRequest("/api/auth/register", credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
    },
  });

  const logout = async () => {
    window.location.href = "/api/logout";
  };

  return {
    user: session?.user,
    isLoading,
    isAuthenticated: session?.authenticated ?? false,
    error,
    login: loginMutation.mutateAsync,
    loginError: loginMutation.error,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutateAsync,
    registerError: registerMutation.error,
    isRegistering: registerMutation.isPending,
    logout,
    refetch,
  };
}
