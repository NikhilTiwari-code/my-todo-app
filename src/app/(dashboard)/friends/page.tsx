"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

interface UserStats {
  totalTodos: number;
  completedTodos: number;
  activeTodos: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  stats: UserStats;
}

async function fetchUsers(): Promise<{ users: User[]; total: number }> {
  const res = await fetch("/api/users");
  if (!res.ok) throw new Error("Failed to fetch users");
  const data = await res.json();
  return data.data;
}

export default function FriendsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const filteredUsers = data?.users.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 text-center text-red-600">
          Failed to load users. Please try again.
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Friends 👥</h1>
        <p className="text-muted-foreground">
          Discover what others are working on
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
        />
      </div>

      {/* Stats */}
      {!isLoading && (
        <div className="mb-6 text-sm text-muted-foreground">
          Showing {filteredUsers?.length || 0} of {data?.total || 0} users
        </div>
      )}

      {/* Users Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-16 w-16 rounded-full mb-4" />
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-20 w-full" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers?.map((user) => (
            <Card
              key={user.id}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/friends/${user.id}`)}
            >
              {/* User Avatar */}
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-semibold text-lg">{user.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Total Todos
                  </span>
                  <span className="font-semibold">
                    {user.stats.totalTodos}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Completed
                  </span>
                  <span className="font-semibold text-green-600">
                    {user.stats.completedTodos}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Active
                  </span>
                  <span className="font-semibold text-orange-600">
                    {user.stats.activeTodos}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              {user.stats.totalTodos > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold">
                      {Math.round(
                        (user.stats.completedTodos / user.stats.totalTodos) *
                          100
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          (user.stats.completedTodos / user.stats.totalTodos) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* View Button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/friends/${user.id}`);
                }}
              >
                View Todos →
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredUsers?.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold mb-2">No users found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search criteria
          </p>
        </Card>
      )}
    </div>
  );
}
