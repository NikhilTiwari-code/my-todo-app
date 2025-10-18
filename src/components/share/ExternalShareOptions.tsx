"use client";

import { Copy } from "lucide-react";
import toast from "react-hot-toast";
import {
  FaWhatsapp,
  FaTwitter,
  FaFacebook,
  FaTelegram,
} from "react-icons/fa";

interface ExternalShareOptionsProps {
  postId?: string;
  reelId?: string;
  storyId?: string;
}

export function ExternalShareOptions({
  postId,
  reelId,
  storyId,
}: ExternalShareOptionsProps) {
  const contentType = postId ? "post" : reelId ? "reel" : "story";
  const contentId = postId || reelId || storyId;
  const shareUrl = `${window.location.origin}/${contentType}/${contentId}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard! 📋");
  };

  const shareToWhatsApp = () => {
    const text = `Check out this ${contentType} on TodoApp!`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text + " " + shareUrl)}`,
      "_blank"
    );
  };

  const shareToTwitter = () => {
    const text = `Check out this ${contentType} on TodoApp!`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
      "_blank"
    );
  };

  const shareToFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      "_blank"
    );
  };

  const shareToTelegram = () => {
    const text = `Check out this ${contentType} on TodoApp!`;
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`,
      "_blank"
    );
  };

  const options = [
    {
      icon: <Copy size={20} />,
      label: "Copy Link",
      onClick: copyLink,
      bg: "bg-gray-100 dark:bg-gray-800",
      color: "text-gray-700 dark:text-gray-300",
    },
    {
      icon: <FaWhatsapp size={20} />,
      label: "WhatsApp",
      onClick: shareToWhatsApp,
      bg: "bg-green-100 dark:bg-green-900/30",
      color: "text-green-600 dark:text-green-400",
    },
    {
      icon: <FaTwitter size={20} />,
      label: "Twitter",
      onClick: shareToTwitter,
      bg: "bg-blue-100 dark:bg-blue-900/30",
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      icon: <FaFacebook size={20} />,
      label: "Facebook",
      onClick: shareToFacebook,
      bg: "bg-blue-100 dark:bg-blue-900/30",
      color: "text-blue-700 dark:text-blue-400",
    },
    {
      icon: <FaTelegram size={20} />,
      label: "Telegram",
      onClick: shareToTelegram,
      bg: "bg-sky-100 dark:bg-sky-900/30",
      color: "text-sky-600 dark:text-sky-400",
    },
  ];

  return (
    <div className="border-t dark:border-gray-700 pt-4 mt-4">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 px-2">Share via</p>
      <div className="grid grid-cols-3 gap-3">
        {options.map((option) => (
          <button
            key={option.label}
            onClick={option.onClick}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl hover:scale-105 transition-transform ${option.bg}`}
          >
            <div className={`${option.color}`}>{option.icon}</div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {option.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
