import { useState, useEffect, createContext, useContext } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
}

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function useAuthProvider() {
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const { 
    data: user, 
    isLoading, 
    refetch 
  } = useQuery<User>({
    queryKey: ['/api/user/username/jane.cooper'],
    enabled: true,
    // Automatically send a request as the app starts to get the current user (default user for this demo)
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      return res.json();
    },
    onSuccess: () => {
      refetch();
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
    },
    onError: (error: any) => {
      setError(error);
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/logout", {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Logout failed",
        description: error.message || "An error occurred while logging out.",
        variant: "destructive",
      });
    },
  });

  const login = async (username: string, password: string) => {
    await loginMutation.mutate({ username, password });
  };

  const logout = async () => {
    await logoutMutation.mutate();
  };

  // In a real app, this would check for the actual user authentication status
  // For this demo, we assume the default user is authenticated
  const isAuthenticated = !!user;

  return {
    user: user || null,
    isLoading: isLoading || loginMutation.isPending || logoutMutation.isPending,
    error,
    isAuthenticated,
    login,
    logout,
  };
}
