import { Role } from "@/generated/prisma/client";

declare module "next-auth" {
  interface User {
    role: Role;
    schoolId: string | null;
    schoolSlug: string | null;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
      schoolId: string | null;
      schoolSlug: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    schoolId: string | null;
    schoolSlug: string | null;
  }
}
