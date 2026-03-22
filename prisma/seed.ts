import { PrismaClient, Role } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({
  url: "./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Create SaaS Admin
  const adminHash = await bcrypt.hash("Admin@123456", 12);
  const saasAdmin = await prisma.user.upsert({
    where: { email: "admin@learnai.io" },
    update: {},
    create: {
      email: "admin@learnai.io",
      passwordHash: adminHash,
      firstName: "SaaS",
      lastName: "Admin",
      role: Role.SAAS_ADMIN,
    },
  });
  console.log("✅ SaaS Admin created:", saasAdmin.email);

  // Create demo school
  const demoSchool = await prisma.school.upsert({
    where: { slug: "demo-school" },
    update: {},
    create: {
      name: "Demo Elementary School",
      slug: "demo-school",
      contactEmail: "principal@demo-school.edu",
      contactPhone: "+1-555-0100",
      address: "123 Learning Lane, Education City, EC 12345",
      subscriptionPlan: "premium",
    },
  });
  console.log("✅ Demo school created:", demoSchool.name);

  // Create principal
  const principalHash = await bcrypt.hash("Principal@123", 12);
  const principal = await prisma.user.upsert({
    where: { email: "principal@demo-school.edu" },
    update: {},
    create: {
      email: "principal@demo-school.edu",
      passwordHash: principalHash,
      firstName: "Jane",
      lastName: "Principal",
      role: Role.SCHOOL_PRINCIPAL,
      schoolId: demoSchool.id,
    },
  });
  console.log("✅ Principal created:", principal.email);

  // Create teacher
  const teacherHash = await bcrypt.hash("Teacher@123", 12);
  const teacher = await prisma.user.upsert({
    where: { email: "teacher@demo-school.edu" },
    update: {},
    create: {
      email: "teacher@demo-school.edu",
      passwordHash: teacherHash,
      firstName: "John",
      lastName: "Smith",
      role: Role.TEACHER,
      schoolId: demoSchool.id,
    },
  });

  await prisma.teacherProfile.upsert({
    where: { userId: teacher.id },
    update: {},
    create: {
      userId: teacher.id,
      specializations: "Mathematics, Science",
      qualifications: "M.Ed. Mathematics",
    },
  });
  console.log("✅ Teacher created:", teacher.email);

  // Create supervisor
  const supervisorHash = await bcrypt.hash("Supervisor@123", 12);
  const supervisor = await prisma.user.upsert({
    where: { email: "supervisor@demo-school.edu" },
    update: {},
    create: {
      email: "supervisor@demo-school.edu",
      passwordHash: supervisorHash,
      firstName: "Alice",
      lastName: "Supervisor",
      role: Role.CLASS_SUPERVISOR,
      schoolId: demoSchool.id,
    },
  });
  console.log("✅ Supervisor created:", supervisor.email);

  // Create student
  const studentHash = await bcrypt.hash("Student@123", 12);
  const student = await prisma.user.upsert({
    where: { email: "student@demo-school.edu" },
    update: {},
    create: {
      email: "student@demo-school.edu",
      passwordHash: studentHash,
      firstName: "Alex",
      lastName: "Student",
      role: Role.STUDENT,
      schoolId: demoSchool.id,
    },
  });

  await prisma.studentProfile.upsert({
    where: { userId: student.id },
    update: {},
    create: {
      userId: student.id,
      gradeLevel: "5",
      preferredSubjects: "Mathematics, Science",
      strengths: "Problem solving, visual learning",
      weakAreas: "Reading comprehension",
      learningStyle: "visual",
      confidenceLevel: "medium",
    },
  });
  console.log("✅ Student created:", student.email);

  // Create a class
  const demoClass = await prisma.class.upsert({
    where: { id: "class-grade5-2024" },
    update: {},
    create: {
      id: "class-grade5-2024",
      name: "Grade 5A",
      gradeLevel: "5",
      academicYear: "2024-2025",
      schoolId: demoSchool.id,
      supervisorId: supervisor.id,
    },
  });
  console.log("✅ Class created:", demoClass.name);

  // Create subjects
  const mathSubject = await prisma.subject.upsert({
    where: { schoolId_code: { schoolId: demoSchool.id, code: "MATH5" } },
    update: {},
    create: {
      name: "Mathematics",
      code: "MATH5",
      description: "Grade 5 Mathematics",
      gradeLevel: "5",
      schoolId: demoSchool.id,
    },
  });

  const scienceSubject = await prisma.subject.upsert({
    where: { schoolId_code: { schoolId: demoSchool.id, code: "SCI5" } },
    update: {},
    create: {
      name: "Science",
      code: "SCI5",
      description: "Grade 5 Science",
      gradeLevel: "5",
      schoolId: demoSchool.id,
    },
  });
  console.log("✅ Subjects created: Mathematics, Science");

  // Create curriculum
  const mathCurriculum = await prisma.curriculum.upsert({
    where: { id: "curr-math5-2024" },
    update: {},
    create: {
      id: "curr-math5-2024",
      title: "Grade 5 Mathematics Curriculum",
      description: "Full year mathematics curriculum for Grade 5",
      academicYear: "2024-2025",
      schoolId: demoSchool.id,
      subjectId: mathSubject.id,
      classId: demoClass.id,
    },
  });

  // Create syllabus units
  const unit1 = await prisma.syllabusUnit.upsert({
    where: { id: "unit-fractions" },
    update: {},
    create: {
      id: "unit-fractions",
      title: "Fractions and Decimals",
      description: "Understanding and working with fractions and decimals",
      sequenceOrder: 1,
      estimatedWeeks: 4,
      schoolId: demoSchool.id,
      curriculumId: mathCurriculum.id,
    },
  });

  const unit2 = await prisma.syllabusUnit.upsert({
    where: { id: "unit-geometry" },
    update: {},
    create: {
      id: "unit-geometry",
      title: "Geometry",
      description: "Shapes, area, and perimeter",
      sequenceOrder: 2,
      estimatedWeeks: 3,
      schoolId: demoSchool.id,
      curriculumId: mathCurriculum.id,
    },
  });

  // Create topics
  const topics = [
    {
      id: "topic-fractions-intro",
      title: "Introduction to Fractions",
      description: "What are fractions and how do we use them?",
      sequenceOrder: 1,
      syllabusUnitId: unit1.id,
      subjectId: mathSubject.id,
    },
    {
      id: "topic-fractions-add",
      title: "Adding and Subtracting Fractions",
      description: "Learn to add and subtract fractions with like denominators",
      sequenceOrder: 2,
      syllabusUnitId: unit1.id,
      subjectId: mathSubject.id,
    },
    {
      id: "topic-decimals",
      title: "Understanding Decimals",
      description: "Introduction to decimal numbers",
      sequenceOrder: 3,
      syllabusUnitId: unit1.id,
      subjectId: mathSubject.id,
    },
    {
      id: "topic-area",
      title: "Area and Perimeter",
      description: "Calculate area and perimeter of basic shapes",
      sequenceOrder: 4,
      syllabusUnitId: unit2.id,
      subjectId: mathSubject.id,
    },
  ];

  for (const topic of topics) {
    await prisma.topic.upsert({
      where: { id: topic.id },
      update: {},
      create: {
        ...topic,
        schoolId: demoSchool.id,
      },
    });
  }
  console.log("✅ Topics created:", topics.length);

  // Create a sample quiz
  const sampleQuestions = [
    {
      id: "q1",
      question: "What is 1/2 + 1/4?",
      options: ["1/4", "2/4", "3/4", "1/6"],
      correctAnswer: 2,
      explanation:
        "1/2 = 2/4, so 2/4 + 1/4 = 3/4. We need common denominators first!",
    },
    {
      id: "q2",
      question: "Which of these is equivalent to 0.5?",
      options: ["1/4", "1/2", "1/3", "2/3"],
      correctAnswer: 1,
      explanation:
        "0.5 = 5/10 = 1/2. Half of one whole is the same as 0.5!",
    },
    {
      id: "q3",
      question: "What fraction of this shape is shaded if 3 out of 8 parts are shaded?",
      options: ["3/8", "5/8", "8/3", "3/5"],
      correctAnswer: 0,
      explanation:
        "We write fractions as (shaded parts)/(total parts) = 3/8",
    },
  ];

  await prisma.quiz.upsert({
    where: { id: "quiz-fractions-basic" },
    update: {},
    create: {
      id: "quiz-fractions-basic",
      title: "Fractions Basics Quiz",
      description: "Test your knowledge of basic fractions",
      quizType: "assessment",
      difficultyLevel: "easy",
      gradeLevel: "5",
      questions: JSON.stringify(sampleQuestions),
      isPublished: true,
      schoolId: demoSchool.id,
      topicId: "topic-fractions-intro",
    },
  });
  console.log("✅ Sample quiz created");

  console.log("\n🎉 Seeding complete!");
  console.log("\n📋 Demo Accounts:");
  console.log("   SaaS Admin:  admin@learnai.io / Admin@123456");
  console.log("   Principal:   principal@demo-school.edu / Principal@123");
  console.log("   Teacher:     teacher@demo-school.edu / Teacher@123");
  console.log("   Supervisor:  supervisor@demo-school.edu / Supervisor@123");
  console.log("   Student:     student@demo-school.edu / Student@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
