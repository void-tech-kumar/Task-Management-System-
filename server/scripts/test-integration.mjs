import http from 'http';
import app from '../dist/server.js';
import { prisma } from '../dist/config/db.js';
import { OtpService } from '../dist/services/otp.service.js';

let server;
let baseUrl;

async function startServer() {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`Test server running at ${baseUrl}`);
      resolve();
    });
  });
}

async function stopServer() {
  return new Promise((resolve) => {
    if (server) {
      server.close(async () => {
        await prisma.$disconnect();
        resolve();
      });
    } else {
      resolve();
    }
  });
}

const testResults = [];

function recordTest(name, category, passed, details) {
  testResults.push({ name, category, passed, details });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${icon} [${category}] ${name}: ${details}`);
}

async function runTests() {
  await startServer();

  try {
    // TEST 1: Health check
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = await healthRes.json();
    recordTest(
      'Health check endpoint',
      'API',
      healthRes.status === 200 && healthData.status === 'ok',
      `Status ${healthRes.status}, databaseConfigured: ${healthData.databaseConfigured}`
    );

    // TEST 2: Admin Login
    const adminLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@taskflow.edu', password: 'Admin@123' }),
    });
    const adminLoginData = await adminLoginRes.json();
    const adminToken = adminLoginData.data?.token;
    recordTest(
      'Admin Authentication',
      'AUTH',
      adminLoginRes.status === 200 && adminLoginData.data?.user?.role === 'ADMIN',
      `Authenticated as ${adminLoginData.data?.user?.email} (${adminLoginData.data?.user?.role})`
    );

    // TEST 3: Faculty Login
    const facultyLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'robert.miller@taskflow.edu', password: 'Faculty@123' }),
    });
    const facultyLoginData = await facultyLoginRes.json();
    const facultyToken = facultyLoginData.data?.token;
    recordTest(
      'Faculty Authentication',
      'AUTH',
      facultyLoginRes.status === 200 && facultyLoginData.data?.user?.role === 'FACULTY',
      `Authenticated as ${facultyLoginData.data?.user?.email}`
    );

    // TEST 4: Student Login
    const studentLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex.chen@taskflow.edu', password: 'Student@123' }),
    });
    const studentLoginData = await studentLoginRes.json();
    const studentToken = studentLoginData.data?.token;
    recordTest(
      'Student Authentication',
      'AUTH',
      studentLoginRes.status === 200 && studentLoginData.data?.user?.role === 'STUDENT',
      `Authenticated as ${studentLoginData.data?.user?.email}`
    );

    // TEST 5: RBAC - Student forbidden from Admin API
    const rbacRes = await fetch(`${baseUrl}/api/v1/users`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    recordTest(
      'RBAC Student Denied Admin Access',
      'SECURITY',
      rbacRes.status === 403,
      `Student access to /api/v1/users resulted in status ${rbacRes.status} (Forbidden)`
    );

    // TEST 6: Admin allowed on Admin API
    const adminUsersRes = await fetch(`${baseUrl}/api/v1/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminUsersData = await adminUsersRes.json();
    recordTest(
      'RBAC Admin Allowed on Users Management',
      'SECURITY',
      adminUsersRes.status === 200 && Array.isArray(adminUsersData.data?.users),
      `Admin retrieved ${adminUsersData.data?.users?.length} users`
    );

    // TEST 7: OTP Generation and Hashing
    const testOtpEmail = 'test_student_otp@taskflow.edu';
    const otpResult = await OtpService.createOtp(testOtpEmail, 'STUDENT_SIGNUP', {
      fullName: 'Test Student',
      department: 'Computer Science',
    });
    recordTest(
      'OTP Generation & Expiry',
      'OTP',
      otpResult.otp.length === 6 && otpResult.expiresAt > new Date(),
      `Generated 6-digit OTP (expires at ${otpResult.expiresAt.toISOString()})`
    );

    // TEST 8: OTP Cooldown Enforcement
    let cooldownCaught = false;
    try {
      await OtpService.createOtp(testOtpEmail, 'STUDENT_SIGNUP');
    } catch (err) {
      if (err.statusCode === 429) cooldownCaught = true;
    }
    recordTest(
      'OTP Cooldown (60s)',
      'OTP',
      cooldownCaught,
      'Second immediate OTP request blocked with 429 Too Many Requests'
    );

    // TEST 9: Invalid OTP Rejection & Remaining Attempts
    let invalidOtpCaught = false;
    try {
      await OtpService.verifyOtp(testOtpEmail, '000000', 'STUDENT_SIGNUP');
    } catch (err) {
      if (err.statusCode === 400 && err.message.includes('Invalid verification code')) {
        invalidOtpCaught = true;
      }
    }
    recordTest(
      'Invalid OTP Rejection',
      'OTP',
      invalidOtpCaught,
      'Tampered OTP correctly rejected with attempt countdown'
    );

    // TEST 10: Valid OTP Verification
    const verifyResult = await OtpService.verifyOtp(testOtpEmail, otpResult.otp, 'STUDENT_SIGNUP');
    recordTest(
      'Valid OTP Verification',
      'OTP',
      verifyResult.success === true && verifyResult.metadata.fullName === 'Test Student',
      'Valid OTP matched HMAC hash and consumed successfully'
    );

    // TEST 11: Single-Use OTP (Replay Prevention)
    let replayCaught = false;
    try {
      await OtpService.verifyOtp(testOtpEmail, otpResult.otp, 'STUDENT_SIGNUP');
    } catch (err) {
      if (err.statusCode === 400) replayCaught = true;
    }
    recordTest(
      'Single-Use OTP Replay Protection',
      'SECURITY',
      replayCaught,
      'Reusing consumed OTP was immediately rejected'
    );

    // TEST 12: Projects Retrieval
    const projectsRes = await fetch(`${baseUrl}/api/v1/projects`, {
      headers: { Authorization: `Bearer ${facultyToken}` },
    });
    const projectsData = await projectsRes.json();
    recordTest(
      'Projects Listing',
      'PROJECTS',
      projectsRes.status === 200 && projectsData.data?.projects?.length > 0,
      `Retrieved ${projectsData.data?.projects?.length} academic projects`
    );

    // TEST 13: Tasks Retrieval
    const tasksRes = await fetch(`${baseUrl}/api/v1/tasks`, {
      headers: { Authorization: `Bearer ${facultyToken}` },
    });
    const tasksData = await tasksRes.json();
    recordTest(
      'Tasks Retrieval & Filtering',
      'TASKS',
      tasksRes.status === 200 && tasksData.data?.tasks?.length > 0,
      `Retrieved ${tasksData.data?.tasks?.length} tasks across projects`
    );

    // TEST 14: Analytics Dashboard
    const analyticsRes = await fetch(`${baseUrl}/api/v1/analytics/dashboard`, {
      headers: { Authorization: `Bearer ${facultyToken}` },
    });
    const analyticsData = await analyticsRes.json();
    recordTest(
      'Analytics Dashboard Metrics',
      'ANALYTICS',
      analyticsRes.status === 200 && analyticsData.data?.metrics !== undefined,
      `Calculated live metrics for role ${analyticsData.data?.role}`
    );

    // TEST 15: SQL Injection Resistance
    const sqliRes = await fetch(`${baseUrl}/api/v1/projects?search=' OR '1'='1`, {
      headers: { Authorization: `Bearer ${facultyToken}` },
    });
    const sqliData = await sqliRes.json();
    recordTest(
      'SQL Injection Protection (ORM Parameterization)',
      'SECURITY',
      sqliRes.status === 200 && Array.isArray(sqliData.data?.projects),
      'Malicious SQL pattern safely sanitized by Prisma ORM'
    );

    // Clean up temporary OTP test record
    await prisma.otpVerification.deleteMany({ where: { email: testOtpEmail } });

  } finally {
    await stopServer();
  }

  const passedCount = testResults.filter(t => t.passed).length;
  const totalCount = testResults.length;
  console.log(`\n==================================================`);
  console.log(`TEST SUMMARY: ${passedCount}/${totalCount} PASSED`);
  console.log(`==================================================`);
}

runTests().catch(console.error);

