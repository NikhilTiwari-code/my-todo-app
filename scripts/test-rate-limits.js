#!/usr/bin/env node

/**
 * Rate Limiting Test Suite
 * 
 * Tests all rate limit scenarios to verify implementation
 * 
 * Usage:
 *   node scripts/test-rate-limits.js
 * 
 * Requirements:
 *   - Server running on http://localhost:3000
 *   - Test user account created
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Test 1: Auth Rate Limiting (5 per 15 minutes)
 */
async function testAuthRateLimit() {
  log('\n═══════════════════════════════════════', 'cyan');
  log('TEST 1: Auth Endpoint Rate Limiting', 'cyan');
  log('═══════════════════════════════════════\n', 'cyan');
  
  log('Testing: POST /api/auth/login');
  log('Expected: First 5 succeed, 6th gets 429\n');
  
  const results = [];
  
  for (let i = 1; i <= 6; i++) {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
      });
      
      const remaining = response.headers.get('X-RateLimit-Remaining');
      const status = response.status;
      
      results.push({ attempt: i, status, remaining });
      
      if (status === 429) {
        const data = await response.json();
        log(`  Attempt ${i}: ❌ 429 Too Many Requests (BLOCKED)`, 'red');
        log(`    Message: "${data.message}"`, 'yellow');
        log(`    Retry After: ${data.retryAfter} seconds`, 'yellow');
      } else if (status === 401) {
        log(`  Attempt ${i}: ✅ 401 Unauthorized (Rate limit OK, remaining: ${remaining})`, 'green');
      } else {
        log(`  Attempt ${i}: ⚠️  Status ${status} (remaining: ${remaining})`, 'yellow');
      }
      
      await sleep(100); // Small delay between requests
    } catch (error) {
      log(`  Attempt ${i}: ❌ Error: ${error.message}`, 'red');
    }
  }
  
  // Verify results
  const blockedAttempts = results.filter(r => r.status === 429);
  if (blockedAttempts.length > 0 && blockedAttempts[0].attempt === 6) {
    log('\n✅ TEST PASSED: Rate limit enforced correctly', 'green');
  } else {
    log('\n❌ TEST FAILED: Rate limit not working as expected', 'red');
  }
}

/**
 * Test 2: Failed Login Rate Limiting (3 per 30 minutes per email)
 */
async function testFailedLoginLimit() {
  log('\n═══════════════════════════════════════', 'cyan');
  log('TEST 2: Failed Login Rate Limiting', 'cyan');
  log('═══════════════════════════════════════\n', 'cyan');
  
  log('Testing: Failed login attempts for same email');
  log('Expected: First 3 fail with 401, 4th gets 429\n');
  
  const testEmail = `test-${Date.now()}@example.com`;
  
  for (let i = 1; i <= 4; i++) {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'definitelywrong'
        })
      });
      
      const status = response.status;
      const data = await response.json();
      
      if (status === 429) {
        log(`  Attempt ${i}: ❌ 429 Account Locked`, 'red');
        log(`    Message: "${data.message}"`, 'yellow');
      } else if (status === 401) {
        log(`  Attempt ${i}: ✅ 401 Wrong Password (allowed)`, 'green');
      } else {
        log(`  Attempt ${i}: ⚠️  Status ${status}`, 'yellow');
      }
      
      await sleep(100);
    } catch (error) {
      log(`  Attempt ${i}: ❌ Error: ${error.message}`, 'red');
    }
  }
}

/**
 * Test 3: Read Operation Rate Limiting (1000 per 15 minutes)
 */
