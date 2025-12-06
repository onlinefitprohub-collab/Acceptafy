import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

interface SessionResponse {
  authenticated: boolean;
  user?: User;
}

interface LoginResponse {
  success: boolean;
  user?: User;
  message?: string;
}

export function useAuth() {
  const { data: session, isLoading, error, refetch } = useQuery<SessionResponse>({
    queryKey: ["/api/auth/session"],
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      return response.json() as Promise<LoginResponse>;
    },
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
    logout,
    refetch,
  };
}
