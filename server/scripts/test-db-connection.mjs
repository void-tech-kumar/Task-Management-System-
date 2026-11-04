import dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const start = Date.now();
    const result = await prisma.$queryRaw`SELECT version(), current_database(), current_user;`;
    const elapsed = Date.now() - start;
    console.log('=== STEP 10 & 15: NEON CONNECTIVITY VERIFICATION ===');
    console.log('Status: ONLINE & REACHABLE');
    console.log('Query Latency:', elapsed + 'ms');
    console.log('Database Name:', result[0].current_database);
    console.log('Database User:', result[0].current_user);
    console.log('PostgreSQL Engine:', result[0].version.substring(0, 35) + '...');
    
    console.log('\n=== STEP 17: REAL DATABASE READ OPERATIONS ===');
    const userCount = await prisma.user.count();
    const projectCount = await prisma.project.count();
    const taskCount = await prisma.task.count();
    console.log(`Record Counts: Users=${userCount}, Projects=${projectCount}, Tasks=${taskCount}`);

    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, fullName: true, isVerified: true },
      take: 4,
    });
    console.log('\nSample Users Query:');
    users.forEach(u => console.log(` - [${u.role}] ${u.fullName} (${u.email}) [Verified: ${u.isVerified}]`));

    const projects = await prisma.project.findMany({
      select: { id: true, title: true, status: true, department: true },
      take: 3,
    });
    console.log('\nSample Projects Query:');
    projects.forEach(p => console.log(` - [${p.status}] "${p.title}" (Dept: ${p.department || 'N/A'})`));

    const tasks = await prisma.task.findMany({
      select: { id: true, title: true, status: true, priority: true },
      take: 3,
    });
    console.log('\nSample Tasks Query:');
    tasks.forEach(t => console.log(` - [${t.status} | ${t.priority}] "${t.title}"`));

    await prisma.$disconnect();
    console.log('\n>>> All Real Database Read Operations Completed Successfully with ZERO errors. <<<');
    process.exit(0);
  } catch (err) {
    console.error('Database connection error:', err.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
