// src/components/feed/LikeAnimation.tsx

"use client";

import { Heart } from "lucide-react";
import { motion } from "framer-motion";

export default function LikeAnimation() {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0] }}
      transition={{ duration: 0.8 }}
      className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
    >
      <Heart className="w-24 h-24 fill-white text-white drop-shadow-lg" />
    </motion.div>
  );
}