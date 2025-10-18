"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface MentionTextProps {
  text: string;
  className?: string;
}

/**
 * Renders text with clickable @mentions and #hashtags
 * 
 * Example:
 * "Check out @john's post #coding #react"
 * → Makes @john and #coding #react clickable
 */
export function MentionText({ text, className = "" }: MentionTextProps) {
  if (!text) return null;

  // Split text into parts (regular text, @mentions, #hashtags)
  const parts = text.split(/(@\w+|#\w+)/g);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        // @mention
        if (part.startsWith("@")) {
          const username = part.substring(1);
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
        
        // #hashtag
        if (part.startsWith("#")) {
          const hashtag = part.substring(1);
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
        
        // Regular text
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}

/**
 * Hook version for extracting mentions/hashtags
 */
export function useMentionsAndHashtags(text: string) {
  const mentions = text.match(/@\w+/g) || [];
  const hashtags = text.match(/#\w+/g) || [];

  return {
    mentions: mentions.map(m => m.substring(1)),
    hashtags: hashtags.map(h => h.substring(1)),
    hasMentions: mentions.length > 0,
    hasHashtags: hashtags.length > 0,
  };
}
