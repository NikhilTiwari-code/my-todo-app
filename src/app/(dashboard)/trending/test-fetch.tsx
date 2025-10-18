/**
 * 🧪 Test Fetch Button Component
 * 
 * Temporary component to manually trigger trending data fetch
 * Use this to populate data for testing
 */

'use client';

import { useState } from 'react';

export default function TestFetchButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const triggerFetch = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/cron/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categories: ['news', 'youtube', 'tech', 'crypto'], // Fetch all available sources
        }),
      });

      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        alert('✅ Trending data fetched successfully! Refresh the page to see results.');
        window.location.reload();
      }
    } catch (error: any) {
      setResult({ error: error.message });
      alert('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={triggerFetch}
        disabled={loading}
        className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all font-bold flex items-center gap-2"
      >
        {loading ? (
          <>
            <span className="animate-spin">⏳</span>
            Fetching...
          </>
        ) : (
          <>
            <span>🔥</span>
            Fetch Trending Data
          </>
        )}
      </button>

      {result && (
        <div className="mt-2 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md">
          <pre className="text-xs overflow-auto max-h-40">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
