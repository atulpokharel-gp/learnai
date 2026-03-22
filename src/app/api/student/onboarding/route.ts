import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/api-response";
import { Role } from "@/generated/prisma/client";
import { generateLearningPlan } from "@/lib/ai-service";
import { z } from "zod";

const onboardingSchema = z.object({
  gradeLevel: z.string().min(1),
  dateOfBirth: z.string().optional(),
  preferredSubjects: z.string().optional(),
  strengths: z.string().optional(),
  weakAreas: z.string().optional(),
  learningStyle: z
    .enum(["visual", "auditory", "reading", "kinesthetic"])
    .optional(),
  confidenceLevel: z.enum(["low", "medium", "high"]).optional(),
  diagnosticScore: z.number().min(0).max(100).optional(),
  diagnosticAnswers: z.string().optional(),
  classId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();
  if (session.user.role !== Role.STUDENT) return forbiddenResponse();

  try {
    const body = await req.json();
    const data = onboardingSchema.parse(body);

    // Update or create student profile
    const studentProfile = await prisma.studentProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        gradeLevel: data.gradeLevel,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        preferredSubjects: data.preferredSubjects,
        strengths: data.strengths,
        weakAreas: data.weakAreas,
        learningStyle: data.learningStyle,
        confidenceLevel: data.confidenceLevel,
        diagnosticScore: data.diagnosticScore,
        classId: data.classId,
        onboardingComplete: true,
      },
      update: {
        gradeLevel: data.gradeLevel,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        preferredSubjects: data.preferredSubjects,
        strengths: data.strengths,
        weakAreas: data.weakAreas,
        learningStyle: data.learningStyle,
        confidenceLevel: data.confidenceLevel,
        diagnosticScore: data.diagnosticScore,
        classId: data.classId,
        onboardingComplete: true,
      },
    });

    // Generate personalized learning plan
    const schoolId = session.user.schoolId;
    let learningPlan = null;

    if (schoolId) {
      const availableTopics = await prisma.topic.findMany({
        where: { schoolId, isActive: true },
        include: { subject: { select: { name: true } } },
        take: 50,
        orderBy: { sequenceOrder: "asc" },
      });

      const topicsForPlan = availableTopics.map((t) => ({
        id: t.id,
        title: t.title,
        subject: t.subject?.name ?? "General",
      }));

      if (topicsForPlan.length > 0) {
        const planData = await generateLearningPlan(
          {
            gradeLevel: data.gradeLevel,
            strengths: data.strengths,
            weakAreas: data.weakAreas,
            confidenceLevel: data.confidenceLevel,
            diagnosticScore: data.diagnosticScore,
            preferredSubjects: data.preferredSubjects,
          },
          topicsForPlan
        );

        // Create or update learning plan
        const existingPlan = await prisma.studentLearningPlan.findUnique({
          where: { studentProfileId: studentProfile.id },
        });

        if (existingPlan) {
          learningPlan = await prisma.studentLearningPlan.update({
            where: { studentProfileId: studentProfile.id },
            data: {
              recommendedPath: planData.recommendedPath,
              notes: planData.notes,
              status: "active",
            },
          });
        } else {
          learningPlan = await prisma.studentLearningPlan.create({
            data: {
              studentProfileId: studentProfile.id,
              recommendedPath: planData.recommendedPath,
              notes: planData.notes,
              status: "active",
            },
          });

          // Create plan items
          const priorityTopics = planData.priorityTopics.slice(0, 10);
          for (let i = 0; i < priorityTopics.length; i++) {
            const topicId = priorityTopics[i];
            if (topicsForPlan.find((t) => t.id === topicId)) {
              await prisma.learningPlanItem.create({
                data: {
                  learningPlanId: learningPlan.id,
                  topicId,
                  sequenceOrder: i + 1,
                  status: i === 0 ? "in_progress" : "pending",
                  itemType: "lesson",
                },
              });
            }
          }
        }
      }
    }

    return successResponse({
      studentProfile,
      learningPlan,
      message: "Onboarding complete! Your personalized learning journey is ready.",
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return errorResponse(err.issues[0]?.message ?? "Validation failed");
    }
    console.error("Onboarding error:", err);
    return errorResponse("Failed to complete onboarding", 500);
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();
  if (session.user.role !== Role.STUDENT) return forbiddenResponse();

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      class: { select: { id: true, name: true, gradeLevel: true } },
      learningPlan: {
        include: {
          items: {
            include: {
              topic: {
                include: {
                  subject: { select: { name: true } },
                },
              },
            },
            orderBy: { sequenceOrder: "asc" },
          },
        },
      },
    },
  });

  return successResponse(profile);
}
