import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import StatCard from "@/components/dashboard/StatCard";
import Link from "next/link";

export default async function SupervisorDashboard() {
  const session = await auth();
  if (
    !session?.user ||
    session.user.role !== Role.CLASS_SUPERVISOR ||
    !session.user.schoolId
  ) {
    redirect("/dashboard");
  }

  const schoolId = session.user.schoolId;

  const [supervisedClasses, curriculumCount, topicCount] = await Promise.all([
    prisma.class.findMany({
      where: { supervisorId: session.user.id },
      include: { _count: { select: { students: true, teachers: true } } },
    }),
    prisma.curriculum.count({ where: { schoolId } }),
    prisma.topic.count({ where: { schoolId } }),
  ]);

  const totalStudents = supervisedClasses.reduce(
    (sum, c) => sum + c._count.students,
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          🎓 Supervisor Dashboard
        </h1>
        <p className="text-gray-500 mt-1">Class oversight and curriculum management</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard emoji="🏛️" label="My Classes" value={supervisedClasses.length} color="blue" />
        <StatCard emoji="🧒" label="Students" value={totalStudents} color="pink" />
        <StatCard emoji="📚" label="Curricula" value={curriculumCount} color="orange" />
        <StatCard emoji="📝" label="Topics" value={topicCount} color="green" />
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/supervisor/curriculum"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            📚 Manage Curriculum
          </Link>
          <Link
            href="/dashboard/supervisor/progress"
            className="bg-white text-gray-700 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:border-gray-300 transition-colors"
          >
            📈 View Progress
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">My Supervised Classes</h2>
        {supervisedClasses.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No classes assigned yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {supervisedClasses.map((cls) => (
              <div key={cls.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="font-medium text-gray-900">{cls.name}</div>
                <div className="text-sm text-gray-500">
                  Grade {cls.gradeLevel} · {cls._count.students} students · {cls._count.teachers} teachers
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
