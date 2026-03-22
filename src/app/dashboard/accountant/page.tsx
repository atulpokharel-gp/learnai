import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import StatCard from "@/components/dashboard/StatCard";

export default async function AccountantDashboard() {
  const session = await auth();
  if (
    !session?.user ||
    session.user.role !== Role.SCHOOL_ACCOUNTANT ||
    !session.user.schoolId
  ) {
    redirect("/dashboard");
  }

  const schoolId = session.user.schoolId;

  const [school, studentCount, staffCount] = await Promise.all([
    prisma.school.findUnique({ where: { id: schoolId } }),
    prisma.user.count({ where: { schoolId, role: Role.STUDENT } }),
    prisma.user.count({
      where: {
        schoolId,
        role: {
          in: [
            Role.TEACHER,
            Role.CLASS_SUPERVISOR,
            Role.SCHOOL_PRINCIPAL,
          ],
        },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          💰 Accountant Dashboard
        </h1>
        <p className="text-gray-500 mt-1">
          {school?.name} — Financial overview
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard emoji="🧒" label="Students" value={studentCount} color="blue" />
        <StatCard emoji="👥" label="Staff Members" value={staffCount} color="green" />
        <StatCard
          emoji="📋"
          label="Plan"
          value={school?.subscriptionPlan ?? "free"}
          color="orange"
          subtitle={`Status: ${school?.subscriptionStatus}`}
        />
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">School Information</h2>
        <div className="space-y-3">
          {[
            { label: "School Name", value: school?.name },
            { label: "Contact Email", value: school?.contactEmail },
            { label: "Phone", value: school?.contactPhone ?? "Not set" },
            { label: "Address", value: school?.address ?? "Not set" },
            { label: "Subscription Plan", value: school?.subscriptionPlan },
            { label: "Status", value: school?.subscriptionStatus },
          ].map((item) => (
            <div
              key={item.label}
              className="flex justify-between p-3 bg-gray-50 rounded-lg"
            >
              <span className="text-sm text-gray-500">{item.label}</span>
              <span className="text-sm font-medium text-gray-900 capitalize">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
