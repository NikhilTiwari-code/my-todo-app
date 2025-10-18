/**
 * ⏰ Trending Data Updater Cron Job
 * 
 * Automatically fetches and updates trending data from external APIs
 * Runs every 30 minutes
 * 
 * Usage:
 * - Import and call startTrendingCronJob() in your server.js
 */

import cron from 'node-cron';
import { updateTrendingData } from '@/lib/external-apis/aggregator';
import { emitTrendingUpdate } from '@/lib/socket/trending-socket';

let isRunning = false;
let lastRun: Date | null = null;
let cronJob: cron.ScheduledTask | null = null;

/**
 * Update trending data and emit to Socket.io clients
 */
async function updateAndEmitTrending() {
  if (isRunning) {
    console.log('⚠️ Trending update already in progress, skipping...');
    return;
  }

  try {
    isRunning = true;
    console.log('🔄 Starting scheduled trending update...');

    // Update trending data
    const result = await updateTrendingData(['news', 'youtube', 'tech', 'crypto']);

    lastRun = new Date();
    isRunning = false;

    if (result.success) {
      console.log(`✅ Trending update completed: ${result.itemsSaved} items`);

      // Emit update to all connected Socket.io clients
      try {
        emitTrendingUpdate({
          message: 'Trending data updated',
          timestamp: lastRun,
          itemsUpdated: result.itemsSaved,
        });
      } catch (socketError) {
        console.error('Failed to emit Socket.io update:', socketError);
      }
    } else {
      console.error('❌ Trending update failed:', result.error);
    }

    return result;
  } catch (error: any) {
    isRunning = false;
    console.error('❌ Cron job error:', error.message);
    throw error;
  }
}

/**
 * Start the trending updater cron job
 * 
 * Schedule: Every 30 minutes
 * Cron pattern: '0,30 * * * *' means at minute 0 and 30 of every hour
 */
export function startTrendingCronJob() {
  if (cronJob) {
    console.log('⚠️ Trending cron job already running');
    return;
  }

  // Run every 30 minutes
  cronJob = cron.schedule('0,30 * * * *', async () => {
    await updateAndEmitTrending();
  }, {
    timezone: 'UTC'
  });

  console.log('✅ Trending cron job started (runs every 30 minutes)');

  // Run immediately on startup
  updateAndEmitTrending().catch(err => {
    console.error('Initial trending update failed:', err);
  });
}

/**
 * Stop the trending updater cron job
 */
export function stopTrendingCronJob() {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log('🛑 Trending cron job stopped');
  }
}

/**
 * Get cron job status
 */
export function getTrendingCronStatus() {
  return {
    isRunning: cronJob !== null,
    isUpdating: isRunning,
    lastRun,
    nextRun: cronJob ? 'Every 30 minutes' : null,
  };
}

/**
 * Manually trigger trending update (useful for testing)
 */
export async function manualTrendingUpdate() {
  return await updateAndEmitTrending();
}
