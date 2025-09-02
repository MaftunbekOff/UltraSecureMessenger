import { useQuery } from "@tanstack/react-query";

async function fetchUser() {
  const response = await fetch("/api/auth/user", {
    method: "GET",
    credentials: "include", // Include cookies
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      return null; // Not authenticated
    }
    throw new Error("Failed to fetch user");
  }

  return response.json();
}

export function useAuth() {
  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    refetch,
  };
}
