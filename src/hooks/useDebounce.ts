import { useEffect, useState } from 'react';

/**
 * Custom hook for debouncing values
 * Delays updating the value until user stops typing
 * 
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 500ms)
 * @returns The debounced value
 * 
 * @example
 * const [email, setEmail] = useState('');
 * const debouncedEmail = useDebounce(email, 500);
 * 
 * useEffect(() => {
 *   // This will only run 500ms after user stops typing
 *   if (debouncedEmail) {
 *     checkEmailAvailability(debouncedEmail);
 *   }
 * }, [debouncedEmail]);
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set a timeout to update debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function: clear timeout if value changes before delay
    // This prevents the debounced value from updating too soon
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
