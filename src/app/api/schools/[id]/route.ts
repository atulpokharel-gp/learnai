import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
} from "@/lib/api-response";
import { Role } from "@/generated/prisma/client";
import { z } from "zod";

const updateSchoolSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  logoUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
  subscriptionPlan: z.enum(["free", "basic", "premium"]).optional(),
  subscriptionStatus: z.enum(["active", "inactive", "suspended"]).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  const { id } = await params;

  if (
    session.user.role !== Role.SAAS_ADMIN &&
    session.user.schoolId !== id
  ) {
    return forbiddenResponse();
  }

  const school = await prisma.school.findUnique({
    where: { id },
    include: {
      _count: { select: { users: true, classes: true, subjects: true } },
    },
  });

  if (!school) return notFoundResponse("School");
  return successResponse(school);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  const { id } = await params;

  const canEdit =
    session.user.role === Role.SAAS_ADMIN ||
    (session.user.schoolId === id &&
      session.user.role === Role.SCHOOL_PRINCIPAL);

  if (!canEdit) return forbiddenResponse();

  try {
    const body = await req.json();
    const data = updateSchoolSchema.parse(body);

    const school = await prisma.school.update({
      where: { id },
      data,
    });

    return successResponse(school);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return errorResponse(err.issues[0]?.message ?? "Validation failed");
    }
    return errorResponse("Failed to update school", 500);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();
  if (session.user.role !== Role.SAAS_ADMIN) return forbiddenResponse();

  const { id } = await params;

  await prisma.school.update({
    where: { id },
    data: { isActive: false },
  });

  return successResponse({ message: "School deactivated" });
}
