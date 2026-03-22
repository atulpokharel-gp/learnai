import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import StatCard from "@/components/dashboard/StatCard";
import Link from "next/link";

export default async function TeacherDashboard() {
  const session = await auth();
  if (
    !session?.user ||
    session.user.role !== Role.TEACHER ||
    !session.user.schoolId
  ) {
    redirect("/dashboard");
  }

  const schoolId = session.user.schoolId;
  const teacherId = session.user.id;

  const [myClasses, subjectCount, topicCount, recentAttempts] =
    await Promise.all([
      prisma.classTeacher.findMany({
        where: { teacherId },
        include: {
          class: {
            include: { _count: { select: { students: true } } },
          },
        },
      }),
      prisma.subject.count({ where: { schoolId } }),
      prisma.topic.count({ where: { schoolId } }),
      prisma.quizAttempt.findMany({
        where: {
          user: { schoolId },
        },
        orderBy: { attemptedAt: "desc" },
        take: 8,
        include: {
          user: { select: { firstName: true, lastName: true } },
          quiz: { select: { title: true } },
        },
      }),
    ]);

  const totalStudents = myClasses.reduce(
    (sum, ct) => sum + ct.class._count.students,
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          👩‍🏫 Teacher Dashboard
        </h1>
        <p className="text-gray-500 mt-1">
          Welcome back, {session.user.name?.split(" ")[0]}!
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard emoji="🏛️" label="My Classes" value={myClasses.length} color="blue" />
        <StatCard emoji="🧒" label="My Students" value={totalStudents} color="pink" />
        <StatCard emoji="📚" label="Subjects" value={subjectCount} color="orange" />
        <StatCard emoji="📝" label="Topics" value={topicCount} color="green" />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/teacher/ai-studio"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            🤖 Generate AI Lesson
          </Link>
          <Link
            href="/dashboard/teacher/topics/new"
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            + Add Topic
          </Link>
          <Link
            href="/dashboard/teacher/quizzes/generate"
            className="bg-white text-gray-700 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:border-gray-300 transition-colors"
          >
            ✅ Generate Quiz
          </Link>
          <Link
            href="/dashboard/teacher/students"
            className="bg-white text-gray-700 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:border-gray-300 transition-colors"
          >
            📈 Student Progress
          </Link>
        </div>
      </div>

      {/* My Classes */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">My Classes</h2>
          <Link
            href="/dashboard/teacher/classes"
            className="text-indigo-600 text-sm hover:underline"
          >
            View all →
          </Link>
        </div>
        {myClasses.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">
              You haven&apos;t been assigned to any classes yet.
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Contact your principal to be added to a class.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {myClasses.map((ct) => (
              <div
                key={ct.id}
                className="p-4 bg-gray-50 rounded-xl border border-gray-100"
              >
                <div className="font-medium text-gray-900">{ct.class.name}</div>
                <div className="text-sm text-gray-500">
                  Grade {ct.class.gradeLevel} · {ct.class._count.students} students
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {ct.class.academicYear}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">
          Recent Student Activity
        </h2>
        <div className="space-y-2">
          {recentAttempts.map((attempt) => (
            <div
              key={attempt.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <span className="font-medium text-gray-800 text-sm">
                  {attempt.user.firstName} {attempt.user.lastName}
                </span>
                <span className="text-gray-400 text-sm"> · </span>
                <span className="text-gray-500 text-sm">
                  {attempt.quiz.title}
                </span>
              </div>
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
