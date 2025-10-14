"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { FollowButton } from "@/components/users/FollowButton";
import { UserAvatar } from "@/components/users/UserAvatar";

interface Todo {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  isCompleted: boolean;
  dueDate?: string;
  createdAt: string;
}

interface UserStats {
  totalTodos: number;
  completedTodos: number;
  activeTodos: number;
  completionRate: number;
  followersCount: number;
  followingCount: number;
}

interface UserData {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    bio?: string;
    createdAt: string;
  };
  stats: UserStats;
  recentTodos: Todo[];
  isFollowing: boolean;
  isCurrentUser: boolean;
}

interface TodosData {
  todos: Todo[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
}

async function fetchUser(userId: string): Promise<UserData> {
  const res = await fetch(`/api/users/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch user");
  const data = await res.json();
  return data.data;
}

async function fetchUserTodos(
  userId: string,
  page: number,
  filter: string
): Promise<TodosData> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: "10",
  });

  if (filter !== "all") {
    params.append("completed", filter === "completed" ? "true" : "false");
  }

  const res = await fetch(`/api/users/${userId}/todos?${params}`);
  if (!res.ok) throw new Error("Failed to fetch todos");
  const data = await res.json();
  return data.data;
}

const priorityColors = {
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  medium:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  
  // Local state for real-time updates
  const [localFollowersCount, setLocalFollowersCount] = useState<number | null>(null);
  const [localIsFollowing, setLocalIsFollowing] = useState<boolean | null>(null);

  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => fetchUser(userId),
  });

  const { data: todosData, isLoading: todosLoading } = useQuery({
    queryKey: ["userTodos", userId, page, filter],
    queryFn: () => fetchUserTodos(userId, page, filter),
  });
  
  // Use local state if available, otherwise use fetched data
  const followersCount = localFollowersCount !== null ? localFollowersCount : userData?.stats.followersCount || 0;
  const isFollowing = localIsFollowing !== null ? localIsFollowing : userData?.isFollowing || false;

  if (userLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-96 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">😕</div>
          <h3 className="text-xl font-semibold mb-2">User not found</h3>
          <Button onClick={() => router.push("/friends")}>
            Back to Friends
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Button
        variant="outline"
        onClick={() => router.push("/friends")}
        className="mb-6"
      >
        ← Back to Friends
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Info Sidebar */}
        <div className="space-y-6">
          {/* Profile Card */}
          <Card className="p-6">
            <div className="flex flex-col items-center text-center">
              <UserAvatar avatar={userData.user.avatar} name={userData.user.name} size="xl" />
              <h1 className="text-2xl font-bold mb-1 mt-4">{userData.user.name}</h1>
              <p className="text-sm text-muted-foreground mb-4">
                {userData.user.email}
              </p>
              
              {/* Bio */}
              {userData.user.bio && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 px-2">
                  {userData.user.bio}
                </p>
              )}
              
              {/* Follow Stats */}
              <div className="flex gap-4 mb-4 text-sm">
                <button
                  onClick={() => router.push(`/friends/${userId}/followers`)}
                  className="text-center hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="font-bold text-lg">{followersCount}</div>
                  <div className="text-muted-foreground">Followers</div>
                </button>
                <button
                  onClick={() => router.push(`/friends/${userId}/following`)}
                  className="text-center hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="font-bold text-lg">{userData.stats.followingCount}</div>
                  <div className="text-muted-foreground">Following</div>
                </button>
              </div>

              {/* Follow Button */}
              {!userData.isCurrentUser && (
                <div className="space-y-2">
                  <FollowButton
                    userId={userId}
                    initialIsFollowing={isFollowing}
                    onFollowChange={(newIsFollowing, newFollowersCount) => {
                      // Update local state immediately for real-time UI
                      setLocalIsFollowing(newIsFollowing);
                      if (newFollowersCount !== undefined) {
                        setLocalFollowersCount(newFollowersCount);
                      }
                    }}
                  />
                  
                  {/* Message Button */}
                  <Button
                    onClick={() => router.push(`/messages/${userId}`)}
                    className="w-full"
                    variant="outline"
                  >
                    💬 Message
                  </Button>
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-4">
                Member since{" "}
                {new Date(userData.user.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </Card>

          {/* Stats Card */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Statistics</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-muted-foreground">
                    Total Todos
                  </span>
                  <span className="font-bold">{userData.stats.totalTodos}</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-muted-foreground">
                    Completed
                  </span>
                  <span className="font-bold text-green-600">
                    {userData.stats.completedTodos}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Active</span>
                  <span className="font-bold text-orange-600">
                    {userData.stats.activeTodos}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold">
                    Completion Rate
                  </span>
                  <span className="font-bold text-blue-600">
                    {userData.stats.completionRate}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all"
                    style={{ width: `${userData.stats.completionRate}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Recent Activity */}
          {userData.recentTodos.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {userData.recentTodos.slice(0, 3).map((todo) => (
                  <div
                    key={todo.id}
                    className="p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-start gap-2">
                      <span className={`text-lg ${todo.isCompleted ? "line-through opacity-50" : ""}`}>
                        {todo.isCompleted ? "✅" : "📝"}
                      </span>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${todo.isCompleted ? "line-through opacity-50" : ""}`}>
                          {todo.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(todo.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Todos List */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {userData.user.name}&apos;s Todos
              </h2>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setFilter("all");
                  setPage(1);
                }}
              >
                All ({userData.stats.totalTodos})
              </Button>
              <Button
                variant={filter === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setFilter("active");
                  setPage(1);
                }}
              >
                Active ({userData.stats.activeTodos})
              </Button>
              <Button
                variant={filter === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setFilter("completed");
                  setPage(1);
                }}
              >
                Completed ({userData.stats.completedTodos})
              </Button>
            </div>

            {/* Todos */}
            {todosLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : todosData && todosData.todos.length > 0 ? (
              <>
                <div className="space-y-4">
                  {todosData.todos.map((todo) => (
                    <div
                      key={todo.id}
                      className={`p-4 border rounded-lg ${
                        todo.isCompleted
                          ? "bg-muted opacity-60"
                          : "bg-background"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {todo.isCompleted ? (
                            <span className="text-2xl">✅</span>
                          ) : (
                            <span className="text-2xl">⬜</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3
                              className={`font-semibold ${
                                todo.isCompleted ? "line-through" : ""
                              }`}
                            >
                              {todo.title}
                            </h3>
                            <Badge
                              className={priorityColors[todo.priority]}
                            >
                              {todo.priority}
                            </Badge>
                          </div>
                          <p
                            className={`text-sm text-muted-foreground ${
                              todo.isCompleted ? "line-through" : ""
                            }`}
                          >
                            {todo.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>
                              Created:{" "}
                              {new Date(todo.createdAt).toLocaleDateString()}
                            </span>
                            {todo.dueDate && (
                              <span>
                                Due: {new Date(todo.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {todosData.pagination.totalPages > 1 && (
                  <div className="flex justify-between items-center mt-6 pt-6 border-t">
                    <div className="text-sm text-muted-foreground">
                      Page {todosData.pagination.page} of{" "}
                      {todosData.pagination.totalPages} ({todosData.pagination.total}{" "}
                      total)
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!todosData.pagination.hasMore}
                        onClick={() => setPage(page + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-xl font-semibold mb-2">No todos yet</h3>
                <p className="text-muted-foreground">
                  {userData.user.name} hasn&apos;t created any todos yet
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
