"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface FeedbackItem {
  questionIndex: number;
  isCorrect: boolean;
  explanation: string;
}

function QuizContent() {
  const searchParams = useSearchParams();
  const topicParam = searchParams.get("topic") ?? "";
  const subjectParam = searchParams.get("subject") ?? "";
  const gradeParam = searchParams.get("grade") ?? "5";

  const [subject, setSubject] = useState(subjectParam || "Mathematics");
  const [topic, setTopic] = useState(topicParam || "");
  const [grade, setGrade] = useState(gradeParam);
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium"
  );

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<{
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    feedback: FeedbackItem[];
    message: string;
    passed: boolean;
  } | null>(null);
  const [savedQuizId, setSavedQuizId] = useState<string | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);

  const quizPhase = questions.length === 0 ? "setup" : results ? "results" : "quiz";

  async function generateQuiz() {
    setLoading(true);
    setError("");
    setResults(null);
    setShowAnswers(false);

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
          quizTitle: `${topic} Quiz`,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setQuestions(json.data.questions);
        setAnswers(new Array(json.data.questions.length).fill(-1));
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

  async function submitQuiz() {
    if (!savedQuizId) {
      setError("Quiz ID not found. Please regenerate.");
      return;
    }

    const unanswered = answers.filter((a) => a === -1).length;
    if (unanswered > 0 && !confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/quiz-attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: savedQuizId,
          answers: answers.map((a) => (a === -1 ? 0 : a)),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setResults(json.data);
      } else {
        setError(json.error ?? "Failed to submit quiz");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetQuiz() {
    setQuestions([]);
    setAnswers([]);
    setResults(null);
    setSavedQuizId(null);
    setShowAnswers(false);
    setError("");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">✅ Quiz Time!</h1>
        <p className="text-gray-500 mt-1">
          Test your knowledge with AI-generated quizzes
        </p>
      </div>

      {/* Setup Phase */}
      {quizPhase === "setup" && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">
            Set up your quiz
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Questions
              </label>
              <select
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {[3, 5, 8, 10].map((n) => (
                  <option key={n} value={n}>
                    {n} questions
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty
            </label>
            <div className="flex gap-3">
              {["easy", "medium", "hard"].map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d as typeof difficulty)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border capitalize transition-colors ${
                    difficulty === d
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300"
                  }`}
                >
                  {d === "easy" ? "😊 Easy" : d === "medium" ? "🙂 Medium" : "😤 Hard"}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm border border-red-100 mb-4">
              {error}
            </div>
          )}

          <button
            onClick={generateQuiz}
            disabled={loading || !topic || !subject}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "🤖 Generating quiz..." : "🚀 Generate Quiz"}
          </button>
        </div>
      )}

      {/* Quiz Phase */}
      {quizPhase === "quiz" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <span className="font-medium text-gray-900">{topic}</span>
              <span className="text-gray-400 mx-2">·</span>
              <span className="text-gray-500 text-sm">{questions.length} questions</span>
            </div>
            <div className="text-sm text-gray-500">
              {answers.filter((a) => a !== -1).length}/{questions.length} answered
            </div>
          </div>

          {questions.map((q, qi) => (
            <div
              key={q.id}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
            >
              <p className="font-medium text-gray-900 mb-4">
                <span className="text-indigo-600 font-bold">Q{qi + 1}.</span>{" "}
                {q.question}
              </p>
              <div className="space-y-2">
                {q.options.map((opt, oi) => (
                  <button
                    key={oi}
                    onClick={() => {
                      const updated = [...answers];
                      updated[qi] = oi;
                      setAnswers(updated);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm border transition-colors ${
                      answers[qi] === oi
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"
                    }`}
                  >
                    <span className="font-medium">
                      {["A", "B", "C", "D"][oi]}.
                    </span>{" "}
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={resetQuiz}
              className="px-5 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              ← New Quiz
            </button>
            <button
              onClick={submitQuiz}
              disabled={submitting}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Answers ✅"}
            </button>
          </div>
        </div>
      )}

      {/* Results Phase */}
      {quizPhase === "results" && results && (
        <div className="space-y-4">
          {/* Score Card */}
          <div
            className={`rounded-2xl p-8 text-center shadow-sm border ${
              results.passed
                ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-100"
                : "bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-100"
            }`}
          >
            <div className="text-6xl mb-4">
              {results.score >= 80 ? "🌟" : results.score >= 60 ? "👍" : "💪"}
            </div>
            <div
              className={`text-5xl font-bold mb-2 ${
                results.passed ? "text-green-600" : "text-orange-600"
              }`}
            >
              {Math.round(results.score)}%
            </div>
            <div className="text-gray-700 font-medium">
              {results.correctAnswers} out of {results.totalQuestions} correct
            </div>
            <div className="mt-3 text-gray-600">{results.message}</div>
          </div>

          {/* Answers Review Toggle */}
          <button
            onClick={() => setShowAnswers(!showAnswers)}
            className="w-full bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-sm font-medium text-indigo-700 hover:bg-indigo-50 transition-colors"
          >
            {showAnswers ? "Hide Answers" : "📖 Review Answers"}
          </button>

          {showAnswers && (
            <div className="space-y-3">
              {questions.map((q, qi) => {
                const feedback = results.feedback.find(
                  (f) => f.questionIndex === qi
                );
                return (
                  <div
                    key={q.id}
                    className={`bg-white rounded-2xl p-5 border shadow-sm ${
                      feedback?.isCorrect ? "border-green-200" : "border-red-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span>{feedback?.isCorrect ? "✅" : "❌"}</span>
                      <p className="font-medium text-gray-900 text-sm">
                        Q{qi + 1}. {q.question}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      {q.options.map((opt, oi) => {
                        const isCorrect = oi === q.correctAnswer;
                        const isSelected = answers[qi] === oi;
                        return (
                          <div
                            key={oi}
                            className={`px-4 py-2 rounded-lg text-sm ${
                              isCorrect
                                ? "bg-green-100 text-green-800 font-medium"
                                : isSelected && !isCorrect
                                  ? "bg-red-100 text-red-700"
                                  : "bg-gray-50 text-gray-600"
                            }`}
                          >
                            {["A", "B", "C", "D"][oi]}. {opt}
                            {isCorrect && " ✓"}
                            {isSelected && !isCorrect && " ✗"}
                          </div>
                        );
                      })}
                    </div>
                    {feedback?.explanation && (
                      <div className="mt-3 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                        💡 {feedback.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={resetQuiz}
              className="flex-1 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              🔄 New Quiz
            </button>
            <button
              onClick={() => {
                setResults(null);
                setAnswers(new Array(questions.length).fill(-1));
                setShowAnswers(false);
              }}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
            >
              🔁 Retry Quiz
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentQuizPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <QuizContent />
    </Suspense>
  );
}
