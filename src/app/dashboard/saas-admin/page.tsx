import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import StatCard from "@/components/dashboard/StatCard";
import Link from "next/link";

export default async function SaaSAdminDashboard() {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.SAAS_ADMIN) {
    redirect("/dashboard");
  }

  const [schoolCount, userCount, studentCount, recentSchools] =
    await Promise.all([
      prisma.school.count({ where: { isActive: true } }),
      prisma.user.count(),
      prisma.user.count({ where: { role: Role.STUDENT } }),
      prisma.school.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { users: true } } },
      }),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          👑 SaaS Admin Dashboard
        </h1>
        <p className="text-gray-500 mt-1">
          Platform overview and school management
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          emoji="🏫"
          label="Active Schools"
          value={schoolCount}
          color="purple"
        />
        <StatCard
          emoji="👥"
          label="Total Users"
          value={userCount}
          color="blue"
        />
        <StatCard
          emoji="🧒"
          label="Students"
          value={studentCount}
          color="pink"
        />
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/saas-admin/schools/new"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            + Add School
          </Link>
          <Link
            href="/dashboard/saas-admin/users"
            className="bg-white text-gray-700 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:border-gray-300 transition-colors"
          >
            Manage Users
          </Link>
        </div>
      </div>

      {/* Recent Schools */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Recent Schools</h2>
          <Link
            href="/dashboard/saas-admin/schools"
            className="text-indigo-600 text-sm hover:underline"
          >
            View all →
          </Link>
        </div>
        <div className="space-y-3">
          {recentSchools.map((school) => (
            <div
              key={school.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <div className="font-medium text-gray-900">{school.name}</div>
                <div className="text-sm text-gray-500">
                  {school.slug} · {school.subscriptionPlan} plan
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {school._count.users} users
                </div>
                <div
                  className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                    school.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {school.isActive ? "Active" : "Inactive"}
                </div>
              </div>
            </div>
          ))}
          {recentSchools.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-4">
              No schools yet. Add your first school!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
