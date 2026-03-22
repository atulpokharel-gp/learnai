"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Role } from "@/generated/prisma/client";

interface NavUser {
  name?: string | null;
  email?: string | null;
  role: Role;
}

interface DashboardNavProps {
  user: NavUser;
}

const NAV_ITEMS: Record<
  Role,
  Array<{ href: string; label: string; emoji: string }>
> = {
  SAAS_ADMIN: [
    { href: "/dashboard/saas-admin", label: "Overview", emoji: "📊" },
    { href: "/dashboard/saas-admin/schools", label: "Schools", emoji: "🏫" },
    { href: "/dashboard/saas-admin/users", label: "Users", emoji: "👥" },
  ],
  SCHOOL_PRINCIPAL: [
    { href: "/dashboard/principal", label: "Overview", emoji: "📊" },
    { href: "/dashboard/principal/staff", label: "Staff", emoji: "👩‍🏫" },
    { href: "/dashboard/principal/students", label: "Students", emoji: "🧒" },
    { href: "/dashboard/principal/classes", label: "Classes", emoji: "🏛️" },
    { href: "/dashboard/principal/reports", label: "Reports", emoji: "📈" },
  ],
  SCHOOL_ACCOUNTANT: [
    { href: "/dashboard/accountant", label: "Overview", emoji: "📊" },
    { href: "/dashboard/accountant/finance", label: "Finance", emoji: "💰" },
  ],
  CLASS_SUPERVISOR: [
    { href: "/dashboard/supervisor", label: "Overview", emoji: "📊" },
    { href: "/dashboard/supervisor/classes", label: "My Classes", emoji: "🏛️" },
    { href: "/dashboard/supervisor/curriculum", label: "Curriculum", emoji: "📚" },
    { href: "/dashboard/supervisor/progress", label: "Progress", emoji: "📈" },
  ],
  TEACHER: [
    { href: "/dashboard/teacher", label: "Overview", emoji: "📊" },
    { href: "/dashboard/teacher/classes", label: "My Classes", emoji: "🏛️" },
    { href: "/dashboard/teacher/curriculum", label: "Curriculum", emoji: "📚" },
    { href: "/dashboard/teacher/topics", label: "Topics", emoji: "📝" },
    { href: "/dashboard/teacher/quizzes", label: "Quizzes", emoji: "✅" },
    { href: "/dashboard/teacher/students", label: "Students", emoji: "🧒" },
    { href: "/dashboard/teacher/ai-studio", label: "AI Studio", emoji: "🤖" },
  ],
  STUDENT: [
    { href: "/dashboard/student", label: "Home", emoji: "🏠" },
    { href: "/dashboard/student/lesson", label: "My Lesson", emoji: "📖" },
    { href: "/dashboard/student/quiz", label: "Quiz", emoji: "✅" },
    { href: "/dashboard/student/progress", label: "My Progress", emoji: "⭐" },
  ],
};

const ROLE_COLORS: Record<Role, string> = {
  SAAS_ADMIN: "bg-purple-600",
  SCHOOL_PRINCIPAL: "bg-blue-600",
  SCHOOL_ACCOUNTANT: "bg-green-600",
  CLASS_SUPERVISOR: "bg-yellow-600",
  TEACHER: "bg-orange-600",
  STUDENT: "bg-pink-500",
};

const ROLE_LABELS: Record<Role, string> = {
  SAAS_ADMIN: "SaaS Admin",
  SCHOOL_PRINCIPAL: "Principal",
  SCHOOL_ACCOUNTANT: "Accountant",
  CLASS_SUPERVISOR: "Supervisor",
  TEACHER: "Teacher",
  STUDENT: "Student",
};

export default function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname();
  const navItems = NAV_ITEMS[user.role] ?? [];
  const roleColor = ROLE_COLORS[user.role] ?? "bg-indigo-600";

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col min-h-screen sticky top-0">
      {/* Logo */}
      <div className={`${roleColor} px-4 py-5`}>
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl">🎓</span>
          <span className="text-white font-bold text-xl">LearnAI</span>
        </Link>
        <div className="mt-3 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
            {user.name?.charAt(0) ?? "U"}
          </div>
          <div>
            <div className="text-white text-sm font-medium truncate max-w-[140px]">
              {user.name ?? user.email}
            </div>
            <div className="text-white/70 text-xs">
              {ROLE_LABELS[user.role]}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span className="text-lg">{item.emoji}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-gray-100">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-700 transition-colors"
        >
          <span className="text-lg">🚪</span>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
