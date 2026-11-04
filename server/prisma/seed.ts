import { PrismaClient, Role, Priority, TaskCategory, TaskStatus, SubmissionStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting TaskFlow database seeding...');

  // Clean existing records in correct relation order
  await prisma.notification.deleteMany();
  await prisma.taskComment.deleteMany();
  await prisma.taskSubmission.deleteMany();
  await prisma.taskAssignment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('Admin@123', salt);
  const facultyPassword = await bcrypt.hash('Faculty@123', salt);
  const studentPassword = await bcrypt.hash('Student@123', salt);

  // 1. Create Users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@taskflow.edu',
      passwordHash: adminPassword,
      fullName: 'Dr. Dean Harrison (Admin)',
      role: Role.ADMIN,
      department: 'Academic Administration',
    },
  });

  const faculty1 = await prisma.user.create({
    data: {
      email: 'robert.miller@taskflow.edu',
      passwordHash: facultyPassword,
      fullName: 'Dr. Robert Miller',
      role: Role.FACULTY,
      department: 'Computer Science',
    },
  });

  const faculty2 = await prisma.user.create({
    data: {
      email: 'sarah.jenkins@taskflow.edu',
      passwordHash: facultyPassword,
      fullName: 'Prof. Sarah Jenkins',
      role: Role.FACULTY,
      department: 'Software Engineering',
    },
  });

  const student1 = await prisma.user.create({
    data: {
      email: 'alex.chen@taskflow.edu',
      passwordHash: studentPassword,
      fullName: 'Alex Chen',
      role: Role.STUDENT,
      department: 'Computer Science',
    },
  });

  const student2 = await prisma.user.create({
    data: {
      email: 'priya.sharma@taskflow.edu',
      passwordHash: studentPassword,
      fullName: 'Priya Sharma',
      role: Role.STUDENT,
      department: 'Computer Science',
    },
  });

  const student3 = await prisma.user.create({
    data: {
      email: 'marcus.johnson@taskflow.edu',
      passwordHash: studentPassword,
      fullName: 'Marcus Johnson',
      role: Role.STUDENT,
      department: 'Software Engineering',
    },
  });

  const student4 = await prisma.user.create({
    data: {
      email: 'emily.davis@taskflow.edu',
      passwordHash: studentPassword,
      fullName: 'Emily Davis',
      role: Role.STUDENT,
      department: 'Software Engineering',
    },
  });

  console.log('✅ Users created successfully');

  // 2. Create Projects
  const project1 = await prisma.project.create({
    data: {
      title: 'Distributed Systems & Cloud Computing',
      code: 'CS401',
      description: 'Hands-on exploration of consensus algorithms (Raft), microservices, containerization, and serverless architectures.',
      department: 'Computer Science',
      facultyId: faculty1.id,
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-12-20'),
      status: 'ACTIVE',
      members: {
        create: [
          { userId: student1.id },
          { userId: student2.id },
          { userId: student3.id },
        ],
      },
    },
  });

  const project2 = await prisma.project.create({
    data: {
      title: 'Full-Stack Software Architecture',
      code: 'SE302',
      description: 'Design and deployment of scalable enterprise web applications using modern React, TypeScript, Node.js, and relational databases.',
      department: 'Software Engineering',
      facultyId: faculty2.id,
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-12-15'),
      status: 'ACTIVE',
      members: {
        create: [
          { userId: student1.id },
          { userId: student3.id },
          { userId: student4.id },
        ],
      },
    },
  });

  const project3 = await prisma.project.create({
    data: {
      title: 'Applied Machine Learning & Capstone',
      code: 'CS450',
      description: 'Supervised ML model engineering, data cleansing pipelines, evaluation metrics, and production inference.',
      department: 'Computer Science',
      facultyId: faculty1.id,
      startDate: new Date('2026-10-01'),
      endDate: new Date('2027-01-30'),
      status: 'ACTIVE',
      members: {
        create: [
          { userId: student2.id },
          { userId: student4.id },
        ],
      },
    },
  });

  console.log('✅ Projects & memberships created');

  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;

  // 3. Create Tasks for Project 1 (CS401)
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
      dueDate: new Date(now.getTime() + 1 * dayMs), // Due in 24 hours!
      orderIndex: 0,
      maxPoints: 80,
      assignments: {
        create: [{ userId: student1.id }],
      },
    },
  });

  const task3 = await prisma.task.create({
    data: {
      title: 'Assignment 3: gRPC Inter-Service Communication',
      description: 'Implement streaming gRPC client/server interfaces with protocol buffers v3 and mutual TLS authentication.',
      projectId: project1.id,
      creatorId: faculty1.id,
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      category: TaskCategory.ASSIGNMENT,
      dueDate: new Date(now.getTime() + 4 * dayMs),
      orderIndex: 0,
      maxPoints: 100,
      assignments: {
        create: [{ userId: student2.id }, { userId: student3.id }],
      },
    },
  });

  const task4 = await prisma.task.create({
    data: {
      title: 'Research Paper Review: Amazon Dynamo Paper',
      description: 'Write a 2-page critical review of Dynamo: consistent hashing, vector clocks, and sloppy quorums.',
      projectId: project1.id,
      creatorId: faculty1.id,
      status: TaskStatus.TODO,
      priority: Priority.LOW,
      category: TaskCategory.READING,
      dueDate: new Date(now.getTime() + 10 * dayMs),
      orderIndex: 0,
      maxPoints: 50,
      assignments: {
        create: [{ userId: student1.id }, { userId: student3.id }],
      },
    },
  });

  // 4. Create Tasks for Project 2 (SE302)
  const task5 = await prisma.task.create({
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

  const task6 = await prisma.task.create({
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

  const task7 = await prisma.task.create({
    data: {
      title: 'Assignment 4: Secure Cookie JWT Auth Integration',
      description: 'Configure HttpOnly cookie transmission with CSRF safeguards and role verification guards in React Router.',
      projectId: project2.id,
      creatorId: faculty2.id,
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      category: TaskCategory.ASSIGNMENT,
      dueDate: new Date(now.getTime() + 7 * dayMs),
      orderIndex: 1,
      maxPoints: 90,
      assignments: {
        create: [{ userId: student3.id }],
      },
    },
  });

  // 5. Create Submissions
  // Task 1 Submissions (Evaluated)
  await prisma.taskSubmission.create({
    data: {
      taskId: task1.id,
      studentId: student1.id,
      content: 'Implemented complete Raft RPC protocol specification with protobuf schemas and message sequence diagrams.',
      attachmentUrl: 'https://github.com/alexchen/raft-rpc-spec',
      status: SubmissionStatus.EVALUATED,
      grade: 96,
      feedback: 'Excellent RPC definition. Clear timing diagrams and state transitions. Minor note: specify heartbeat intervals explicitly.',
      evaluatorId: faculty1.id,
      evaluatedAt: new Date(now.getTime() - 3 * dayMs),
    },
  });

  // Task 2 Submission (Pending Evaluation)
  await prisma.taskSubmission.create({
    data: {
      taskId: task2.id,
      studentId: student1.id,
      content: 'Completed Dockerfiles with alpine-based multi-stage builds. Docker compose configured with healthchecks on port 5000.',
      attachmentUrl: 'https://github.com/alexchen/docker-microservices-lab',
      status: SubmissionStatus.SUBMITTED,
      submittedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
    },
  });

  // Task 5 Submissions (Evaluated)
  await prisma.taskSubmission.create({
    data: {
      taskId: task5.id,
      studentId: student4.id,
      content: 'Generated Prisma schema with relational keys, cascade behaviors, and comprehensive seed data for testing.',
      attachmentUrl: 'https://github.com/emilydavis/taskflow-db-schema',
      status: SubmissionStatus.EVALUATED,
      grade: 98,
      feedback: 'Outstanding normalization and index placement on foreign keys.',
      evaluatorId: faculty2.id,
      evaluatedAt: new Date(now.getTime() - 1 * dayMs),
    },
  });

  // 6. Create Comments
  await prisma.taskComment.create({
    data: {
      taskId: task2.id,
      userId: student1.id,
      content: 'Professor, should we configure automated volume mounting for the database container in the compose file?',
    },
  });

  await prisma.taskComment.create({
    data: {
      taskId: task2.id,
      userId: faculty1.id,
      content: 'Yes, use a named volume so database state persists across container restarts.',
    },
  });

  // 7. Create Initial Notifications
  await prisma.notification.create({
    data: {
      userId: student1.id,
      title: 'Upcoming Deadline Warning',
      message: 'Task "Lab 2: Dockerizing Microservices & Docker Compose" is due in approximately 24 hours!',
      type: 'DEADLINE_APPROACHING',
      referenceUrl: `/app/tasks/${task2.id}`,
    },
  });

  await prisma.notification.create({
    data: {
      userId: student1.id,
      title: 'Task Submission Evaluated',
      message: 'Your work for "Milestone 1: Raft Consensus RPC Specification" has been evaluated: Grade 96/100.',
      type: 'SUBMISSION_EVALUATED',
      referenceUrl: `/app/my-submissions`,
    },
  });

  await prisma.notification.create({
    data: {
      userId: faculty1.id,
      title: 'New Student Submission',
      message: 'Alex Chen submitted work for "Lab 2: Dockerizing Microservices & Docker Compose".',
      type: 'TASK_ASSIGNED',
      referenceUrl: `/app/evaluations`,
    },
  });

  console.log('✅ Seeding complete!');
  console.log('\n--- DEMO ACCOUNTS READY ---');
  console.log('👑 Admin:   admin@taskflow.edu            | Password: Admin@123');
  console.log('👨‍🏫 Faculty: robert.miller@taskflow.edu    | Password: Faculty@123');
  console.log('👩‍🏫 Faculty: sarah.jenkins@taskflow.edu    | Password: Faculty@123');
  console.log('🎓 Student: alex.chen@taskflow.edu        | Password: Student@123');
  console.log('🎓 Student: priya.sharma@taskflow.edu     | Password: Student@123');
  console.log('🎓 Student: marcus.johnson@taskflow.edu   | Password: Student@123');
  console.log('🎓 Student: emily.davis@taskflow.edu      | Password: Student@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

