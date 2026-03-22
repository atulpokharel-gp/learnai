import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/lib/api-response";
import { generateLesson } from "@/lib/ai-service";
import { z } from "zod";

const lessonSchema = z.object({
  subject: z.string().min(1),
  topic: z.string().min(1),
  gradeLevel: z.string().min(1),
  topicId: z.string().optional(),
  learningObjectives: z.string().optional(),
  difficultyLevel: z.enum(["easy", "medium", "hard"]).optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  try {
    const body = await req.json();
    const data = lessonSchema.parse(body);

    // Get student profile for personalization
    let studentStrengths: string | undefined;
    let studentWeakAreas: string | undefined;
    let preferredLearningStyle: string | undefined;

    if (session.user.role === "STUDENT") {
      const profile = await prisma.studentProfile.findUnique({
        where: { userId: session.user.id },
      });
      if (profile) {
        studentStrengths = profile.strengths ?? undefined;
        studentWeakAreas = profile.weakAreas ?? undefined;
        preferredLearningStyle = profile.learningStyle ?? undefined;
      }
    }

    const lessonContent = await generateLesson({
      subject: data.subject,
      topic: data.topic,
      gradeLevel: data.gradeLevel,
      learningObjectives: data.learningObjectives,
      difficultyLevel: data.difficultyLevel,
      studentStrengths,
      studentWeakAreas,
      preferredLearningStyle,
    });

    // Save AI session
    const aiSession = await prisma.aIInteractionSession.create({
      data: {
        sessionType: "lesson",
        subject: data.subject,
        topic: data.topic,
        gradeLevel: data.gradeLevel,
        messages: JSON.stringify([
          {
            role: "system",
            content: "Lesson generated",
            timestamp: new Date().toISOString(),
          },
        ]),
        lessonContent,
        status: "completed",
        userId: session.user.id,
        endedAt: new Date(),
      },
    });

    return successResponse({
      sessionId: aiSession.id,
      lessonContent,
      subject: data.subject,
      topic: data.topic,
      gradeLevel: data.gradeLevel,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return errorResponse(err.issues[0]?.message ?? "Validation failed");
    }
    console.error("Lesson generation error:", err);
    return errorResponse("Failed to generate lesson", 500);
  }
}
