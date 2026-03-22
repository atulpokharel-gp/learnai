import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@/generated/prisma/client";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as Role;

  switch (role) {
    case Role.SAAS_ADMIN:
      redirect("/dashboard/saas-admin");
    case Role.SCHOOL_PRINCIPAL:
      redirect("/dashboard/principal");
    case Role.SCHOOL_ACCOUNTANT:
      redirect("/dashboard/accountant");
    case Role.CLASS_SUPERVISOR:
      redirect("/dashboard/supervisor");
    case Role.TEACHER:
      redirect("/dashboard/teacher");
    case Role.STUDENT:
      redirect("/dashboard/student");
    default:
      redirect("/login");
  }
}
