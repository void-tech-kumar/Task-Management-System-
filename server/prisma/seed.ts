import { PrismaClient, Role, Priority, TaskCategory, TaskStatus, SubmissionStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting TaskFlow idempotent database seeding...');

  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('Admin@123', salt);
  const facultyPassword = await bcrypt.hash('Faculty@123', salt);
  const studentPassword = await bcrypt.hash('Student@123', salt);

  // 1. Idempotently Upsert Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@taskflow.edu' },
    update: { isVerified: true },
    create: {
      email: 'admin@taskflow.edu',
      passwordHash: adminPassword,
      fullName: 'Dr. Dean Harrison (Admin)',
      role: Role.ADMIN,
      department: 'Academic Administration',
      isVerified: true,
    },
  });

  const faculty1 = await prisma.user.upsert({
    where: { email: 'robert.miller@taskflow.edu' },
    update: { isVerified: true },
    create: {
      email: 'robert.miller@taskflow.edu',
      passwordHash: facultyPassword,
      fullName: 'Dr. Robert Miller',
      role: Role.FACULTY,
      department: 'Computer Science',
      isVerified: true,
    },
  });

  const faculty2 = await prisma.user.upsert({
    where: { email: 'sarah.jenkins@taskflow.edu' },
    update: { isVerified: true },
    create: {
      email: 'sarah.jenkins@taskflow.edu',
      passwordHash: facultyPassword,
      fullName: 'Prof. Sarah Jenkins',
      role: Role.FACULTY,
      department: 'Software Engineering',
      isVerified: true,
    },
  });

  const student1 = await prisma.user.upsert({
    where: { email: 'alex.chen@taskflow.edu' },
    update: { isVerified: true },
    create: {
      email: 'alex.chen@taskflow.edu',
      passwordHash: studentPassword,
      fullName: 'Alex Chen',
      role: Role.STUDENT,
      department: 'Computer Science',
      isVerified: true,
    },
  });

  const student2 = await prisma.user.upsert({
    where: { email: 'priya.sharma@taskflow.edu' },
    update: { isVerified: true },
    create: {
      email: 'priya.sharma@taskflow.edu',
      passwordHash: studentPassword,
      fullName: 'Priya Sharma',
      role: Role.STUDENT,
      department: 'Computer Science',
      isVerified: true,
    },
  });

  const student3 = await prisma.user.upsert({
    where: { email: 'marcus.johnson@taskflow.edu' },
    update: { isVerified: true },
    create: {
      email: 'marcus.johnson@taskflow.edu',
      passwordHash: studentPassword,
      fullName: 'Marcus Johnson',
      role: Role.STUDENT,
      department: 'Software Engineering',
      isVerified: true,
    },
  });

  const student4 = await prisma.user.upsert({
    where: { email: 'emily.davis@taskflow.edu' },
    update: { isVerified: true },
    create: {
      email: 'emily.davis@taskflow.edu',
      passwordHash: studentPassword,
      fullName: 'Emily Davis',
      role: Role.STUDENT,
      department: 'Software Engineering',
      isVerified: true,
    },
  });

  console.log('✅ Users upserted successfully');

  // 2. Idempotently Upsert Projects
  const project1 = await prisma.project.upsert({
    where: { code: 'CS401' },
    update: {},
    create: {
      title: 'Distributed Systems & Cloud Computing',
      code: 'CS401',
      description: 'Hands-on exploration of consensus algorithms (Raft), microservices, containerization, and serverless architectures.',
      department: 'Computer Science',
      facultyId: faculty1.id,
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-12-20'),
      status: 'ACTIVE',
    },
  });

  const project2 = await prisma.project.upsert({
    where: { code: 'SE302' },
    update: {},
    create: {
      title: 'Full-Stack Software Architecture',
      code: 'SE302',
      description: 'Design and deployment of scalable enterprise web applications using modern React, TypeScript, Node.js, and relational databases.',
      department: 'Software Engineering',
      facultyId: faculty2.id,
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-12-15'),
      status: 'ACTIVE',
    },
  });

  const project3 = await prisma.project.upsert({
    where: { code: 'CS450' },
    update: {},
    create: {
      title: 'Applied Machine Learning & Capstone',
      code: 'CS450',
      description: 'Supervised ML model engineering, data cleansing pipelines, evaluation metrics, and production inference.',
      department: 'Computer Science',
      facultyId: faculty1.id,
      startDate: new Date('2026-10-01'),
      endDate: new Date('2027-01-30'),
      status: 'ACTIVE',
    },
  });

  // Ensure Project Memberships
  const memberships = [
    { projectId: project1.id, userId: student1.id },
    { projectId: project1.id, userId: student2.id },
    { projectId: project1.id, userId: student3.id },
    { projectId: project2.id, userId: student1.id },
    { projectId: project2.id, userId: student3.id },
    { projectId: project2.id, userId: student4.id },
    { projectId: project3.id, userId: student2.id },
    { projectId: project3.id, userId: student4.id },
  ];

  for (const m of memberships) {
    await prisma.projectMember.upsert({
      where: {
        projectId_userId: { projectId: m.projectId, userId: m.userId },
      },
      update: {},
      create: m,
    });
  }

  console.log('✅ Projects & memberships verified');

  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;

  // 3. Create sample tasks idempotently if project has none
  const existingTasksCount = await prisma.task.count({ where: { projectId: project1.id } });
  if (existingTasksCount === 0) {
    const task1 = await prisma.task.create({
      data: {
        title: 'Milestone 1: Raft Consensus RPC Specification',
        description: 'Draft the formal RPC payload schema for LeaderElection and AppendEntries methods, adhering to Raft paper section 5.',
        projectId: project1.id,
        creatorId: faculty1.id,
        status: TaskStatus.COMPLETED,
        priority: Priority.HIGH,
        category: TaskCategory.PROJECT_MILESTONE,
        dueDate: new Date(now.getTime() - 5 * dayMs),
        orderIndex: 0,
        maxPoints: 100,
        assignments: {
          create: [{ userId: student1.id }, { userId: student2.id }],
        },
      },
    });

    const task2 = await prisma.task.create({
      data: {
        title: 'Lab 2: Dockerizing Microservices & Docker Compose',
        description: 'Write Dockerfiles with multi-stage builds for the auth and billing microservices. Include health checks in compose yaml.',
        projectId: project1.id,
        creatorId: faculty1.id,
        status: TaskStatus.IN_REVIEW,
        priority: Priority.MEDIUM,
        category: TaskCategory.LAB_WORK,
        dueDate: new Date(now.getTime() + 1 * dayMs),
        orderIndex: 1,
        maxPoints: 80,
        assignments: {
          create: [{ userId: student1.id }],
        },
      },
    });

    await prisma.task.create({
      data: {
        title: 'Assignment 3: gRPC Inter-Service Communication',
        description: 'Implement streaming gRPC client/server interfaces with protocol buffers v3 and mutual TLS authentication.',
        projectId: project1.id,
        creatorId: faculty1.id,
        status: TaskStatus.IN_PROGRESS,
        priority: Priority.HIGH,
        category: TaskCategory.ASSIGNMENT,
        dueDate: new Date(now.getTime() + 4 * dayMs),
        orderIndex: 2,
        maxPoints: 100,
        assignments: {
          create: [{ userId: student2.id }, { userId: student3.id }],
        },
      },
    });

    // Sample Submissions
    await prisma.taskSubmission.create({
      data: {
        taskId: task1.id,
        studentId: student1.id,
        content: 'Implemented complete Raft RPC protocol specification with protobuf schemas and message sequence diagrams.',
        attachmentUrl: 'https://github.com/alexchen/raft-rpc-spec',
        status: SubmissionStatus.EVALUATED,
        grade: 96,
        feedback: 'Excellent RPC definition. Clear timing diagrams and state transitions.',
        evaluatorId: faculty1.id,
        evaluatedAt: new Date(now.getTime() - 3 * dayMs),
      },
    });

    await prisma.taskSubmission.create({
      data: {
        taskId: task2.id,
        studentId: student1.id,
        content: 'Completed Dockerfiles with alpine-based multi-stage builds.',
        attachmentUrl: 'https://github.com/alexchen/docker-microservices-lab',
        status: SubmissionStatus.SUBMITTED,
        submittedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      },
    });
  }

  const existingTasksProject2 = await prisma.task.count({ where: { projectId: project2.id } });
  if (existingTasksProject2 === 0) {
    await prisma.task.create({
      data: {
        title: 'Milestone 1: Database Schema & Prisma Migrations',
        description: 'Design 3NF normalized schema for TaskFlow entities. Provide relational ER diagram and initial seeds.',
        projectId: project2.id,
        creatorId: faculty2.id,
        status: TaskStatus.COMPLETED,
        priority: Priority.URGENT,
        category: TaskCategory.PROJECT_MILESTONE,
        dueDate: new Date(now.getTime() - 2 * dayMs),
        orderIndex: 0,
        maxPoints: 100,
        assignments: {
          create: [{ userId: student3.id }, { userId: student4.id }],
        },
      },
    });

    await prisma.task.create({
      data: {
        title: 'Lab 3: Drag & Drop Kanban Board Implementation',
        description: 'Build interactive Kanban board using @hello-pangea/dnd with optimistic state updates and error rollbacks.',
        projectId: project2.id,
        creatorId: faculty2.id,
        status: TaskStatus.IN_PROGRESS,
        priority: Priority.HIGH,
        category: TaskCategory.LAB_WORK,
        dueDate: new Date(now.getTime() + 2 * dayMs),
        orderIndex: 1,
        maxPoints: 100,
        assignments: {
          create: [{ userId: student1.id }, { userId: student4.id }],
        },
      },
    });
  }

  console.log('🎉 Idempotent database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
