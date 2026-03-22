"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface OnboardingData {
  gradeLevel: string;
  preferredSubjects: string;
  strengths: string;
  weakAreas: string;
  learningStyle: string;
  confidenceLevel: string;
  diagnosticScore?: number;
  diagnosticAnswers?: number[];
}

const DIAGNOSTIC_QUESTIONS = [
  {
    id: "dq1",
    subject: "Mathematics",
    question: "What is 15 × 8?",
    options: ["100", "112", "120", "132"],
    correctAnswer: 2,
  },
  {
    id: "dq2",
    subject: "Mathematics",
    question: "Which fraction is the largest?",
    options: ["1/4", "2/5", "3/8", "1/2"],
    correctAnswer: 3,
  },
  {
    id: "dq3",
    subject: "General",
    question: "If a train travels 60 km/h, how far does it go in 2.5 hours?",
    options: ["100 km", "120 km", "150 km", "180 km"],
    correctAnswer: 2,
  },
  {
    id: "dq4",
    subject: "Science",
    question: "What is the closest star to Earth?",
    options: ["Alpha Centauri", "The Sun", "Sirius", "Betelgeuse"],
    correctAnswer: 1,
  },
  {
    id: "dq5",
    subject: "General",
    question: "Which of these is a renewable energy source?",
    options: ["Coal", "Oil", "Solar", "Natural Gas"],
    correctAnswer: 2,
  },
];

