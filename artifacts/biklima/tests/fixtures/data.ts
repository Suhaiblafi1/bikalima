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
} as const;
