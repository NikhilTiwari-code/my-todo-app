"use client";

import { useState, useEffect, useRef } from "react";
import { UserAvatar } from "../users/UserAvatar";
import { motion, AnimatePresence } from "framer-motion";

interface MentionSuggestion {
  _id: string;
  username: string;
  name: string;
  avatar?: string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  maxLength?: number;
}

export function MentionInput({
  value,
  onChange,
  placeholder,
  className = "",
  rows = 3,
  maxLength,
}: MentionInputProps) {
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Detect @ mentions
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const text = value;
    const cursorPos = textarea.selectionStart || 0;

    // Find if cursor is after @ symbol
    const textBeforeCursor = text.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      
      // Check if there's no space after @
      if (!textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
        setMentionQuery(textAfterAt);
        setShowSuggestions(true);
        return;
      }
    }

    setShowSuggestions(false);
    setMentionQuery("");
  }, [value, cursorPosition]);

  // Fetch mention suggestions
  useEffect(() => {
    if (!showSuggestions) return;

    const fetchSuggestions = async () => {
      try {
        const res = await fetch(
          `/api/mentions/suggestions?q=${encodeURIComponent(mentionQuery)}`,
          { credentials: "include" }
        );
        const data = await res.json();
        
        if (data.success) {
          setSuggestions(data.suggestions || []);
          setSelectedIndex(0);
        }
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
        setSuggestions([]);
      }
    };

    const timer = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(timer);
  }, [mentionQuery, showSuggestions]);

  const insertMention = (suggestion: MentionSuggestion) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const text = value;
    const cursorPos = textarea.selectionStart || 0;
    const textBeforeCursor = text.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    
    const newText =
      text.substring(0, lastAtIndex) +
      `@${suggestion.username} ` +
      text.substring(cursorPos);

    onChange(newText);
    setShowSuggestions(false);
    setMentionQuery("");

    // Set cursor position after mention
    setTimeout(() => {
      const newCursorPos = lastAtIndex + suggestion.username.length + 2;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        if (showSuggestions && suggestions[selectedIndex]) {
          e.preventDefault();
          insertMention(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowSuggestions(false);
        break;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    setCursorPosition(e.target.selectionStart || 0);
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className={className}
        onClick={(e) => setCursorPosition(e.currentTarget.selectionStart || 0)}
      />

      {/* Mention Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute bottom-full mb-2 left-0 w-full max-w-sm bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl shadow-2xl max-h-64 overflow-y-auto z-50"
          >
            <div className="p-2">
              <p className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                Mention someone
              </p>
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion._id}
                  onClick={() => insertMention(suggestion)}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    index === selectedIndex
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <UserAvatar
                    name={suggestion.name}
                    avatar={suggestion.avatar}
                    size="sm"
                  />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {suggestion.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      @{suggestion.username}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
