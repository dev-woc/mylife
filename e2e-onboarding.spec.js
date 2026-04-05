import { test } from "@playwright/test";

test.use({ channel: "chrome" });

test("onboarding generates a plan", async ({ page }) => {
  const username = `e2e-${Date.now()}`;
  const password = "NorthEnd2026!";
  const baseUrl = process.env.TEST_BASE_URL || "http://127.0.0.1:4173";
  const responses = [];
  const pending = new Set();

  page.on("request", (request) => {
    if (!request.url().includes("/api/")) return;
    pending.add(`${request.method()} ${request.url()}`);
    console.log("REQUEST", request.method(), request.url());
  });

  page.on("response", async (response) => {
    const url = response.url();
    if (!url.includes("/api/")) return;
    pending.delete(`${response.request().method()} ${url}`);
    let body = "";
    try {
      body = await response.text();
    } catch {}
    responses.push({
      url,
      status: response.status(),
      body: body.slice(0, 400),
    });
  });

  page.on("requestfailed", (request) => {
    if (!request.url().includes("/api/")) return;
    pending.delete(`${request.method()} ${request.url()}`);
    console.log("REQUEST_FAILED", request.method(), request.url(), request.failure()?.errorText);
  });

  page.on("console", (msg) => console.log("BROWSER_CONSOLE", msg.type(), msg.text()));
  page.on("pageerror", (err) => console.log("PAGE_ERROR", err.message));

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.screenshot({ path: "e2e-screenshots/01-auth.png", fullPage: true });

  await page.getByRole("button", { name: "Create Account" }).click();
  await page.getByPlaceholder("jordan").fill(username);
  await page.getByPlaceholder("At least 8 characters").fill(password);
  await page.locator("form").getByRole("button", { name: "Create Account" }).click();

  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "e2e-screenshots/02-onboarding.png", fullPage: true });

  const answers = [
    "Jordan Demo",
    "New city, new job, rebuilding routines",
    "Boston. Cold winters, commute matters, I want more local momentum.",
    "Build momentum, get healthier, make new friends",
    "Money, energy after work, inconsistent sleep",
    "Focused weekdays, one social night, one reset day",
    "Mornings for difficult work, evenings for lighter admin",
    "Structured but not rigid",
    "Consistency, confidence, better health",
    "Wasted evenings, impulse spending, scattered priorities",
  ];

  const fields = [
    "What should the planner call you?",
    "What season of life are you in right now?",
    "Where do you live, and what context matters locally?",
    "What are your top goals for the next 3 to 12 months?",
    "What constraints matter most right now?",
    "What does a strong week look like for you?",
    "When do you usually have the best energy?",
    "What kind of planner are you?",
    "What do you want more of in your life?",
    "What do you want less of?",
  ];

  for (const [index, label] of fields.entries()) {
    await page.getByRole("textbox", { name: label }).fill(answers[index]);
  }

  await page.screenshot({ path: "e2e-screenshots/03-onboarding-filled.png", fullPage: true });
  const generateResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/plan/generate-initial") &&
      response.request().method() === "POST",
    { timeout: 60000 }
  );
  await page.getByRole("button", { name: "Generate My Plan" }).click();
  const generateResponse = await generateResponsePromise;
  console.log("GENERATE_STATUS", generateResponse.status());
  console.log("GENERATE_BODY", (await generateResponse.text()).slice(0, 600));
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "e2e-screenshots/04-after-generate.png", fullPage: true });

  console.log("FINAL_URL", page.url());
  console.log("BODY_SNIPPET", (await page.textContent("body"))?.slice(0, 1200));
  console.log("PENDING", JSON.stringify([...pending], null, 2));
  console.log("RESPONSES", JSON.stringify(responses, null, 2));
});
