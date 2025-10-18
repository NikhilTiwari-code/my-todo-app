"use client";

import { useState, useEffect } from "react";
import { Search, Check, Loader2 } from "lucide-react";
import { UserAvatar } from "@/components/users/UserAvatar";

interface User {
  _id: string;
  name: string;
  username?: string;
  avatar?: string;
  isVerified?: boolean;
}

interface UserSelectListProps {
  selectedUsers: string[];
  onSelectionChange: (userIds: string[]) => void;
}

export function UserSelectList({
  selectedUsers,
  onSelectionChange,
}: UserSelectListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Fetch user's followers/following
      const res = await fetch("/api/users/me/following", {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setUsers(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      onSelectionChange(selectedUsers.filter((id) => id !== userId));
    } else {
      if (selectedUsers.length >= 20) {
        return; // Max 20 users
      }
      onSelectionChange([...selectedUsers, userId]);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      {/* Search */}
      <div className="p-4 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10">
        <div className="relative">
          <Search
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2 border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        {selectedUsers.length > 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {selectedUsers.length} selected {selectedUsers.length >= 20 && "(max)"}
          </p>
        )}
      </div>

      {/* User List */}
      <div className="divide-y dark:divide-gray-700">
        {loading ? (
          <div className="p-8 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <Loader2 size={32} className="animate-spin mb-2" />
            <p>Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            {searchQuery ? "No users found" : "No users to share with"}
          </div>
        ) : (
          filteredUsers.map((user) => {
            const isSelected = selectedUsers.includes(user._id);

            return (
              <button
                key={user._id}
                onClick={() => toggleUser(user._id)}
                className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <UserAvatar name={user.name} avatar={user.avatar} size="md" />
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                  {user.username && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
                  )}
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isSelected
                      ? "bg-purple-600 border-purple-600"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                >
                  {isSelected && <Check size={16} className="text-white" />}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