export default function StudentOnboarding() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    gradeLevel: "",
    preferredSubjects: "",
    strengths: "",
    weakAreas: "",
    learningStyle: "",
    confidenceLevel: "medium",
  });
  const [diagnosticAnswers, setDiagnosticAnswers] = useState<number[]>(
    new Array(DIAGNOSTIC_QUESTIONS.length).fill(-1)
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const totalSteps = 4;

  function handleDiagnosticAnswer(questionIdx: number, answerIdx: number) {
    const updated = [...diagnosticAnswers];
    updated[questionIdx] = answerIdx;
    setDiagnosticAnswers(updated);
  }

  async function handleFinish() {
    setSubmitting(true);
    setError("");

    // Calculate diagnostic score
    let correct = 0;
    for (let i = 0; i < DIAGNOSTIC_QUESTIONS.length; i++) {
      if (diagnosticAnswers[i] === DIAGNOSTIC_QUESTIONS[i].correctAnswer) {
        correct++;
      }
    }
    const diagnosticScore = Math.round(
      (correct / DIAGNOSTIC_QUESTIONS.length) * 100
    );

    try {
      const res = await fetch("/api/student/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          diagnosticScore,
          diagnosticAnswers: JSON.stringify(diagnosticAnswers),
        }),
      });

      if (res.ok) {
        router.push("/dashboard/student");
        router.refresh();
      } else {
        const json = await res.json();
        setError(json.error ?? "Failed to save. Please try again.");
        setSubmitting(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🚀</div>
          <h1 className="text-2xl font-bold text-gray-900">
            Let&apos;s set up your learning journey!
          </h1>
          <p className="text-gray-500 mt-2">
            Step {step} of {totalSteps}
          </p>
          {/* Progress bar */}
          <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-900">
                📚 Tell us about yourself
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What grade are you in? *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"].map(
                    (g) => (
                      <button
                        key={g}
                        onClick={() => setData({ ...data, gradeLevel: g })}
                        className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                          data.gradeLevel === g
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300"
                        }`}
                      >
                        {g}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What subjects do you love? 💝
                </label>
                <textarea
                  value={data.preferredSubjects}
                  onChange={(e) =>
                    setData({ ...data, preferredSubjects: e.target.value })
                  }
                  placeholder="e.g., Mathematics, Science, Art..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  rows={2}
                />
              </div>

              <button
                onClick={() => step < totalSteps && setStep(step + 1)}
                disabled={!data.gradeLevel}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue →
              </button>
            </div>
          )}

          {/* Step 2: Strengths & Learning Style */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-900">
                💪 What are you good at?
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your strengths
                </label>
                <textarea
                  value={data.strengths}
                  onChange={(e) =>
                    setData({ ...data, strengths: e.target.value })
                  }
                  placeholder="e.g., I'm great at solving puzzles and remembering facts..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What do you find difficult?
                </label>
                <textarea
                  value={data.weakAreas}
                  onChange={(e) =>
                    setData({ ...data, weakAreas: e.target.value })
                  }
                  placeholder="e.g., I struggle with reading long texts..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How do you learn best? 🧠
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "visual", label: "👀 Looking at pictures & diagrams" },
                    { value: "auditory", label: "👂 Listening & talking" },
                    { value: "reading", label: "📖 Reading & writing" },
                    { value: "kinesthetic", label: "🖐️ Doing & practicing" },
                  ].map((style) => (
                    <button
                      key={style.value}
                      onClick={() =>
                        setData({ ...data, learningStyle: style.value })
                      }
                      className={`py-3 px-3 rounded-lg text-xs font-medium border text-left transition-colors ${
                        data.learningStyle === style.value
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300"
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How confident do you feel about school? 🌟
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "low", label: "😅 Need help", emoji: "😅" },
                    { value: "medium", label: "🙂 Getting there", emoji: "🙂" },
                    { value: "high", label: "😎 Feeling good!", emoji: "😎" },
                  ].map((conf) => (
                    <button
                      key={conf.value}
                      onClick={() =>
                        setData({ ...data, confidenceLevel: conf.value })
                      }
                      className={`py-3 rounded-lg text-sm font-medium border text-center transition-colors ${
                        data.confidenceLevel === conf.value
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300"
                      }`}
                    >
                      {conf.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(step - 1)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(step + 1)}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Diagnostic Quiz */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-900">
                🎯 Quick Knowledge Check
              </h2>
              <p className="text-gray-500 text-sm">
                These 5 questions help us understand where to start your
                learning journey. Don&apos;t worry — just do your best!
              </p>

              <div className="space-y-6">
                {DIAGNOSTIC_QUESTIONS.map((q, qi) => (
                  <div key={q.id} className="space-y-2">
                    <p className="text-sm font-medium text-gray-800">
                      <span className="text-indigo-500 font-bold">
                        Q{qi + 1}.
                      </span>{" "}
                      {q.question}
                    </p>
                    <div className="space-y-1.5">
                      {q.options.map((opt, oi) => (
                        <button
                          key={oi}
                          onClick={() => handleDiagnosticAnswer(qi, oi)}
                          className={`w-full text-left px-4 py-2 rounded-lg text-sm border transition-colors ${
                            diagnosticAnswers[qi] === oi
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300"
                          }`}
                        >
                          {["A", "B", "C", "D"][oi]}. {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(step - 1)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(step + 1)}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Review & Submit */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-900">
                🎉 Almost there!
              </h2>
              <p className="text-gray-500 text-sm">
                Here&apos;s a summary of your profile. We&apos;ll use this to
                create your personalized learning journey!
              </p>

              <div className="space-y-3">
                {[
                  { label: "Grade", value: `Grade ${data.gradeLevel}` },
                  {
                    label: "Favourite Subjects",
                    value: data.preferredSubjects || "Not specified",
                  },
                  {
                    label: "Strengths",
                    value: data.strengths || "Not specified",
                  },
                  {
                    label: "Learning Style",
                    value: data.learningStyle || "Not specified",
                  },
                  {
                    label: "Confidence",
                    value: data.confidenceLevel,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-sm text-gray-500">{item.label}</span>
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm border border-red-100">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(step - 1)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleFinish}
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-colors disabled:opacity-50"
                >
                  {submitting
                    ? "Setting up your journey... 🚀"
                    : "Start Learning! 🚀"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
