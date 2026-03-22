import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import StatCard from "@/components/dashboard/StatCard";
import Link from "next/link";

export default async function PrincipalDashboard() {
  const session = await auth();
  if (
    !session?.user ||
    session.user.role !== Role.SCHOOL_PRINCIPAL ||
    !session.user.schoolId
  ) {
    redirect("/dashboard");
  }

  const schoolId = session.user.schoolId;

  const [school, teacherCount, studentCount, classCount, recentAttempts] =
    await Promise.all([
      prisma.school.findUnique({ where: { id: schoolId } }),
      prisma.user.count({ where: { schoolId, role: Role.TEACHER } }),
      prisma.user.count({ where: { schoolId, role: Role.STUDENT } }),
      prisma.class.count({ where: { schoolId } }),
      prisma.quizAttempt.findMany({
        where: { user: { schoolId } },
        orderBy: { attemptedAt: "desc" },
        take: 10,
        include: {
          user: { select: { firstName: true, lastName: true } },
          quiz: { select: { title: true } },
        },
      }),
    ]);

  const avgScore =
    recentAttempts.length > 0
      ? Math.round(
          recentAttempts.reduce((sum, a) => sum + a.score, 0) /
            recentAttempts.length
        )
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          🏫 {school?.name ?? "School"} — Principal Dashboard
        </h1>
        <p className="text-gray-500 mt-1">
          School overview and administration
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard emoji="👩‍🏫" label="Teachers" value={teacherCount} color="orange" />
        <StatCard emoji="🧒" label="Students" value={studentCount} color="pink" />
        <StatCard emoji="🏛️" label="Classes" value={classCount} color="blue" />
        <StatCard emoji="📊" label="Avg Quiz Score" value={`${avgScore}%`} color="green" />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/principal/staff/new"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            + Add Staff
          </Link>
          <Link
            href="/dashboard/principal/students/new"
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            + Add Student
          </Link>
          <Link
            href="/dashboard/principal/classes/new"
            className="bg-white text-gray-700 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:border-gray-300 transition-colors"
          >
            + Add Class
          </Link>
          <Link
            href="/dashboard/principal/reports"
            className="bg-white text-gray-700 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:border-gray-300 transition-colors"
          >
            📈 View Reports
          </Link>
        </div>
      </div>

      {/* Recent Quiz Activity */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">
          Recent Quiz Activity
        </h2>
        <div className="space-y-3">
          {recentAttempts.map((attempt) => (
            <div
              key={attempt.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <div className="font-medium text-gray-900 text-sm">
                  {attempt.user.firstName} {attempt.user.lastName}
                </div>
                <div className="text-xs text-gray-500">{attempt.quiz.title}</div>
              </div>
              <div className="text-right">
                <div
                  className={`text-sm font-bold ${
                    attempt.score >= 80
                      ? "text-green-600"
                      : attempt.score >= 60
                        ? "text-yellow-600"
                        : "text-red-600"
                  }`}
                >
                  {Math.round(attempt.score)}%
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(attempt.attemptedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
          {recentAttempts.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-4">
              No quiz activity yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
