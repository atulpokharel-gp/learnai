import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export default async function StudentProgressPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.STUDENT) {
    redirect("/dashboard");
  }

  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      topicMasteries: {
        include: {
          topic: {
            include: {
              subject: { select: { name: true } },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      },
      learningPlan: {
        include: {
          items: {
            include: {
              topic: {
                include: { subject: { select: { name: true } } },
              },
            },
            orderBy: { sequenceOrder: "asc" },
          },
        },
      },
    },
  });

  if (!studentProfile?.onboardingComplete) {
    redirect("/dashboard/student/onboarding");
  }

  const quizAttempts = await prisma.quizAttempt.findMany({
    where: { userId: session.user.id },
    orderBy: { attemptedAt: "desc" },
    take: 20,
    include: {
      quiz: { select: { title: true, topicId: true } },
    },
  });

  const avgScore =
    quizAttempts.length > 0
      ? Math.round(
          quizAttempts.reduce((sum, a) => sum + a.score, 0) / quizAttempts.length
        )
      : 0;

  const masteredTopics = studentProfile.topicMasteries.filter(
    (m) => m.masteryLevel >= 0.8
  );
  const inProgressTopics = studentProfile.topicMasteries.filter(
    (m) => m.masteryLevel >= 0.3 && m.masteryLevel < 0.8
  );

  const planItems = studentProfile.learningPlan?.items ?? [];
  const completedItems = planItems.filter((i) => i.status === "completed");
  const progress =
    planItems.length > 0
      ? Math.round((completedItems.length / planItems.length) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">⭐ My Progress</h1>
        <p className="text-gray-500 mt-1">
          See how much you&apos;ve learned!
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-4 text-center">
          <div className="text-3xl font-bold text-indigo-600">{avgScore}%</div>
          <div className="text-xs text-indigo-700 mt-1">Avg Quiz Score</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-4 text-center">
          <div className="text-3xl font-bold text-green-600">
            {masteredTopics.length}
          </div>
          <div className="text-xs text-green-700 mt-1">Topics Mastered</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-100 rounded-2xl p-4 text-center">
          <div className="text-3xl font-bold text-orange-600">
            {quizAttempts.length}
          </div>
          <div className="text-xs text-orange-700 mt-1">Quizzes Taken</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-2xl p-4 text-center">
          <div className="text-3xl font-bold text-purple-600">{progress}%</div>
          <div className="text-xs text-purple-700 mt-1">Plan Complete</div>
        </div>
      </div>

      {/* Learning Plan Progress */}
      {planItems.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">
            📚 Learning Plan Progress
          </h2>
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1.5">
              <span>Overall progress</span>
              <span>
                {completedItems.length}/{planItems.length} topics
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            {planItems.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  item.status === "completed"
                    ? "bg-green-50"
                    : item.status === "in_progress"
                      ? "bg-indigo-50"
                      : "bg-gray-50"
                }`}
              >
                <div className="text-lg">
                  {item.status === "completed"
                    ? "✅"
                    : item.status === "in_progress"
                      ? "📖"
                      : "⏳"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {item.topic?.title}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.topic?.subject?.name}
                  </div>
                </div>
                <div
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    item.status === "completed"
                      ? "bg-green-200 text-green-800"
                      : item.status === "in_progress"
                        ? "bg-indigo-200 text-indigo-800"
                        : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {item.status === "completed"
                    ? "Done!"
                    : item.status === "in_progress"
                      ? "Current"
                      : "Upcoming"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Topic Masteries */}
      {studentProfile.topicMasteries.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">
            🧠 Topic Mastery
          </h2>
          <div className="space-y-3">
            {studentProfile.topicMasteries.map((mastery) => (
              <div key={mastery.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-800">
                    {mastery.topic.title}
                  </span>
                  <span className="text-gray-500">
                    {Math.round(mastery.masteryLevel * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      mastery.masteryLevel >= 0.8
                        ? "bg-green-500"
                        : mastery.masteryLevel >= 0.5
                          ? "bg-yellow-500"
                          : "bg-red-400"
                    }`}
                    style={{
                      width: `${Math.round(mastery.masteryLevel * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quiz History */}
      {quizAttempts.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">📊 Quiz History</h2>
          <div className="space-y-2">
            {quizAttempts.map((attempt) => (
              <div
                key={attempt.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <div className="text-sm font-medium text-gray-800">
                    {attempt.quiz.title}
                  </div>
                  <div className="text-xs text-gray-500">
                    {attempt.correctAnswers}/{attempt.totalQuestions} correct ·{" "}
                    {new Date(attempt.attemptedAt).toLocaleDateString()}
                  </div>
                </div>
                <div
                  className={`text-lg font-bold ${
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
          </div>
        </div>
      )}

      {/* Empty state */}
      {quizAttempts.length === 0 &&
        studentProfile.topicMasteries.length === 0 && (
          <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Your journey starts now!
            </h3>
            <p className="text-gray-500">
              Start a lesson or take a quiz to begin tracking your progress.
            </p>
          </div>
        )}
    </div>
  );
}
