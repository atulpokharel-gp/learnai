import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/lib/api-response";
import { generateQuiz } from "@/lib/ai-service";
import { z } from "zod";

const quizSchema = z.object({
  subject: z.string().min(1),
  topic: z.string().min(1),
  gradeLevel: z.string().min(1),
  topicId: z.string().optional(),
  numQuestions: z.number().int().min(1).max(20).optional(),
  difficultyLevel: z.enum(["easy", "medium", "hard"]).optional(),
  saveQuiz: z.boolean().optional(),
  quizTitle: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  try {
    const body = await req.json();
    const data = quizSchema.parse(body);

    const questions = await generateQuiz({
      subject: data.subject,
      topic: data.topic,
      gradeLevel: data.gradeLevel,
      numQuestions: data.numQuestions ?? 5,
      difficultyLevel: data.difficultyLevel,
    });

    let savedQuizId: string | null = null;

    if (data.saveQuiz && questions.length > 0) {
      const quiz = await prisma.quiz.create({
        data: {
          title: data.quizTitle ?? `${data.topic} Quiz`,
          description: `AI-generated quiz for ${data.subject} - ${data.topic}`,
          quizType: "ai_generated",
          difficultyLevel: data.difficultyLevel ?? "medium",
          gradeLevel: data.gradeLevel,
          questions: JSON.stringify(questions),
          isPublished: false,
          schoolId: session.user.schoolId,
          topicId: data.topicId,
        },
      });
      savedQuizId = quiz.id;
    }

    return successResponse({
      questions,
      savedQuizId,
      subject: data.subject,
      topic: data.topic,
      gradeLevel: data.gradeLevel,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return errorResponse(err.issues[0]?.message ?? "Validation failed");
    }
    console.error("Quiz generation error:", err);
    return errorResponse("Failed to generate quiz", 500);
  }
}
