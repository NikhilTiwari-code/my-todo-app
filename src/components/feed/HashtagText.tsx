// src/components/feed/HashtagText.tsx

"use client";

import Link from "next/link";

interface HashtagTextProps {
  text: string;
}

export default function HashtagText({ text }: HashtagTextProps) {
  const parts = text.split(/(#[\w\u0590-\u05ff]+)/g);

  return (
    <span>
      {parts.map((part, index) => {
        if (part.startsWith("#")) {
          return (
            <Link
              key={index}
              href={`/explore/tags/${part.slice(1)}`}
              className="text-blue-600 hover:underline"
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