const { test, expect, beforeEach, describe } = require("@playwright/test");

describe("Blog app", () => {
  const apiUrl = "http://localhost:3003";
  const frontendUrl = "http://localhost:5173";
  const testUser = {
    name: "Test User",
    username: "testuser",
    password: "password123",
  };

  beforeEach(async ({ page, request }) => {
    // إعادة ضبط قاعدة البيانات
    await request.post(`${apiUrl}/api/testing/reset`);

    // إنشاء مستخدم واحد فقط
    await request.post(`${apiUrl}/api/users`, {
      data: testUser,
    });

    // زيارة الصفحة الأمامية
    await page.goto(frontendUrl);
  });

  test("login form is shown by default", async ({ page }) => {
    await expect(page.getByPlaceholder("Username")).toBeVisible();
    await expect(page.getByPlaceholder("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "login" })).toBeVisible();
  });

  describe("Login", () => {
    test("succeeds with correct credentials", async ({ page }) => {
      await page.getByPlaceholder("Username").fill(testUser.username);
      await page.getByPlaceholder("Password").fill(testUser.password);
      await page.getByRole("button", { name: "login" }).click();

      await expect(page.getByText(`${testUser.name} logged-in`)).toBeVisible();
    });

    test("fails with wrong credentials", async ({ page }) => {
      await page.getByPlaceholder("Username").fill(testUser.username);
      await page.getByPlaceholder("Password").fill("wrongpass");
      await page.getByRole("button", { name: "login" }).click();

      const errorNotification = page.locator(".error");
      await expect(errorNotification).toContainText(
        "Invalid username or password"
      );
      await expect(errorNotification).toHaveCSS("border-style", "solid");
      await expect(
        page.getByText(`${testUser.name} logged-in`)
      ).not.toBeVisible();
    });
  });

  describe("When logged in", () => {
    beforeEach(async ({ page, request }) => {
      // تسجيل الدخول عبر API للحصول على التوكن
      const response = await request.post(`${apiUrl}/api/login`, {
        data: {
          username: testUser.username,
          password: testUser.password,
        },
      });
      const { token } = await response.json();

      // حفظ التوكن في localStorage
      await page.goto(frontendUrl);
      await page.evaluate(
        (user) => {
          window.localStorage.setItem(
            "loggedBlogAppUser",
            JSON.stringify(user)
          );
        },
        { ...testUser, token }
      );

      await page.reload();
    });

    test("a new blog can be created", async ({ page }) => {
      await page.getByRole("button", { name: /create new blog/i }).click();

      await page
        .getByPlaceholder("Enter blog title")
        .fill("Playwright Testing Blog");
      await page.getByPlaceholder("Enter author name").fill("Test Author");
      await page.getByPlaceholder("Enter blog URL").fill("http://example.com");

      await page.getByRole("button", { name: /create/i }).click();

      await expect(page.getByText("Playwright Testing Blog")).toBeVisible();
      await expect(page.getByText("Test Author")).toBeVisible();
    });
  });
});
