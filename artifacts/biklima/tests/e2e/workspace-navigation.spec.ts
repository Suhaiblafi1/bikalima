import { expect, test } from "../fixtures/auth";
import { TEST_FIXTURES } from "../fixtures/data";

test("learner mobile workspace exposes five calm primary destinations", async ({ learner }) => {
  const page = await learner.newPage();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript((userId) => {
    localStorage.setItem("biklima-lang", "ar");
    localStorage.setItem(`bikalima:onboarding:${userId}`, "confidence");
  }, process.env.E2E_LEARNER_ID ?? "guest");
  await page.goto("/dashboard");

  const navigation = page.getByRole("navigation", { name: "التنقل الرئيسي في منصة الطالب" });
  await expect(navigation).toBeVisible();
  await expect(navigation.getByRole("button")).toHaveCount(5);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(TEST_FIXTURES.learner.firstName);
  await expect(page.getByText("البرامج التدريبية", { exact: true })).toHaveCount(0);
  await page.close();
});

test("trainer workspace leads with a four-part daily workflow", async ({ trainer }) => {
  const page = await trainer.newPage();
  await page.goto("/trainer");

  await expect(page.getByRole("heading", { level: 1 })).toContainText(TEST_FIXTURES.trainer.firstName);
  const navigation = page.getByRole("navigation", { name: "أقسام مساحة المدرب" });
  await expect(navigation.getByRole("button")).toHaveCount(4);
  await expect(page.getByRole("heading", { name: "ما يحتاجك الآن" })).toBeVisible();
  await expect(page.getByText("البرامج التدريبية", { exact: true })).toHaveCount(0);
  await page.close();
});

test("admin navigation is grouped into five collapsible areas", async ({ admin }) => {
  const page = await admin.newPage();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/admin/overview");

  await expect(page.getByRole("heading", { level: 1, name: "نظرة عامة" })).toBeVisible();
  const toggles = page.locator('aside button[aria-expanded]');
  await expect(toggles).toHaveCount(5);
  await expect(toggles).toContainText(["نظرة عامة", "مركز النمو (CRM)", "نظام التعلّم (LMS)", "المحتوى", "الإعدادات"]);
  await expect(page.getByTestId("admin-executive-kpis").locator(":scope > *")).toHaveCount(4);
  await page.close();
});

test("public certificate page offers verified sharing actions", async ({ anon }) => {
  const page = await anon.newPage();
  await page.goto(`/certificates/${encodeURIComponent(TEST_FIXTURES.certificate.code)}`);
  await expect(page.getByRole("heading", { name: "شارك إنجازك برابط موثّق" })).toBeVisible();
  await expect(page.getByRole("link", { name: /LinkedIn/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /واتساب/ })).toBeVisible();
  await page.close();
});
