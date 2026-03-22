import { Role } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";

export { Role };

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  SAAS_ADMIN: ["*"],
  SCHOOL_PRINCIPAL: [
    "school:read",
    "school:write",
    "users:read",
    "users:write",
    "classes:read",
    "classes:write",
    "subjects:read",
    "subjects:write",
    "curriculum:read",
    "curriculum:write",
    "progress:read",
    "reports:read",
  ],
  SCHOOL_ACCOUNTANT: ["school:read", "users:read", "reports:read"],
  CLASS_SUPERVISOR: [
    "school:read",
    "classes:read",
    "classes:write",
    "subjects:read",
    "curriculum:read",
    "curriculum:write",
    "progress:read",
    "reports:read",
    "users:read",
  ],
  TEACHER: [
    "classes:read",
    "subjects:read",
    "curriculum:read",
    "curriculum:write",
    "topics:read",
    "topics:write",
    "quizzes:read",
    "quizzes:write",
    "progress:read",
    "ai:generate",
  ],
  STUDENT: [
    "lessons:read",
    "quizzes:read",
    "quizzes:attempt",
    "progress:own",
    "ai:interact",
  ],
};

export function hasPermission(role: Role, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role];
  return perms.includes("*") || perms.includes(permission);
}

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireRole(...roles: Role[]) {
  const user = await requireAuth();
  if (!roles.includes(user.role as Role)) {
    throw new Error("Forbidden");
  }
  return user;
}
