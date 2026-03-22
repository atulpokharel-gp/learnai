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
import bcrypt from "bcryptjs";

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  role: z.enum([
    "SCHOOL_PRINCIPAL",
    "SCHOOL_ACCOUNTANT",
    "CLASS_SUPERVISOR",
    "TEACHER",
    "STUDENT",
    "SAAS_ADMIN",
  ]),
  schoolId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const schoolId = searchParams.get("schoolId");
  const role = searchParams.get("role");

  // Determine which school to filter by
  let filterSchoolId: string | null | undefined = schoolId;

  if (session.user.role !== Role.SAAS_ADMIN) {
    // Non-admins can only view users in their own school
    if (!session.user.schoolId) return forbiddenResponse();
    filterSchoolId = session.user.schoolId;
  }

  const allowedViewerRoles: Role[] = [
    Role.SAAS_ADMIN,
    Role.SCHOOL_PRINCIPAL,
    Role.CLASS_SUPERVISOR,
    Role.TEACHER,
  ];
  if (!allowedViewerRoles.includes(session.user.role as Role)) {
    return forbiddenResponse();
  }

  const users = await prisma.user.findMany({
    where: {
      ...(filterSchoolId ? { schoolId: filterSchoolId } : {}),
      ...(role ? { role: role as Role } : {}),
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true,
      school: { select: { id: true, name: true } },
      studentProfile: { select: { gradeLevel: true, onboardingComplete: true } },
      teacherProfile: { select: { specializations: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return successResponse(users);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  const allowedCreators: Role[] = [
    Role.SAAS_ADMIN,
    Role.SCHOOL_PRINCIPAL,
  ];
  if (!allowedCreators.includes(session.user.role as Role)) {
    return forbiddenResponse();
  }

  try {
    const body = await req.json();
    const data = createUserSchema.parse(body);

    // Determine the school
    let schoolId: string | null = null;
    if (data.role !== "SAAS_ADMIN") {
      schoolId =
        data.schoolId ??
        (session.user.role !== Role.SAAS_ADMIN
          ? session.user.schoolId
          : null);
      if (!schoolId) {
        return errorResponse("schoolId is required for non-admin users");
      }
    }

    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      return errorResponse("A user with this email already exists");
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role as Role,
        schoolId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Auto-create profile based on role
    if (data.role === "STUDENT") {
      await prisma.studentProfile.create({
        data: { userId: user.id },
      });
    } else if (data.role === "TEACHER") {
      await prisma.teacherProfile.create({
        data: { userId: user.id },
      });
    }

    return successResponse(user, 201);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return errorResponse(err.issues[0]?.message ?? "Validation failed");
    }
    return errorResponse("Failed to create user", 500);
  }
}
