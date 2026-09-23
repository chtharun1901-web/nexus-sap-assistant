const BASE = 'http://localhost:3456';

console.log('====================================================');
console.log('🧪 RUNNING END-TO-END AUTHENTICATION TEST SUITE');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failCount++;
  }
}

async function runTests() {
  const ts = Date.now();
  const email1 = `test.user1.${ts}@example.com`;
  const email2 = `test.user2.${ts}@example.com`;
  const pass1 = 'StrongPass123!';
  const pass2 = 'StrongPass456!';

  // ── 1. Register User 1 ──
  console.log('▶ Test 1: Register User 1');
  const reg1Res = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email1, password: pass1, displayName: 'Test User One', role: 'SAP SD Consultant' })
  });
  const reg1Data = await reg1Res.json();
  assert(reg1Res.status === 200, `Registration HTTP status is 200 (Got: ${reg1Res.status})`);
  assert(reg1Data.ok === true && reg1Data.user?.email === email1, `User 1 created with email: ${email1}`);
  assert(!!reg1Data.token, 'Session token returned upon registration');
  const token1 = reg1Data.token;

  // ── 2. Duplicate Registration Prevention ──
  console.log('\n▶ Test 2: Duplicate Registration Handling');
  const dupRes = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email1, password: pass1 })
  });
  assert(dupRes.status === 409, `Duplicate email registration rejected with 409 (Got: ${dupRes.status})`);

  // ── 3. Password Login ──
  console.log('\n▶ Test 3: Password Login Verification');
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email1, password: pass1 })
  });
  const loginData = await loginRes.json();
  assert(loginRes.status === 200, `Login successful with HTTP 200`);
  assert(loginData.user?.email === email1, `Logged in user matches: ${loginData.user?.displayName}`);
  assert(!!loginData.token, 'Login returned valid auth token');

  // ── 4. Invalid Password Rejection ──
  console.log('\n▶ Test 4: Invalid Password Rejection');
  const badLoginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email1, password: 'WrongPassword!' })
  });
  assert(badLoginRes.status === 401, `Invalid password rejected with 401 (Got: ${badLoginRes.status})`);

  // ── 5. /api/auth/me Verification ──
  console.log('\n▶ Test 5: /api/auth/me Session Validation');
  const meRes = await fetch(`${BASE}/api/auth/me`, {
    headers: { 'Authorization': `Bearer ${token1}` }
  });
  const meData = await meRes.json();
  assert(meRes.status === 200, `Me endpoint status is 200`);
  assert(meData.authenticated === true && meData.user?.email === email1, `Authenticated user verified as: ${meData.user?.email}`);

  // ── 6. User Scoping & Isolation Test ──
  console.log('\n▶ Test 6: Per-User Scoping & Conversation Isolation');
  // Register User 2
  const reg2Res = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email2, password: pass2, displayName: 'Test User Two', role: 'SAP GTS Lead' })
  });
  const reg2Data = await reg2Res.json();
  const token2 = reg2Data.token;

  // User 1 creates conversation
  const conv1Res = await fetch(`${BASE}/api/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token1}` },
    body: JSON.stringify({ title: 'User 1 Confidential GTS Case' })
  });
  const conv1Data = await conv1Res.json();
  const conv1Id = conv1Data.conversation?.id;
  assert(!!conv1Id, `User 1 conversation created: ${conv1Id}`);

  // User 2 lists conversations (should NOT see User 1's conversation)
  const conv2ListRes = await fetch(`${BASE}/api/conversations`, {
    headers: { 'Authorization': `Bearer ${token2}` }
  });
  const conv2ListData = await conv2ListRes.json();
  const user2HasUser1Conv = (conv2ListData.conversations || []).some(c => c.id === conv1Id);
  assert(!user2HasUser1Conv, 'User 2 CANNOT access or see User 1 conversations (Strict Isolation Verified)');

  // ── 7. OTP Flow (Send & Verify) ──
  console.log('\n▶ Test 7: OTP One-Time Passcode Flow');
  const otpEmail = `test.otp.${ts}@example.com`;
  const sendOtpRes = await fetch(`${BASE}/api/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: otpEmail })
  });
  const sendOtpData = await sendOtpRes.json();
  assert(sendOtpRes.status === 200, 'OTP sent successfully');
  assert(!!sendOtpData.testOtp, `Generated OTP code: ${sendOtpData.testOtp}`);

  const verifyOtpRes = await fetch(`${BASE}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: otpEmail, otp: sendOtpData.testOtp })
  });
  const verifyOtpData = await verifyOtpRes.json();
  assert(verifyOtpRes.status === 200, 'OTP verified successfully');
  assert(verifyOtpData.user?.email === otpEmail, `OTP logged in user: ${verifyOtpData.user?.email}`);
  assert(!!verifyOtpData.token, 'OTP login generated valid session token');

  // ── 8. Password Reset Flow ──
  console.log('\n▶ Test 8: Password Reset Flow');
  const resetReqRes = await fetch(`${BASE}/api/auth/password-reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email1 })
  });
  const resetReqData = await resetReqRes.json();
  assert(resetReqRes.status === 200, 'Password reset requested successfully');
  const resetOtp = resetReqData.testOtp;

  const newPass1 = 'NewBrandPass2026!';
  const resetConfirmRes = await fetch(`${BASE}/api/auth/reset-password-confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email1, otp: resetOtp, newPassword: newPass1 })
  });
  const resetConfirmData = await resetConfirmRes.json();
  assert(resetConfirmRes.status === 200, 'Password reset confirmed successfully');

  // Try login with new password
  const newLoginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email1, password: newPass1 })
  });
  assert(newLoginRes.status === 200, 'Successfully logged in with new password');

  console.log('\n====================================================');
  console.log(`📊 AUTH TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('====================================================');

  if (failCount > 0) process.exit(1);
  else process.exit(0);
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
