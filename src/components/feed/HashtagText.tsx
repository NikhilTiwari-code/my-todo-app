// src/components/feed/HashtagText.tsx

"use client";

import Link from "next/link";

interface HashtagTextProps {
  text: string;
}

export default function HashtagText({ text }: HashtagTextProps) {
  // Split by both @mentions and #hashtags
  const parts = text.split(/(@\w+|#[\w\u0590-\u05ff]+)/g);

  return (
    <span>
      {parts.map((part, index) => {
        // Handle @mentions
        if (part.startsWith("@")) {
          const username = part.slice(1);
          return (
            <Link
              key={index}
              href={`/profile/${username}`}
              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </Link>
          );
        }
        
        // Handle #hashtags
        if (part.startsWith("#")) {
          const hashtag = part.slice(1);
          return (
            <Link
              key={index}
              href={`/hashtags/${hashtag}`}
              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </Link>
          );
        }
        
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}