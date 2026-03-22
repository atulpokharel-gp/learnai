import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function StudentDashboard() {
  const session = await auth();
  if (
    !session?.user ||
    session.user.role !== Role.STUDENT
  ) {
    redirect("/dashboard");
  }

  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      class: { select: { name: true, gradeLevel: true } },
      learningPlan: {
        include: {
          items: {
            where: { status: { in: ["pending", "in_progress"] } },
            include: {
              topic: {
                include: { subject: { select: { name: true } } },
              },
            },
            orderBy: { sequenceOrder: "asc" },
            take: 3,
          },
        },
      },
    },
  });

  if (!studentProfile?.onboardingComplete) {
    redirect("/dashboard/student/onboarding");
  }

  const recentAttempts = await prisma.quizAttempt.findMany({
    where: { userId: session.user.id },
    orderBy: { attemptedAt: "desc" },
    take: 5,
    include: { quiz: { select: { title: true } } },
  });

  const masteredTopics = await prisma.topicMastery.count({
    where: {
      studentProfileId: studentProfile.id,
      masteryLevel: { gte: 0.8 },
    },
  });

  const avgScore =
    recentAttempts.length > 0
      ? Math.round(
          recentAttempts.reduce((sum, a) => sum + a.score, 0) /
            recentAttempts.length
        )
      : 0;

  const firstName = session.user.name?.split(" ")[0] ?? "there";

  const nextItems = studentProfile.learningPlan?.items ?? [];
  const currentItem = nextItems.find((i) => i.status === "in_progress");

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-1">
          Hello, {firstName}! 👋
        </h1>
        <p className="text-white/80">
          Ready to learn something amazing today?
        </p>
        {studentProfile.class && (
          <div className="mt-3 inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-sm">
            <span>🏛️</span>
            <span>
              {studentProfile.class.name} · Grade {studentProfile.class.gradeLevel}
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <div className="text-2xl font-bold text-green-600">{avgScore}%</div>
          <div className="text-xs text-gray-500 mt-1">Avg Score</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <div className="text-2xl font-bold text-indigo-600">{masteredTopics}</div>
          <div className="text-xs text-gray-500 mt-1">Mastered</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <div className="text-2xl font-bold text-orange-600">{recentAttempts.length}</div>
          <div className="text-xs text-gray-500 mt-1">Quizzes Done</div>
        </div>
      </div>

      {/* Current Topic */}
      {currentItem && (
        <div className="bg-white rounded-2xl p-6 border border-indigo-100 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-3">📖 Currently Learning</h2>
          <div className="bg-indigo-50 rounded-xl p-4">
            <div className="text-sm text-indigo-600 font-medium">
              {currentItem.topic?.subject?.name}
            </div>
            <div className="text-lg font-bold text-gray-900 mt-1">
              {currentItem.topic?.title}
            </div>
            {currentItem.topic?.description && (
              <div className="text-sm text-gray-600 mt-1">
                {currentItem.topic.description}
              </div>
            )}
            <div className="mt-4 flex gap-3">
              <Link
                href={`/dashboard/student/lesson?topicId=${currentItem.topicId}&topic=${encodeURIComponent(currentItem.topic?.title ?? "")}&subject=${encodeURIComponent(currentItem.topic?.subject?.name ?? "")}&grade=${studentProfile.gradeLevel ?? "5"}`}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                🚀 Start Lesson
              </Link>
              <Link
                href={`/dashboard/student/quiz?topic=${encodeURIComponent(currentItem.topic?.title ?? "")}&subject=${encodeURIComponent(currentItem.topic?.subject?.name ?? "")}&grade=${studentProfile.gradeLevel ?? "5"}`}
                className="bg-white text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium border border-indigo-200 hover:border-indigo-400 transition-colors"
              >
                ✅ Take Quiz
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Action Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/dashboard/student/lesson"
          className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-center group"
        >
          <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📖</div>
          <div className="font-semibold text-gray-900">My Lessons</div>
          <div className="text-sm text-gray-500 mt-1">
            Start an AI-powered lesson
          </div>
        </Link>
        <Link
          href="/dashboard/student/quiz"
          className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-center group"
        >
          <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">✅</div>
          <div className="font-semibold text-gray-900">Quiz Time</div>
          <div className="text-sm text-gray-500 mt-1">
            Practice with AI quizzes
          </div>
        </Link>
        <Link
          href="/dashboard/student/progress"
          className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-center group"
        >
          <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">⭐</div>
          <div className="font-semibold text-gray-900">My Progress</div>
          <div className="text-sm text-gray-500 mt-1">
            See how you&apos;re doing
          </div>
        </Link>
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-5 border border-yellow-100 shadow-sm text-center">
          <div className="text-4xl mb-3">🌟</div>
          <div className="font-semibold text-gray-900">{masteredTopics} Topics</div>
          <div className="text-sm text-gray-500 mt-1">Mastered so far!</div>
        </div>
      </div>

      {/* Recent Quiz Results */}
      {recentAttempts.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">
            📊 Recent Quiz Results
          </h2>
          <div className="space-y-2">
            {recentAttempts.map((attempt) => (
              <div
                key={attempt.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="text-sm text-gray-700">{attempt.quiz.title}</div>
                <div className="flex items-center gap-2">
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
                  <div className="text-lg">
                    {attempt.score >= 80 ? "🌟" : attempt.score >= 60 ? "👍" : "💪"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
