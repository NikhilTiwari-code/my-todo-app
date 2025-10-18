"use client";

import { Link2, MapPin, Calendar, Mail } from "lucide-react";
import { motion } from "framer-motion";

interface ProfileBioProps {
  bio?: string;
  website?: string;
  location?: string;
  joinedAt?: string;
  email?: string;
  isOwner: boolean;
}

export function ProfileBio({ bio, website, location, joinedAt, email, isOwner }: ProfileBioProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const formatWebsite = (url: string) => {
    return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url.startsWith("http") ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="space-y-3 px-4 md:px-6">
      {/* Bio */}
      {bio && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-gray-900 dark:text-white text-base leading-relaxed whitespace-pre-wrap break-words"
        >
          {bio}
        </motion.p>
      )}

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        {/* Website */}
        {website && (
          <motion.a
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            href={website.startsWith("http") ? website : `https://${website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline group"
          >
            <Link2 size={16} className="group-hover:scale-110 transition-transform" />
            <span className="font-medium">{formatWebsite(website)}</span>
          </motion.a>
        )}

        {/* Location */}
        {location && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
            className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400"
          >
            <MapPin size={16} />
            <span>{location}</span>
          </motion.div>
        )}

        {/* Joined Date */}
        {joinedAt && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400"
          >
            <Calendar size={16} />
            <span>Joined {formatDate(joinedAt)}</span>
          </motion.div>
        )}

        {/* Email (only show to owner) */}
        {isOwner && email && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45 }}
            className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400"
          >
            <Mail size={16} />
            <span className="text-sm">{email}</span>
          </motion.div>
        )}
      </div>

      {/* Empty state */}
      {!bio && !website && !location && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-gray-500 dark:text-gray-400 italic text-sm"
        >
          {isOwner ? "Add a bio to tell people about yourself" : "No bio yet"}
        </motion.p>
      )}
    </div>
  );
}