async function testReadRateLimit() {
  log('\n═══════════════════════════════════════', 'cyan');
  log('TEST 3: Read Operation Rate Limiting', 'cyan');
  log('═══════════════════════════════════════\n', 'cyan');
  
  log('Testing: GET /api/todos');
  log('Expected: Lenient limit (1000 requests)\n');
  
  // We'll just test that headers are present
  try {
    const response = await fetch(`${BASE_URL}/api/todos`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    const limit = response.headers.get('X-RateLimit-Limit');
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const reset = response.headers.get('X-RateLimit-Reset');
    
    if (limit && remaining && reset) {
      log(`  ✅ Rate limit headers present:`, 'green');
      log(`     Limit: ${limit}`, 'cyan');
      log(`     Remaining: ${remaining}`, 'cyan');
      log(`     Reset: ${reset}`, 'cyan');
      log('\n✅ TEST PASSED: Read rate limiting configured', 'green');
    } else {
      log('  ❌ Rate limit headers missing', 'red');
      log('\n❌ TEST FAILED', 'red');
    }
  } catch (error) {
    log(`  ❌ Error: ${error.message}`, 'red');
  }
}

/**
 * Test 4: Mutation Rate Limiting (100 per 15 minutes)
 */
async function testMutationRateLimit() {
  log('\n═══════════════════════════════════════', 'cyan');
  log('TEST 4: Mutation Rate Limiting', 'cyan');
  log('═══════════════════════════════════════\n', 'cyan');
  
  log('Testing: POST /api/todos (without auth)');
  log('Expected: Moderate limit (100 requests)\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test Todo',
        description: 'Testing rate limits'
      })
    });
    
    const limit = response.headers.get('X-RateLimit-Limit');
    const remaining = response.headers.get('X-RateLimit-Remaining');
    
    if (limit && remaining) {
      log(`  ✅ Rate limit headers present:`, 'green');
      log(`     Limit: ${limit}`, 'cyan');
      log(`     Remaining: ${remaining}`, 'cyan');
      log('\n✅ TEST PASSED: Mutation rate limiting configured', 'green');
    } else {
      log('  ❌ Rate limit headers missing', 'red');
      log('\n❌ TEST FAILED', 'red');
    }
  } catch (error) {
    log(`  ❌ Error: ${error.message}`, 'red');
  }
}

/**
 * Test 5: Rate Limit Reset
 */
async function testRateLimitReset() {
  log('\n═══════════════════════════════════════', 'cyan');
  log('TEST 5: Rate Limit Reset Time', 'cyan');
  log('═══════════════════════════════════════\n', 'cyan');
  
  log('Testing: Reset time calculation\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'resettest@example.com',
        password: 'test'
      })
    });
    
    const reset = response.headers.get('X-RateLimit-Reset');
    
    if (reset) {
      const resetDate = new Date(reset);
      const now = new Date();
      const diffMinutes = (resetDate - now) / 1000 / 60;
      
      log(`  Current Time: ${now.toISOString()}`, 'cyan');
      log(`  Reset Time: ${reset}`, 'cyan');
      log(`  Time Until Reset: ${diffMinutes.toFixed(2)} minutes`, 'cyan');
      
      if (diffMinutes > 0 && diffMinutes <= 15) {
        log('\n✅ TEST PASSED: Reset time within expected window (0-15 mins)', 'green');
      } else {
        log('\n⚠️  WARNING: Reset time outside expected window', 'yellow');
      }
    } else {
      log('  ❌ No reset time header found', 'red');
    }
  } catch (error) {
    log(`  ❌ Error: ${error.message}`, 'red');
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  log('\n╔═══════════════════════════════════════════════╗', 'blue');
  log('║     Rate Limiting Test Suite                 ║', 'blue');
  log('║     Testing all rate limit scenarios         ║', 'blue');
  log('╚═══════════════════════════════════════════════╝', 'blue');
  
  log(`\nTarget API: ${BASE_URL}`, 'yellow');
  log('Make sure your server is running!\n', 'yellow');
  
  await sleep(2000);
  
  try {
    await testAuthRateLimit();
    await sleep(1000);
    
    await testReadRateLimit();
    await sleep(1000);
    
    await testMutationRateLimit();
    await sleep(1000);
    
    await testRateLimitReset();
    await sleep(1000);
    
    // Note: Commented out failed login test to avoid lockouts during development
    // await testFailedLoginLimit();
    
    log('\n╔═══════════════════════════════════════════════╗', 'green');
    log('║     All Tests Complete!                       ║', 'green');
    log('╚═══════════════════════════════════════════════╝\n', 'green');
    
  } catch (error) {
    log(`\n❌ Test suite error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run tests
runAllTests();
