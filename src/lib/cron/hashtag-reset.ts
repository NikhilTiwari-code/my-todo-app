/**
 * 🔄 Hashtag Stats Reset Cron Jobs
 * 
 * Resets daily and weekly hashtag counters
 * 
 * Daily: Resets todayCount at midnight UTC
 * Weekly: Resets weekCount every Monday at midnight UTC
 */

import cron from 'node-cron';
import HashtagStats from '@/models/hashtagStats.model';
import connectToDb from '@/utils/db';

let dailyJob: ReturnType<typeof cron.schedule> | null = null;
let weeklyJob: ReturnType<typeof cron.schedule> | null = null;

/**
 * Reset daily hashtag counters
 */
async function resetDailyCounters() {
  try {
    console.log('🔄 Resetting daily hashtag counters...');
    
    await connectToDb();
    const result = await HashtagStats.updateMany(
      {},
      { $set: { todayCount: 0 } }
    );

    console.log(`✅ Reset ${result.modifiedCount} hashtag daily counters`);
    return result;
  } catch (error: any) {
    console.error('❌ Daily reset error:', error.message);
    throw error;
  }
}

/**
 * Reset weekly hashtag counters
 */
async function resetWeeklyCounters() {
  try {
    console.log('🔄 Resetting weekly hashtag counters...');
    
    await connectToDb();
    const result = await HashtagStats.updateMany(
      {},
      { $set: { weekCount: 0 } }
    );

    console.log(`✅ Reset ${result.modifiedCount} hashtag weekly counters`);
    return result;
  } catch (error: any) {
    console.error('❌ Weekly reset error:', error.message);
    throw error;
  }
}

/**
 * Start hashtag reset cron jobs
 */
export function startHashtagResetJobs() {
  // Daily reset at midnight UTC
  if (!dailyJob) {
    dailyJob = cron.schedule('0 0 * * *', async () => {
      await resetDailyCounters();
    }, {
      timezone: 'UTC'
    });
    console.log('✅ Daily hashtag reset cron job started (midnight UTC)');
  }

  // Weekly reset every Monday at midnight UTC
  if (!weeklyJob) {
    weeklyJob = cron.schedule('0 0 * * 1', async () => {
      await resetWeeklyCounters();
    }, {
      timezone: 'UTC'
    });
    console.log('✅ Weekly hashtag reset cron job started (Monday midnight UTC)');
  }
}

/**
 * Stop hashtag reset cron jobs
 */
export function stopHashtagResetJobs() {
  if (dailyJob) {
    dailyJob.stop();
    dailyJob = null;
    console.log('🛑 Daily hashtag reset job stopped');
  }

  if (weeklyJob) {
    weeklyJob.stop();
    weeklyJob = null;
    console.log('🛑 Weekly hashtag reset job stopped');
  }
}

/**
 * Manually trigger resets (for testing)
 */
export async function manualResetDaily() {
  return await resetDailyCounters();
}

export async function manualResetWeekly() {
  return await resetWeeklyCounters();
}
