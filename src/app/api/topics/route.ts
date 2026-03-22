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

const createTopicSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  sequenceOrder: z.number().int().min(1),
  difficultyLevel: z.enum(["easy", "medium", "hard"]).optional(),
  learningObjectives: z.string().optional(),
  keywords: z.string().optional(),
  subjectId: z.string().optional(),
  syllabusUnitId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();
  if (!session.user.schoolId) return forbiddenResponse();

  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get("subjectId");
  const syllabusUnitId = searchParams.get("syllabusUnitId");

  const topics = await prisma.topic.findMany({
    where: {
      schoolId: session.user.schoolId,
      isActive: true,
      ...(subjectId ? { subjectId } : {}),
      ...(syllabusUnitId ? { syllabusUnitId } : {}),
    },
    include: {
      subject: { select: { id: true, name: true } },
      syllabusUnit: { select: { id: true, title: true } },
    },
    orderBy: { sequenceOrder: "asc" },
  });

  return successResponse(topics);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  const allowedRoles: Role[] = [
    Role.SAAS_ADMIN,
    Role.SCHOOL_PRINCIPAL,
    Role.CLASS_SUPERVISOR,
    Role.TEACHER,
  ];
  if (!allowedRoles.includes(session.user.role as Role)) {
    return forbiddenResponse();
  }

  if (!session.user.schoolId) return forbiddenResponse();

  try {
    const body = await req.json();
    const data = createTopicSchema.parse(body);

    const topic = await prisma.topic.create({
      data: {
        title: data.title,
        description: data.description,
        sequenceOrder: data.sequenceOrder,
        difficultyLevel: data.difficultyLevel ?? "medium",
        learningObjectives: data.learningObjectives,
        keywords: data.keywords,
        subjectId: data.subjectId,
        syllabusUnitId: data.syllabusUnitId,
        schoolId: session.user.schoolId,
      },
    });

    return successResponse(topic, 201);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return errorResponse(err.issues[0]?.message ?? "Validation failed");
    }
    return errorResponse("Failed to create topic", 500);
  }
}
