"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";

function LessonContent() {
  const searchParams = useSearchParams();
  const topicParam = searchParams.get("topic") ?? "";
  const subjectParam = searchParams.get("subject") ?? "";
  const gradeParam = searchParams.get("grade") ?? "5";

  const [subject, setSubject] = useState(subjectParam || "Mathematics");
  const [topic, setTopic] = useState(topicParam || "");
  const [grade, setGrade] = useState(gradeParam);
  const [loading, setLoading] = useState(false);
  const [lessonContent, setLessonContent] = useState("");
  const [error, setError] = useState("");
  const [askQuestion, setAskQuestion] = useState("");
  const [explanation, setExplanation] = useState("");
  const [explainLoading, setExplainLoading] = useState(false);

  useEffect(() => {
    if (topicParam && subjectParam) {
      generateLesson();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generateLesson() {
    if (!topic || !subject) {
      setError("Please enter a subject and topic.");
      return;
    }
    setLoading(true);
    setLessonContent("");
    setError("");
    setExplanation("");

    try {
      const res = await fetch("/api/ai/lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, topic, gradeLevel: grade }),
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

  async function askAI() {
    if (!askQuestion.trim() || !topic) return;
    setExplainLoading(true);

    try {
      const res = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concept: topic,
          subject,
          gradeLevel: grade,
          studentQuestion: askQuestion,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setExplanation(json.data.explanation);
      }
    } catch {
      setExplanation("Sorry, I couldn't answer that right now.");
    } finally {
      setExplainLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">📖 AI Lesson Room</h1>
        <p className="text-gray-500 mt-1">
          Your personalized AI teacher will create a lesson just for you
        </p>
      </div>

      {/* Lesson Setup */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">
          What would you like to learn?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
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
              Topic
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., Fractions"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grade
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
        <button
          onClick={generateLesson}
          disabled={loading || !topic || !subject}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "🤖 Generating lesson..." : "🚀 Generate Lesson"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm border border-red-100">
          {error}
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
          <div className="text-6xl mb-4 animate-bounce">🤖</div>
          <div className="text-lg font-semibold text-gray-700">
            Your AI teacher is preparing your lesson...
          </div>
          <div className="text-gray-500 text-sm mt-2">
            This usually takes 10-20 seconds
          </div>
        </div>
      )}

      {/* Lesson Content */}
      {lessonContent && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <span className="text-3xl">📚</span>
            <div>
              <div className="font-bold text-gray-900">
                {topic} — {subject}
              </div>
              <div className="text-sm text-gray-500">Grade {grade}</div>
            </div>
            <button
              onClick={generateLesson}
              className="ml-auto text-sm text-indigo-600 hover:underline"
            >
              🔄 Regenerate
            </button>
          </div>

          <div className="prose prose-indigo max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700">
            <ReactMarkdown>{lessonContent}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Ask AI */}
      {lessonContent && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">
            🤔 Ask your AI teacher a question
          </h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={askQuestion}
              onChange={(e) => setAskQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && askAI()}
              placeholder="Type your question here..."
              className="flex-1 px-4 py-2.5 border border-indigo-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
            <button
              onClick={askAI}
              disabled={explainLoading || !askQuestion.trim()}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {explainLoading ? "Thinking..." : "Ask! 🙋"}
            </button>
          </div>
          {explanation && (
            <div className="mt-4 bg-white rounded-xl p-4 border border-indigo-100">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🤖</span>
                <span className="text-sm font-medium text-indigo-700">
                  AI Teacher says:
                </span>
              </div>
              <p className="text-gray-700 text-sm">{explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function StudentLessonPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <LessonContent />
    </Suspense>
  );
}
