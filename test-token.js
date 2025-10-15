const jwt = require('jsonwebtoken');

// The token from Railway logs (first 20 chars shown)
const tokenSample = "eyJhbGciOiJIUzI1NiIs"; // This is the header

// Decode the header to see the algorithm
const decoded = Buffer.from(tokenSample, 'base64').toString('utf-8');
console.log("Token header decoded:", decoded);

// Test both secrets
const oldSecret = "8f3d9a2b7c1e4f6a5d8b9c0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a";
const newSecret = "593e531b7572f114f3ae7ec262a1fd8db2e5198439c4aff306a7fd61a288a5e9";

// Create a test token with both secrets
const testPayload = { id: "test123", email: "test@test.com", name: "Test User" };

console.log("\n=== Creating tokens ===");
const token1 = jwt.sign(testPayload, oldSecret, { expiresIn: "1h" });
const token2 = jwt.sign(testPayload, newSecret, { expiresIn: "1h" });

console.log("Token with OLD secret (first 30):", token1.substring(0, 30));
console.log("Token with NEW secret (first 30):", token2.substring(0, 30));

// Verify
console.log("\n=== Verification test ===");
try {
  jwt.verify(token1, oldSecret);
  console.log("✅ OLD secret verifies its own token");
} catch (e) {
  console.log("❌ OLD secret FAILED:", e.message);
}

try {
  jwt.verify(token2, newSecret);
  console.log("✅ NEW secret verifies its own token");
} catch (e) {
  console.log("❌ NEW secret FAILED:", e.message);
}

// Cross-verification
console.log("\n=== Cross-verification ===");
try {
  jwt.verify(token1, newSecret);
  console.log("❌ This shouldn't work: token1 verified with new secret");
} catch (e) {
  console.log("✅ Expected: token1 cannot be verified with new secret");
}
