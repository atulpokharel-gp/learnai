import OpenAI from "openai";

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

export interface LessonGenerationParams {
  subject: string;
  topic: string;
  gradeLevel: string;
  learningObjectives?: string;
  studentStrengths?: string;
  studentWeakAreas?: string;
  difficultyLevel?: string;
  preferredLearningStyle?: string;
}

export interface QuizGenerationParams {
  subject: string;
  topic: string;
  gradeLevel: string;
  numQuestions?: number;
  difficultyLevel?: string;
  studentLevel?: string;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export async function generateLesson(
  params: LessonGenerationParams
): Promise<string> {
  const client = getOpenAIClient();

  const systemPrompt = `You are a friendly, expert AI teacher creating lessons for kids aged 6-18.
Your lessons should be:
- Age-appropriate for grade level: ${params.gradeLevel}
- Engaging, clear, and motivating
- Structured with introduction, main content, examples, and a summary
- Safe and encouraging
- Adapted to difficulty level: ${params.difficultyLevel ?? "medium"}
${params.studentStrengths ? `- Building on student strengths: ${params.studentStrengths}` : ""}
${params.studentWeakAreas ? `- Providing extra support for weak areas: ${params.studentWeakAreas}` : ""}

Format your response as structured markdown with clear sections.`;

  const userPrompt = `Create an engaging lesson for:
- Subject: ${params.subject}
- Topic: ${params.topic}
- Grade Level: ${params.gradeLevel}
${params.learningObjectives ? `- Learning Objectives: ${params.learningObjectives}` : ""}

The lesson should include:
1. 🎯 Learning Goals (simple bullet points)
2. 📚 Introduction (friendly hook to grab attention)
3. 🔍 Main Lesson Content (clear explanations with examples)
4. 💡 Key Concepts (summarized simply)
5. 🎨 Activity or Practice Exercise
6. ✅ Quick Check Questions (2-3 questions)
7. 🌟 Summary

Make it fun and age-appropriate!`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  return response.choices[0]?.message?.content ?? "Unable to generate lesson.";
}

export async function generateQuiz(
  params: QuizGenerationParams
): Promise<Question[]> {
  const client = getOpenAIClient();
  const numQuestions = params.numQuestions ?? 5;

  const systemPrompt = `You are an expert quiz creator for students in grade ${params.gradeLevel}.
Create clear, fair, age-appropriate multiple-choice questions.
Difficulty level: ${params.difficultyLevel ?? "medium"}
Always respond with valid JSON only, no markdown.`;

  const userPrompt = `Create ${numQuestions} multiple-choice quiz questions for:
- Subject: ${params.subject}
- Topic: ${params.topic}
- Grade Level: ${params.gradeLevel}

Return a JSON array with this exact format:
[
  {
    "id": "q1",
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Brief explanation of why this is correct"
  }
]

The correctAnswer field is the 0-based index of the correct option.
Make questions progressively slightly harder. Keep language simple and age-appropriate.`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.5,
    max_tokens: 1500,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(content);
    const questions = Array.isArray(parsed) ? parsed : parsed.questions ?? [];
    return questions as Question[];
  } catch {
    return [];
  }
}

export async function explainConcept(
  concept: string,
  subject: string,
  gradeLevel: string,
  studentQuestion?: string
): Promise<string> {
  const client = getOpenAIClient();

  const systemPrompt = `You are a friendly AI teacher helping a student in grade ${gradeLevel}.
Explain concepts clearly, simply, and encouragingly.
Use analogies, examples, and simple language appropriate for the grade level.
Keep explanations concise but complete.`;

  const userPrompt = `Please explain "${concept}" in ${subject} for a grade ${gradeLevel} student.
${studentQuestion ? `The student specifically asked: "${studentQuestion}"` : ""}

Make the explanation:
- Clear and simple
- With a real-world example or analogy
- Encouraging and motivating
- Appropriate for their age level`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 600,
  });

  return (
    response.choices[0]?.message?.content ?? "Unable to explain at this time."
  );
}

export async function generateLearningPlan(
  studentProfile: {
    gradeLevel: string;
    strengths?: string;
    weakAreas?: string;
    confidenceLevel?: string;
    diagnosticScore?: number;
    preferredSubjects?: string;
  },
  availableTopics: Array<{ id: string; title: string; subject: string }>,
  curriculumRequirements?: string
): Promise<{
  recommendedPath: string;
  priorityTopics: string[];
  notes: string;
}> {
  const client = getOpenAIClient();

  const systemPrompt = `You are an expert educational psychologist and AI curriculum planner.
Create personalized learning plans for students based on their profile and available curriculum.
Respond with valid JSON only.`;

  const userPrompt = `Create a personalized learning plan for this student:

Student Profile:
- Grade Level: ${studentProfile.gradeLevel}
- Strengths: ${studentProfile.strengths ?? "Not specified"}
- Weak Areas: ${studentProfile.weakAreas ?? "Not specified"}
- Confidence Level: ${studentProfile.confidenceLevel ?? "medium"}
- Diagnostic Score: ${studentProfile.diagnosticScore ?? "Not taken"}
- Preferred Subjects: ${studentProfile.preferredSubjects ?? "Not specified"}

Available Topics: ${JSON.stringify(availableTopics.slice(0, 20))}
${curriculumRequirements ? `Curriculum Requirements: ${curriculumRequirements}` : ""}

Return JSON with this structure:
{
  "recommendedPath": "Brief description of the recommended learning path",
  "priorityTopics": ["topic_id_1", "topic_id_2", ...],
  "notes": "Any special considerations or notes for teachers"
}`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 800,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(content);
  } catch {
    return {
      recommendedPath: "Follow the standard curriculum path",
      priorityTopics: availableTopics.slice(0, 5).map((t) => t.id),
      notes: "Unable to generate personalized plan - using default path",
    };
  }
}
