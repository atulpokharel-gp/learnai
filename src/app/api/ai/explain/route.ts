import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/lib/api-response";
import { explainConcept } from "@/lib/ai-service";
import { z } from "zod";

const explainSchema = z.object({
  concept: z.string().min(1).max(200),
  subject: z.string().min(1),
  gradeLevel: z.string().min(1),
  studentQuestion: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  try {
    const body = await req.json();
    const data = explainSchema.parse(body);

    const explanation = await explainConcept(
      data.concept,
      data.subject,
      data.gradeLevel,
      data.studentQuestion
    );

    return successResponse({ explanation, concept: data.concept });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return errorResponse(err.issues[0]?.message ?? "Validation failed");
    }
    console.error("Explain concept error:", err);
    return errorResponse("Failed to explain concept", 500);
  }
}
