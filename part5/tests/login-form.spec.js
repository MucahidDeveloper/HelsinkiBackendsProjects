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
    await request.post(`${apiUrl}/api/testing/reset`);
    await request.post(`${apiUrl}/api/users`, { data: testUser });
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
      await page.getByPlaceholder("Password").fill("wrong");
      await page.getByRole("button", { name: "login" }).click();
      const errorDiv = page.locator(".error");
      await expect(errorDiv).toContainText("Invalid username or password");
      await expect(
        page.getByText(`${testUser.name} logged-in`)
      ).not.toBeVisible();
    });
  });

  describe("When logged in", () => {
    beforeEach(async ({ page, request }) => {
      const res = await request.post(`${apiUrl}/api/login`, {
        data: {
          username: testUser.username,
          password: testUser.password,
        },
      });
      const { token } = await res.json();

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

      // Create blog for the like test
      await page.getByRole("button", { name: /create new blog/i }).click();
      await page.getByPlaceholder("Enter blog title").fill("Like Test Blog");
      await page.getByPlaceholder("Enter author name").fill("Author A");
      await page.getByPlaceholder("Enter blog URL").fill("http://example.com");
      await page.getByRole("button", { name: /create/i }).click();
      await expect(page.getByText("Like Test Blog")).toBeVisible();
    });

    test("a new blog can be created", async ({ page }) => {
      await expect(page.getByText("Like Test Blog")).toBeVisible();
    });

    test("a blog can be liked", async ({ page }) => {
      // اضغط على زر view لإظهار تفاصيل المدونة
      await page.getByRole("button", { name: "view" }).click();

      // تحقق من أن عدد الإعجابات الابتدائي موجود
      const likesText = page.getByText(/likes/i);
      await expect(likesText).toContainText("0");

      // اضغط على زر like
      await page.getByRole("button", { name: "like" }).click();

      // تحقق من زيادة عدد الإعجابات إلى 1
      await expect(page.getByText(/likes 1/i)).toBeVisible();
    });
  });
});
