"use client";

import Image from "next/image";

interface UserAvatarProps {
  avatar?: string;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "w-10 h-10 text-sm",
  md: "w-16 h-16 text-xl",
  lg: "w-24 h-24 text-3xl",
  xl: "w-32 h-32 text-4xl"
};

export function UserAvatar({ avatar, name, size = "md" }: UserAvatarProps) {
  const initial = name?.charAt(0).toUpperCase() || "?";
  
  return (
    <div className={`relative ${sizeClasses[size]} rounded-full overflow-hidden flex-shrink-0 shadow-lg`}>
      {avatar ? (
        <Image 
          src={avatar} 
          alt={name} 
          fill 
          className="object-cover"
          onError={(e) => {
            // Fallback to initials if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      ) : (
        <div className={`w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold ${sizeClasses[size]}`}>
          {initial}
        </div>
      )}
    </div>
  );
}
