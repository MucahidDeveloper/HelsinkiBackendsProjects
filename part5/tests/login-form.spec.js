const { test, expect, beforeEach, describe } = require("@playwright/test");

describe("Blog app", () => {
  const apiUrl = "http://localhost:3003";

  beforeEach(async ({ page, request }) => {
    // Reset database
    await request.post(`${apiUrl}/api/testing/reset`);

    // Create test user
    const user = {
      name: "Test User",
      username: "testuser",
      password: "password123",
    };

    await request.post(`${apiUrl}/api/users`, {
      data: user,
    });

    // Navigate to frontend
    await page.goto("http://localhost:5173");
  });

  test("Login form is shown", async ({ page }) => {
    await expect(page.getByPlaceholder("Username")).toBeVisible();
    await expect(page.getByPlaceholder("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: /login/i })).toBeVisible();
  });

  describe("Login", () => {
    test("succeeds with correct credentials", async ({ page }) => {
      await page.getByPlaceholder("Username").fill("testuser");
      await page.getByPlaceholder("Password").fill("password123");
      await page.getByRole("button", { name: /login/i }).click();

      await expect(page.getByText("Test User logged in")).toBeVisible();
    });

    test("fails with wrong credentials", async ({ page }) => {
      await page.getByPlaceholder("Username").fill("testuser");
      await page.getByPlaceholder("Password").fill("wrongpassword");
      await page.getByRole("button", { name: /login/i }).click();

      await expect(
        page.getByText(/invalid username or password/i)
      ).toBeVisible();
      await expect(page.getByText("Test User logged in")).not.toBeVisible();
    });
  });
});
