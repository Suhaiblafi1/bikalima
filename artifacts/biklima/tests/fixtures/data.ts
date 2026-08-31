/**
 * Shared identifiers and credentials used by the e2e suite.
 *
 * Keep these stable — the global setup upserts them into the database before
 * every test run, and individual specs reference them by name. Treat them as
 * test-only seed data; never reuse for production.
 */
export const TEST_FIXTURES = {
  learner: {
    email: "e2e.learner@bikalima.test",
    password: "E2eLearner!23",
    firstName: "تجربة",
    lastName: "متدرّب",
  },
  admin: {
    email: "e2e.admin@bikalima.test",
    password: "E2eAdmin!23",
    firstName: "تجربة",
    lastName: "مدير",
  },
  trainer: {
    email: "e2e.trainer@bikalima.test",
    password: "E2eTrainer!23",
    firstName: "تجربة",
    lastName: "مدرّب",
  },
  parent: {
    email: "e2e.parent@bikalima.test",
    password: "E2eParent!23",
    firstName: "تجربة",
    lastName: "ولي أمر",
  },
  course: {
    slug: "e2e-test-course",
    titleAr: "دورة اختبار E2E",
    titleEn: "E2E Test Course",
  },
  certificate: {
    code: "BK-CERT-E2E-0001",
    fileUrl: "https://example.com/e2e/certificate.pdf",
  },
  speechEvaluation: {
    topic: "E2E Speech Topic",
    overallScore: 85,
    reportMarker: "## E2E Final Report\n\nThe learner demonstrated strong delivery.",
  },
  badge: {
    key: "e2e_test_badge",
  },
  // A workbook the learner owns (a confirmed order is seeded), carrying one
  // published page and one draft the learner must never see.
  workbook: {
    slug: "e2e-workbook",
    titleAr: "كرّاسة اختبار E2E",
    sectionAr: "الفصل الأول · النطاق اللفظي",
    pageTitleAr: "بناء الافتتاحية",
    bodyFirstParagraph: "الافتتاحية عقدٌ تعقده مع المستمع في أول عشر ثوانٍ.",
    bodySecondParagraph: "ابدأ بسؤال لا يملك المستمع إجابته، ثم اصمت ثانيةً كاملة.",
    exerciseAr: "اكتب ثلاث افتتاحيات لموضوعك، ثم احذف اثنتين.",
    draftTitleAr: "صفحة مسودة",
    // Page 1 collects a written answer; page 3 collects a link to the
    // learner's own recording. Both are published and both credit a skill,
    // so a pass has points to move and the award logic is exercised.
    skillKey: "idea",
    skillPoints: 20,
    videoPageNumber: 3,
    videoPageTitleAr: "خطبتك الأولى",
    videoExerciseAr: "ارفع رابط تسجيل خطبتك.",
    videoSkillKey: "impact",
    videoSkillPoints: 15,
  },
  // A published workbook with no order for the learner: reading it must be
  // refused, which is what proves the entitlement gate is load-bearing.
  lockedWorkbook: {
    slug: "e2e-workbook-locked",
    titleAr: "كرّاسة غير مملوكة",
  },
} as const;
