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

const createSchoolSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  subscriptionPlan: z.enum(["free", "basic", "premium"]).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  if (session.user.role !== Role.SAAS_ADMIN) {
    // Non-admins only see their own school
    if (!session.user.schoolId) return forbiddenResponse();
    const school = await prisma.school.findUnique({
      where: { id: session.user.schoolId },
    });
    return successResponse(school ? [school] : []);
  }

  const schools = await prisma.school.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { users: true, classes: true } },
    },
  });
  return successResponse(schools);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();
  if (session.user.role !== Role.SAAS_ADMIN) return forbiddenResponse();

  try {
    const body = await req.json();
    const data = createSchoolSchema.parse(body);

    const existing = await prisma.school.findUnique({
      where: { slug: data.slug },
    });
    if (existing) {
      return errorResponse("A school with this slug already exists");
    }

    const school = await prisma.school.create({
      data: {
        name: data.name,
        slug: data.slug,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        address: data.address,
        subscriptionPlan: data.subscriptionPlan ?? "free",
      },
    });

    return successResponse(school, 201);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return errorResponse(err.issues[0]?.message ?? "Validation failed");
    }
    return errorResponse("Failed to create school", 500);
  }
}
