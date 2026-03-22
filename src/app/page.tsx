import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🎓</span>
            <span className="text-2xl font-bold text-indigo-700">LearnAI</span>
          </div>
          <Link
            href="/login"
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
          <span>✨</span>
          <span>Powered by AI — Built for Schools</span>
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight">
          The AI School Platform
          <br />
          <span className="text-indigo-600">Every Child Deserves</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
          LearnAI gives every student a personalized AI teacher, adaptive
          lessons, and a learning journey tailored just for them — all within
          your school&apos;s curriculum.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="bg-indigo-600 text-white px-8 py-3 rounded-xl text-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Get Started →
          </Link>
          <Link
            href="#features"
            className="bg-white text-indigo-600 px-8 py-3 rounded-xl text-lg font-semibold border border-indigo-200 hover:border-indigo-400 transition-colors"
          >
            See Features
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Everything your school needs
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              emoji: "🤖",
              title: "Personalized AI Teacher",
              desc: "Each student gets their own AI tutor that adapts to their learning pace, strengths, and style.",
            },
            {
              emoji: "🏫",
              title: "Multi-School SaaS",
              desc: "Manage multiple schools from one platform with complete tenant isolation and role-based access.",
            },
            {
              emoji: "📚",
              title: "Curriculum-Aligned Lessons",
              desc: "AI generates lessons that follow your school's syllabus and curriculum requirements.",
            },
            {
              emoji: "📊",
              title: "Progress Analytics",
              desc: "Teachers and principals get real-time insights into student mastery and class performance.",
            },
            {
              emoji: "🎯",
              title: "Adaptive Learning Journey",
              desc: "The system updates each student's path after every quiz and lesson automatically.",
            },
            {
              emoji: "🔒",
              title: "Safe for Kids",
              desc: "Age-appropriate content, no invasive monitoring, and full teacher control over the experience.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="text-4xl mb-4">{feature.emoji}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Role Cards */}
      <section className="bg-white border-t border-gray-100 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Built for every role
          </h2>
          <p className="text-center text-gray-600 mb-12">
            From SaaS administrators to students, everyone has the right tools
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { emoji: "👑", role: "SaaS Admin", color: "bg-purple-100 text-purple-700" },
              { emoji: "🏫", role: "Principal", color: "bg-blue-100 text-blue-700" },
              { emoji: "💰", role: "Accountant", color: "bg-green-100 text-green-700" },
              { emoji: "🎓", role: "Supervisor", color: "bg-yellow-100 text-yellow-700" },
              { emoji: "👩‍🏫", role: "Teacher", color: "bg-orange-100 text-orange-700" },
              { emoji: "🧒", role: "Student", color: "bg-pink-100 text-pink-700" },
            ].map((r) => (
              <div
                key={r.role}
                className={`${r.color} rounded-xl p-4 text-center font-medium`}
              >
                <div className="text-3xl mb-2">{r.emoji}</div>
                <div className="text-sm">{r.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 text-center">
        <p>© 2024 LearnAI Platform. Built on OpenMAIC architecture.</p>
      </footer>
    </main>
  );
}
