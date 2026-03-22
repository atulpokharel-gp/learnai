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

const createSubjectSchema = z.object({
  name: z.string().min(1).max(100),
  code: z
    .string()
    .min(1)
    .max(20)
    .regex(/^[A-Z0-9_-]+$/),
  description: z.string().optional(),
  gradeLevel: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();
  if (!session.user.schoolId) return forbiddenResponse();

  const { searchParams } = new URL(req.url);
  const schoolId = searchParams.get("schoolId") ?? session.user.schoolId;

  if (
    session.user.role !== Role.SAAS_ADMIN &&
    session.user.schoolId !== schoolId
  ) {
    return forbiddenResponse();
  }

  const subjects = await prisma.subject.findMany({
    where: { schoolId, isActive: true },
    include: {
      _count: { select: { topics: true, curricula: true } },
    },
    orderBy: { name: "asc" },
  });

  return successResponse(subjects);
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
    const data = createSubjectSchema.parse(body);

    const subject = await prisma.subject.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        gradeLevel: data.gradeLevel,
        schoolId: session.user.schoolId,
      },
    });

    return successResponse(subject, 201);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return errorResponse(err.issues[0]?.message ?? "Validation failed");
    }
    return errorResponse("Failed to create subject", 500);
  }
}
