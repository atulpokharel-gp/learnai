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

const createClassSchema = z.object({
  name: z.string().min(1).max(100),
  gradeLevel: z.string().min(1),
  academicYear: z.string().min(4),
  supervisorId: z.string().optional(),
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

  const classes = await prisma.class.findMany({
    where: { schoolId },
    include: {
      supervisor: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { students: true, teachers: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return successResponse(classes);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  const allowedRoles: Role[] = [
    Role.SAAS_ADMIN,
    Role.SCHOOL_PRINCIPAL,
    Role.CLASS_SUPERVISOR,
  ];
  if (!allowedRoles.includes(session.user.role as Role)) {
    return forbiddenResponse();
  }

  if (!session.user.schoolId) return forbiddenResponse();

  try {
    const body = await req.json();
    const data = createClassSchema.parse(body);

    const cls = await prisma.class.create({
      data: {
        name: data.name,
        gradeLevel: data.gradeLevel,
        academicYear: data.academicYear,
        schoolId: session.user.schoolId,
        supervisorId: data.supervisorId,
      },
    });

    return successResponse(cls, 201);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return errorResponse(err.issues[0]?.message ?? "Validation failed");
    }
    return errorResponse("Failed to create class", 500);
  }
}
