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
import { z } from "zod";

const submitQuizSchema = z.object({
  quizId: z.string(),
  answers: z.array(z.number()),
  timeTaken: z.number().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();
  if (session.user.role !== Role.STUDENT) return forbiddenResponse();

  try {
    const body = await req.json();
    const data = submitQuizSchema.parse(body);

    const quiz = await prisma.quiz.findUnique({
      where: { id: data.quizId },
    });

    if (!quiz) {
      return errorResponse("Quiz not found", 404);
    }

    const questions = JSON.parse(quiz.questions) as Array<{
      correctAnswer: number;
      explanation: string;
    }>;

    let correctAnswers = 0;
    const feedbackItems: Array<{
      questionIndex: number;
      isCorrect: boolean;
      explanation: string;
    }> = [];

    for (let i = 0; i < Math.min(data.answers.length, questions.length); i++) {
      const isCorrect = data.answers[i] === questions[i].correctAnswer;
      if (isCorrect) correctAnswers++;
      feedbackItems.push({
        questionIndex: i,
        isCorrect,
        explanation: questions[i].explanation,
      });
    }

    const score = (correctAnswers / questions.length) * 100;

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId: data.quizId,
        userId: session.user.id,
        score,
        totalQuestions: questions.length,
        correctAnswers,
        timeTaken: data.timeTaken,
        answers: JSON.stringify(data.answers),
        feedback: JSON.stringify(feedbackItems),
      },
    });

    // Update topic mastery if quiz is linked to a topic
    if (quiz.topicId) {
      const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (studentProfile) {
        const existingMastery = await prisma.topicMastery.findUnique({
          where: {
            studentProfileId_topicId: {
              studentProfileId: studentProfile.id,
              topicId: quiz.topicId,
            },
          },
        });

        const newMasteryLevel = score / 100;

        if (existingMastery) {
          // Weighted average: 70% new score, 30% existing mastery
          const updatedLevel =
            newMasteryLevel * 0.7 + existingMastery.masteryLevel * 0.3;
          await prisma.topicMastery.update({
            where: { id: existingMastery.id },
            data: {
              masteryLevel: updatedLevel,
              attemptCount: { increment: 1 },
              lastAttemptedAt: new Date(),
            },
          });
        } else {
          await prisma.topicMastery.create({
            data: {
              studentProfileId: studentProfile.id,
              topicId: quiz.topicId,
              masteryLevel: newMasteryLevel,
              attemptCount: 1,
              lastAttemptedAt: new Date(),
            },
          });
        }

        // Update learning plan item if applicable
        const learningPlan = await prisma.studentLearningPlan.findUnique({
          where: { studentProfileId: studentProfile.id },
        });

        if (learningPlan) {
          const planItem = await prisma.learningPlanItem.findFirst({
            where: {
              learningPlanId: learningPlan.id,
              topicId: quiz.topicId,
              status: { in: ["pending", "in_progress"] },
            },
          });

          if (planItem && newMasteryLevel >= 0.7) {
            await prisma.learningPlanItem.update({
              where: { id: planItem.id },
              data: {
                status: "completed",
                completedAt: new Date(),
              },
            });

            // Activate next item
            const nextItem = await prisma.learningPlanItem.findFirst({
              where: {
                learningPlanId: learningPlan.id,
                status: "pending",
                sequenceOrder: { gt: planItem.sequenceOrder },
              },
              orderBy: { sequenceOrder: "asc" },
            });

            if (nextItem) {
              await prisma.learningPlanItem.update({
                where: { id: nextItem.id },
                data: { status: "in_progress" },
              });
            }
          }
        }
      }
    }

    return successResponse({
      attemptId: attempt.id,
      score,
      correctAnswers,
      totalQuestions: questions.length,
      feedback: feedbackItems,
      passed: score >= 70,
      message:
        score >= 80
          ? "🌟 Excellent work! You've mastered this topic!"
          : score >= 70
            ? "✅ Great job! You passed!"
            : score >= 50
              ? "📚 Keep practicing! You're getting there!"
              : "💪 Don't give up! Review the lesson and try again!",
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return errorResponse(err.issues[0]?.message ?? "Validation failed");
    }
    console.error("Quiz submission error:", err);
    return errorResponse("Failed to submit quiz", 500);
  }
}
