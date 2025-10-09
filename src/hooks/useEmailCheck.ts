import { useEffect, useState } from 'react';
import { useDebounce } from './useDebounce';

interface EmailCheckResult {
  isChecking: boolean;
  isAvailable: boolean | null;
  message: string;
  error: string | null;
}

/**
 * Custom hook for checking email availability with debouncing
 * 
 * @param email - The email address to check
 * @param delay - Debounce delay in milliseconds (default: 500ms)
 * @returns Object with checking state, availability, and message
 * 
 * @example
 * const { isChecking, isAvailable, message } = useEmailCheck(email);
 * 
 * // Show loading: isChecking === true
 * // Show available: isAvailable === true
 * // Show taken: isAvailable === false
 * // Show message: message
 */
export function useEmailCheck(email: string, delay: number = 500): EmailCheckResult {
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Debounce the email input
  const debouncedEmail = useDebounce(email, delay);

  useEffect(() => {
    // Reset states when email changes
    setIsAvailable(null);
    setMessage('');
    setError(null);

    // Don't check if email is empty or invalid format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!debouncedEmail || !emailRegex.test(debouncedEmail)) {
      return;
    }

    // Check email availability
    const checkEmail = async () => {
      setIsChecking(true);
      setError(null);

      try {
        const response = await fetch(`/api/auth/check-email?email=${encodeURIComponent(debouncedEmail)}`);
        const data = await response.json();

        if (response.ok) {
          setIsAvailable(data.available);
          setMessage(data.message);
        } else {
          setError(data.message || 'Failed to check email');
          setIsAvailable(null);
        }
      } catch (err) {
        setError('Network error. Please try again.');
        setIsAvailable(null);
      } finally {
        setIsChecking(false);
      }
    };

    checkEmail();
  }, [debouncedEmail]);

  return {
    isChecking,
    isAvailable,
    message,
    error,
  };
}
