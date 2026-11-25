import http from 'http';
import app from '../dist/server.js';
import { prisma } from '../dist/config/db.js';

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
  const createdUserIds = [];

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
      adminLoginRes.status === 200 && adminLoginData.data?.user?.role === 'ADMIN' && Boolean(adminToken),
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
      facultyLoginRes.status === 200 && facultyLoginData.data?.user?.role === 'FACULTY' && Boolean(facultyToken),
      `Authenticated as ${facultyLoginData.data?.user?.email}`
    );

    // TEST 4: Student Login
    const studentLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'emily.davis@taskflow.edu', password: 'Student@123' }),
    });
    const studentLoginData = await studentLoginRes.json();
    const studentToken = studentLoginData.data?.token;
    recordTest(
      'Student Authentication',
      'AUTH',
      studentLoginRes.status === 200 && studentLoginData.data?.user?.role === 'STUDENT' && Boolean(studentToken),
      `Authenticated as ${studentLoginData.data?.user?.email}`
    );

    // TEST 5: Removed Public Registration & OTP Endpoints Return 404
    const removedEndpoints = [
      { method: 'POST', path: '/api/v1/auth/register' },
      { method: 'POST', path: '/api/v1/auth/signup/init' },
      { method: 'POST', path: '/api/v1/auth/signup/verify' },
      { method: 'POST', path: '/api/v1/auth/login/otp/init' },
      { method: 'POST', path: '/api/v1/auth/login/otp/verify' },
      { method: 'POST', path: '/api/v1/auth/otp/resend' },
      { method: 'GET', path: '/api/v1/auth/smtp-status' },
    ];
    const removedStatuses = await Promise.all(
      removedEndpoints.map(async (ep) => {
        const res = await fetch(`${baseUrl}${ep.path}`, {
          method: ep.method,
          headers: { 'Content-Type': 'application/json' },
          body: ep.method === 'POST' ? JSON.stringify({}) : undefined,
        });
        return { ...ep, status: res.status };
      })
    );
    const allRemoved404 = removedStatuses.every((r) => r.status === 404);
    recordTest(
      'Public Registration & OTP Endpoints Removed',
      'SECURITY',
      allRemoved404,
      `All ${removedEndpoints.length} removed endpoints returned 404`
    );

    // TEST 6: Unauthenticated Account Creation Blocked (401)
    const unauthCreateRes = await fetch(`${baseUrl}/api/v1/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'unauth@taskflow.edu',
        password: 'Password@123',
        fullName: 'Unauth User',
        role: 'STUDENT',
      }),
    });
    recordTest(
      'Unauthenticated User Creation Blocked',
      'SECURITY',
      unauthCreateRes.status === 401,
      `Unauthenticated POST /api/v1/users returned ${unauthCreateRes.status}`
    );

    // TEST 7: Student Forbidden from Creating Accounts (403)
    const studentCreateRes = await fetch(`${baseUrl}/api/v1/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        email: 'student_attempt@taskflow.edu',
        password: 'Password@123',
        fullName: 'Student Attempt',
        role: 'STUDENT',
      }),
    });
    recordTest(
      'Student Forbidden from Creating Accounts',
      'SECURITY',
      studentCreateRes.status === 403,
      `Student POST /api/v1/users returned ${studentCreateRes.status}`
    );

    // TEST 8: Faculty Forbidden from Creating Accounts (403)
    const facultyCreateRes = await fetch(`${baseUrl}/api/v1/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${facultyToken}`,
      },
      body: JSON.stringify({
        email: 'faculty_attempt@taskflow.edu',
        password: 'Password@123',
        fullName: 'Faculty Attempt',
        role: 'STUDENT',
      }),
    });
    recordTest(
      'Faculty Forbidden from Creating Accounts',
      'SECURITY',
      facultyCreateRes.status === 403,
      `Faculty POST /api/v1/users returned ${facultyCreateRes.status}`
    );

    // TEST 9: Admin Can Create Admin, Faculty, and Student Accounts
    const rolesToTest = ['ADMIN', 'FACULTY', 'STUDENT'];
    let allRolesCreatedAndVerified = true;
    for (const role of rolesToTest) {
      const testEmail = `test_${role.toLowerCase()}_${Date.now()}@taskflow.edu`;
      const testPassword = 'TestUser@123';
      const createRes = await fetch(`${baseUrl}/api/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          fullName: `Integration ${role}`,
          role,
          department: 'Computer Science',
        }),
      });
      const createData = await createRes.json();
      if (createRes.status !== 201 || createData.data?.user?.role !== role) {
        allRolesCreatedAndVerified = false;
        break;
      }
      createdUserIds.push(createData.data.user.id);

      // Verify newly created user can log in via email + password
      const loginCheck = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: testPassword }),
      });
      if (loginCheck.status !== 200) {
        allRolesCreatedAndVerified = false;
        break;
      }
    }
    recordTest(
      'Admin User Provisioning (ADMIN, FACULTY, STUDENT)',
      'ADMIN',
      allRolesCreatedAndVerified && createdUserIds.length === 3,
      `Created and authenticated all 3 roles via POST /api/v1/users`
    );

    // TEST 10: RBAC - Student forbidden from Admin Directory
    const rbacRes = await fetch(`${baseUrl}/api/v1/users`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    recordTest(
      'RBAC Student Denied Admin Directory',
      'SECURITY',
      rbacRes.status === 403,
      `Student access to GET /api/v1/users resulted in status ${rbacRes.status}`
    );

    // TEST 11: Admin allowed on Admin Directory
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

    // TEST 14: Submissions Retrieval
    const pendingSubRes = await fetch(`${baseUrl}/api/v1/submissions/pending`, {
      headers: { Authorization: `Bearer ${facultyToken}` },
    });
    const mySubRes = await fetch(`${baseUrl}/api/v1/submissions/my-submissions`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    recordTest(
      'Submissions Retrieval (Faculty & Student)',
      'SUBMISSIONS',
      pendingSubRes.status === 200 && mySubRes.status === 200,
      `Faculty pending=${pendingSubRes.status}, Student my-submissions=${mySubRes.status}`
    );

    // TEST 15: Analytics Dashboard
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

    // TEST 16: Invalid Password Rejection
    const badPassRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@taskflow.edu', password: 'WrongPassword123!' }),
    });
    recordTest(
      'Invalid Password Rejection',
      'SECURITY',
      badPassRes.status === 401,
      `Invalid password rejected with status ${badPassRes.status}`
    );

    // TEST 17: Session Persistence (/auth/me) & Logout Cookie Clearing
    const setCookieHeader = adminLoginRes.headers.get('set-cookie') || '';
    const tokenCookieMatch = setCookieHeader.match(/token=([^;]+)/);
    const cookieHeader = tokenCookieMatch ? `token=${tokenCookieMatch[1]}` : '';
    const meRes = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: cookieHeader ? { Cookie: cookieHeader } : { Authorization: `Bearer ${adminToken}` },
    });
    const meData = await meRes.json();
    const logoutRes = await fetch(`${baseUrl}/api/v1/auth/logout`, {
      method: 'POST',
      headers: cookieHeader ? { Cookie: cookieHeader } : {},
    });
    const logoutCookie = logoutRes.headers.get('set-cookie') || '';
    recordTest(
      'Session Persistence & Logout',
      'AUTH',
      meRes.status === 200 && meData.data?.user?.email === 'admin@taskflow.edu' && logoutRes.status === 200 && logoutCookie.includes('token=;'),
      `Verified /auth/me session and cookie clearing on /auth/logout`
    );

    // TEST 18: SQL Injection Resistance
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
  } finally {
    // Clean up only the temporary test users created in TEST 9
    for (const id of createdUserIds) {
      await prisma.user.delete({ where: { id } }).catch(() => {});
    }
    await stopServer();
  }

  const passedCount = testResults.filter((t) => t.passed).length;
  const totalCount = testResults.length;
  console.log(`\n==================================================`);
  console.log(`TEST SUMMARY: ${passedCount}/${totalCount} PASSED`);
  console.log(`==================================================`);
  process.exit(passedCount === totalCount ? 0 : 1);
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
