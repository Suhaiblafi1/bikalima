import { expect, test } from "../fixtures/auth";

test.describe("role-aware workspace routing", () => {
  test("the neutral platform route sends every role to its own workspace", async ({
    learner,
    trainer,
    parent,
    admin,
  }) => {
    const cases = [
      { context: learner, destination: /\/dashboard$/ },
      { context: trainer, destination: /\/trainer$/ },
      { context: parent, destination: /\/parent$/ },
      { context: admin, destination: /\/admin\/overview$/ },
    ];

    for (const entry of cases) {
      const page = await entry.context.newPage();
      await page.goto("/platform");
      await expect(page).toHaveURL(entry.destination);
      await page.close();
    }
  });

  test("a role cannot remain inside another role's workspace", async ({ learner, trainer, parent, admin }) => {
    const cases = [
      { context: learner, forbidden: "/trainer", destination: /\/dashboard$/ },
      { context: trainer, forbidden: "/dashboard", destination: /\/trainer$/ },
      { context: parent, forbidden: "/admin/overview", destination: /\/parent$/ },
      { context: admin, forbidden: "/parent", destination: /\/admin\/overview$/ },
    ];

    for (const entry of cases) {
      const page = await entry.context.newPage();
      await page.goto(entry.forbidden);
      await expect(page).toHaveURL(entry.destination);
      await page.close();
    }
  });
});
