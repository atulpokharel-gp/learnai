"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

type Tab = "lesson" | "quiz";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export default function TeacherAIStudio() {
  const [activeTab, setActiveTab] = useState<Tab>("lesson");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState("5");
  const [objectives, setObjectives] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [numQuestions, setNumQuestions] = useState(5);

  const [loading, setLoading] = useState(false);
  const [lessonContent, setLessonContent] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState("");
  const [savedQuizId, setSavedQuizId] = useState<string | null>(null);

  async function generateLesson() {
    if (!subject || !topic) {
      setError("Please fill in subject and topic.");
      return;
    }
    setLoading(true);
    setError("");
    setLessonContent("");

    try {
      const res = await fetch("/api/ai/lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          topic,
          gradeLevel: grade,
          learningObjectives: objectives,
          difficultyLevel: difficulty,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setLessonContent(json.data.lessonContent);
      } else {
        setError(json.error ?? "Failed to generate lesson");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function generateQuiz() {
    if (!subject || !topic) {
      setError("Please fill in subject and topic.");
      return;
    }
    setLoading(true);
    setError("");
    setQuestions([]);

    try {
      const res = await fetch("/api/ai/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          topic,
          gradeLevel: grade,
          numQuestions,
          difficultyLevel: difficulty,
          saveQuiz: true,
          quizTitle: `${topic} — ${subject} Quiz (Grade ${grade})`,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setQuestions(json.data.questions);
        setSavedQuizId(json.data.savedQuizId);
      } else {
        setError(json.error ?? "Failed to generate quiz");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🤖 AI Studio</h1>
        <p className="text-gray-500 mt-1">
          Generate AI-powered lessons and quizzes for your students
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          {(["lesson", "quiz"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setError("");
              }}
              className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab === "lesson" ? "📚 Generate Lesson" : "✅ Generate Quiz"}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Common Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject *
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Mathematics"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Topic *
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Introduction to Fractions"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grade Level
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={String(i + 1)}>
                    Grade {i + 1}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty
              </label>
              <div className="flex gap-2">
                {["easy", "medium", "hard"].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border capitalize transition-colors ${
                      difficulty === d
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            {activeTab === "quiz" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Questions
                </label>
                <select
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {[3, 5, 8, 10, 15, 20].map((n) => (
                    <option key={n} value={n}>
                      {n} questions
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {activeTab === "lesson" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Learning Objectives (optional)
              </label>
              <textarea
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Students will be able to identify and compare fractions..."
                rows={2}
              />
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm border border-red-100 mb-4">
              {error}
            </div>
          )}

          <button
            onClick={activeTab === "lesson" ? generateLesson : generateQuiz}
            disabled={loading}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? "🤖 AI is working..."
              : activeTab === "lesson"
                ? "🚀 Generate Lesson"
                : "✅ Generate Quiz"}
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-2xl p-10 border border-gray-100 shadow-sm text-center">
          <div className="text-5xl mb-3 animate-bounce">🤖</div>
          <div className="text-lg font-semibold text-gray-700">
            AI is generating your {activeTab}...
          </div>
          <div className="text-gray-400 text-sm mt-1">
            Usually takes 10-20 seconds
          </div>
        </div>
      )}

      {/* Lesson Output */}
      {activeTab === "lesson" && lessonContent && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
            <div>
              <h2 className="font-bold text-gray-900">
                📚 {topic} — {subject}
              </h2>
              <p className="text-sm text-gray-500">Grade {grade}</p>
            </div>
            <button
              onClick={() => {
                const blob = new Blob([lessonContent], { type: "text/markdown" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${topic}-lesson.md`;
                a.click();
              }}
              className="text-sm text-indigo-600 hover:underline"
            >
              ⬇️ Download
            </button>
          </div>
          <div className="prose prose-indigo max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700">
            <ReactMarkdown>{lessonContent}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Quiz Output */}
      {activeTab === "quiz" && questions.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
            <div>
              <h2 className="font-bold text-gray-900">
                ✅ {topic} Quiz — {subject}
              </h2>
              <p className="text-sm text-gray-500">
                Grade {grade} · {questions.length} questions
                {savedQuizId && (
                  <span className="ml-2 text-green-600">· Saved ✓</span>
                )}
              </p>
            </div>
          </div>
          <div className="space-y-6">
            {questions.map((q, i) => (
              <div key={q.id} className="border-b border-gray-100 pb-6 last:border-0">
                <p className="font-medium text-gray-900 mb-3">
                  <span className="text-indigo-600 font-bold">Q{i + 1}.</span>{" "}
                  {q.question}
                </p>
                <div className="space-y-1.5">
                  {q.options.map((opt, oi) => (
                    <div
                      key={oi}
                      className={`px-4 py-2 rounded-lg text-sm ${
                        oi === q.correctAnswer
                          ? "bg-green-100 text-green-800 font-medium"
                          : "bg-gray-50 text-gray-600"
                      }`}
                    >
                      {["A", "B", "C", "D"][oi]}. {opt}
                      {oi === q.correctAnswer && " ✓ (Correct)"}
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-xs text-gray-500 bg-blue-50 px-3 py-2 rounded-lg">
                  💡 {q.explanation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
