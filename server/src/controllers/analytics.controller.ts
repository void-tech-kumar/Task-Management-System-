import { Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { sendResponse } from '../utils/apiResponse.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export const getDashboardStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const now = new Date();

    if (user.role === 'ADMIN') {
      // Admin Institution-Wide Metrics
      const [
        totalUsers,
        adminCount,
        facultyCount,
        studentCount,
        totalProjects,
        activeProjects,
        totalTasks,
        completedTasks,
        totalSubmissions,
        evaluatedSubmissions,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: 'ADMIN' } }),
        prisma.user.count({ where: { role: 'FACULTY' } }),
        prisma.user.count({ where: { role: 'STUDENT' } }),
        prisma.project.count(),
        prisma.project.count({ where: { status: 'ACTIVE' } }),
        prisma.task.count(),
        prisma.task.count({ where: { status: 'COMPLETED' } }),
        prisma.taskSubmission.count(),
        prisma.taskSubmission.count({ where: { status: 'EVALUATED' } }),
      ]);

      const globalCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const evaluationRate = totalSubmissions > 0 ? Math.round((evaluatedSubmissions / totalSubmissions) * 100) : 0;

      // Grade aggregates
      const gradesAgg = await prisma.taskSubmission.aggregate({
        where: { grade: { not: null } },
        _avg: { grade: true },
      });

      sendResponse({
        res,
        data: {
          role: 'ADMIN',
          metrics: {
            totalUsers,
            roleDistribution: { admin: adminCount, faculty: facultyCount, student: studentCount },
            totalProjects,
            activeProjects,
            totalTasks,
            completedTasks,
            globalCompletionRate,
            totalSubmissions,
            evaluatedSubmissions,
            evaluationRate,
            averageGrade: gradesAgg._avg.grade ? Math.round(gradesAgg._avg.grade * 10) / 10 : 0,
          },
        },
      });
      return;
    }

    if (user.role === 'FACULTY') {
      // Faculty Specific Metrics
      const [
        myProjectsCount,
        activeProjectsCount,
        facultyTasks,
        pendingEvaluationsCount,
        totalSubmissionsReceived,
      ] = await Promise.all([
        prisma.project.count({ where: { facultyId: user.userId } }),
        prisma.project.count({ where: { facultyId: user.userId, status: 'ACTIVE' } }),
        prisma.task.findMany({
          where: { project: { facultyId: user.userId } },
          select: { id: true, status: true, dueDate: true },
        }),
        prisma.taskSubmission.count({
          where: {
            task: { project: { facultyId: user.userId } },
            status: 'SUBMITTED',
          },
        }),
        prisma.taskSubmission.count({
          where: { task: { project: { facultyId: user.userId } } },
        }),
      ]);

      const totalTasks = facultyTasks.length;
      const completedTasks = facultyTasks.filter((t) => t.status === 'COMPLETED').length;
      const inReviewTasks = facultyTasks.filter((t) => t.status === 'IN_REVIEW').length;
      const overdueTasks = facultyTasks.filter(
        (t) => t.status !== 'COMPLETED' && new Date(t.dueDate) < now
      ).length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Unique students enrolled across faculty projects
      const enrolledStudents = await prisma.projectMember.findMany({
        where: { project: { facultyId: user.userId } },
        distinct: ['userId'],
        select: { userId: true },
      });

      // Grade average for faculty tasks
      const gradesAgg = await prisma.taskSubmission.aggregate({
        where: {
          task: { project: { facultyId: user.userId } },
          grade: { not: null },
        },
        _avg: { grade: true },
      });

      sendResponse({
        res,
        data: {
          role: 'FACULTY',
          metrics: {
            totalProjects: myProjectsCount,
            activeProjects: activeProjectsCount,
            totalStudentsEnrolled: enrolledStudents.length,
            totalTasks,
            completedTasks,
            inReviewTasks,
            overdueTasks,
            completionRate,
            pendingEvaluations: pendingEvaluationsCount,
            totalSubmissions: totalSubmissionsReceived,
            averageGradeGiven: gradesAgg._avg.grade ? Math.round(gradesAgg._avg.grade * 10) / 10 : 0,
          },
        },
      });
      return;
    }

    if (user.role === 'STUDENT') {
      // Student Specific Metrics
      const [
        enrolledProjectsCount,
        assignedTasks,
        studentSubmissions,
      ] = await Promise.all([
        prisma.projectMember.count({ where: { userId: user.userId } }),
        prisma.task.findMany({
          where: {
            assignments: { some: { userId: user.userId } },
          },
          select: { id: true, status: true, dueDate: true, maxPoints: true },
        }),
        prisma.taskSubmission.findMany({
          where: { studentId: user.userId },
          select: { id: true, grade: true, status: true, taskId: true },
        }),
      ]);

      const totalAssigned = assignedTasks.length;
      const completed = assignedTasks.filter((t) => t.status === 'COMPLETED').length;
      const inProgress = assignedTasks.filter((t) => t.status === 'IN_PROGRESS').length;
      const inReview = assignedTasks.filter((t) => t.status === 'IN_REVIEW').length;
      const todo = assignedTasks.filter((t) => t.status === 'TODO').length;
      const overdue = assignedTasks.filter(
        (t) => t.status !== 'COMPLETED' && new Date(t.dueDate) < now
      ).length;

      const completionRate = totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0;

      // Calculate personal average grade percentage
      let totalGradePercentSum = 0;
      let evaluatedCount = 0;
      studentSubmissions.forEach((sub) => {
        if (sub.grade !== null && sub.status === 'EVALUATED') {
          const task = assignedTasks.find((t) => t.id === sub.taskId);
          const max = task?.maxPoints || 100;
          totalGradePercentSum += (sub.grade / max) * 100;
          evaluatedCount++;
        }
      });
      const averageGradePercent = evaluatedCount > 0 ? Math.round((totalGradePercentSum / evaluatedCount) * 10) / 10 : 0;

      sendResponse({
        res,
        data: {
          role: 'STUDENT',
          metrics: {
            enrolledProjects: enrolledProjectsCount,
            totalAssignedTasks: totalAssigned,
            completedTasks: completed,
            inProgressTasks: inProgress,
            inReviewTasks: inReview,
            todoTasks: todo,
            overdueTasks: overdue,
            completionRate,
            totalSubmissions: studentSubmissions.length,
            evaluatedSubmissions: evaluatedCount,
            averageGradePercent,
          },
        },
      });
      return;
    }
  } catch (error) {
    next(error);
  }
};

