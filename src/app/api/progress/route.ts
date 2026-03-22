import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/api-response";
import { Role } from "@/generated/prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");
  const classId = searchParams.get("classId");

  // Student can only see their own progress
  if (session.user.role === Role.STUDENT) {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        topicMasteries: {
          include: {
            topic: {
              include: { subject: { select: { name: true } } },
            },
          },
          orderBy: { updatedAt: "desc" },
        },
        learningPlan: {
          include: {
            items: {
              include: {
                topic: {
                  include: { subject: { select: { name: true } } },
                },
              },
              orderBy: { sequenceOrder: "asc" },
            },
          },
        },
      },
    });

    const attempts = await prisma.quizAttempt.findMany({
      where: { userId: session.user.id },
      include: {
        quiz: { select: { title: true, topicId: true } },
      },
      orderBy: { attemptedAt: "desc" },
      take: 20,
    });

    const sessions = await prisma.aIInteractionSession.findMany({
      where: { userId: session.user.id },
      orderBy: { startedAt: "desc" },
      take: 10,
    });

    return successResponse({
      profile,
      quizAttempts: attempts,
      recentSessions: sessions,
      stats: {
        totalQuizAttempts: attempts.length,
        averageScore:
          attempts.length > 0
            ? attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length
            : 0,
        topicsStarted: profile?.topicMasteries.length ?? 0,
        topicsMastered:
          profile?.topicMasteries.filter((m) => m.masteryLevel >= 0.8).length ??
          0,
        totalSessions: sessions.length,
      },
    });
  }

  // Teachers / supervisors / principals can see student progress in their school
  const allowedRoles: Role[] = [
    Role.SAAS_ADMIN,
    Role.SCHOOL_PRINCIPAL,
    Role.CLASS_SUPERVISOR,
    Role.TEACHER,
  ];
  if (!allowedRoles.includes(session.user.role as Role)) {
    return forbiddenResponse();
  }

  if (studentId) {
    // Progress for a specific student
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        studentProfile: {
          include: {
            topicMasteries: {
              include: {
                topic: { include: { subject: { select: { name: true } } } },
              },
            },
            learningPlan: {
              include: {
                items: {
                  include: { topic: true },
                  orderBy: { sequenceOrder: "asc" },
                },
              },
            },
          },
        },
      },
    });

    const attempts = await prisma.quizAttempt.findMany({
      where: { userId: studentId },
      include: {
        quiz: { select: { title: true, topicId: true, gradeLevel: true } },
      },
      orderBy: { attemptedAt: "desc" },
    });

    return successResponse({
      student,
      quizAttempts: attempts,
      stats: {
        totalQuizAttempts: attempts.length,
        averageScore:
          attempts.length > 0
            ? attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length
            : 0,
        topicsMastered:
          student?.studentProfile?.topicMasteries.filter(
            (m) => m.masteryLevel >= 0.8
          ).length ?? 0,
      },
    });
  }

  if (classId) {
    // Class-level progress summary
    const students = await prisma.studentProfile.findMany({
      where: { classId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        topicMasteries: true,
      },
    });

    const studentStats = await Promise.all(
      students.map(async (s) => {
        const attempts = await prisma.quizAttempt.findMany({
          where: { userId: s.userId },
        });
        return {
          studentId: s.userId,
          name: `${s.user.firstName} ${s.user.lastName}`,
          email: s.user.email,
          gradeLevel: s.gradeLevel,
          onboardingComplete: s.onboardingComplete,
          totalQuizAttempts: attempts.length,
          averageScore:
            attempts.length > 0
              ? attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length
              : 0,
          topicsMastered: s.topicMasteries.filter((m) => m.masteryLevel >= 0.8)
            .length,
        };
      })
    );

    return successResponse({ classId, students: studentStats });
  }

  // School-level summary
  if (session.user.schoolId) {
    const schoolStudents = await prisma.studentProfile.count({
      where: {
        user: { schoolId: session.user.schoolId },
      },
    });

    const completedOnboarding = await prisma.studentProfile.count({
      where: {
        user: { schoolId: session.user.schoolId },
        onboardingComplete: true,
      },
    });

    const recentAttempts = await prisma.quizAttempt.findMany({
      where: {
        user: { schoolId: session.user.schoolId },
      },
      orderBy: { attemptedAt: "desc" },
      take: 50,
    });

    const avgScore =
      recentAttempts.length > 0
        ? recentAttempts.reduce((sum, a) => sum + a.score, 0) /
          recentAttempts.length
        : 0;

    return successResponse({
      schoolId: session.user.schoolId,
      totalStudents: schoolStudents,
      completedOnboarding,
      recentQuizAvgScore: Math.round(avgScore),
      recentAttemptCount: recentAttempts.length,
    });
  }

  return forbiddenResponse();
}
