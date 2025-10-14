"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { FollowButton } from "@/components/users/FollowButton";
import { UserAvatar } from "@/components/users/UserAvatar";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  createdAt: string;
  stats: {
    totalTodos: number;
    completedTodos: number;
    followersCount: number;
    followingCount: number;
  };
  isFollowing: boolean;
  isCurrentUser: boolean;
}

interface FollowersData {
  user: {
    id: string;
    name: string;
  };
  followers: User[];
  total: number;
}

async function fetchFollowers(userId: string): Promise<FollowersData> {
  const res = await fetch(`/api/users/${userId}/followers`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch followers");
  const data = await res.json();
  return data.data;
}

export default function FollowersPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["followers", userId],
    queryFn: () => fetchFollowers(userId),
  });

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 text-center text-red-600">
          Failed to load followers. Please try again.
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Button
        variant="outline"
        onClick={() => router.push(`/friends/${userId}`)}
        className="mb-6"
      >
        ← Back to Profile
      </Button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {isLoading ? "Loading..." : `${data?.user.name}'s Followers`}
        </h1>
        <p className="text-muted-foreground">
          {isLoading ? (
            <Skeleton className="h-5 w-32" />
          ) : (
            `${data?.total || 0} ${data?.total === 1 ? "follower" : "followers"}`
          )}
        </p>
      </div>

      {/* Followers Grid */}
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
      ) : data && data.followers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.followers.map((user) => (
            <Card
              key={user.id}
              className="p-6 hover:shadow-lg transition-shadow"
            >
              {/* User Avatar */}
              <div className="flex items-center mb-4">
                <UserAvatar avatar={user.avatar} name={user.name} size="md" />
                <div className="ml-4 flex-1">
                  <h3 className="font-semibold text-lg">{user.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Bio */}
              {user.bio && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {user.bio}
                </p>
              )}

              {/* Stats */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Todos</span>
                  <span className="font-semibold">{user.stats.totalTodos}</span>
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
                    Followers
                  </span>
                  <span className="font-semibold text-blue-600">
                    {user.stats.followersCount}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push(`/friends/${user.id}`)}
                >
                  View Profile
                </Button>

                {!user.isCurrentUser && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <FollowButton
                      userId={user.id}
                      initialIsFollowing={user.isFollowing}
                      onFollowChange={() => {
                        // Refetch the list to update follow status
                        refetch();
                      }}
                    />
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-semibold mb-2">No followers yet</h3>
          <p className="text-muted-foreground">
            {data?.user.name} doesn&apos;t have any followers yet
          </p>
        </Card>
      )}
    </div>
  );
}
