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

      // Create blog to delete
      await page.getByRole("button", { name: /create new blog/i }).click();
      await page.getByPlaceholder("Enter blog title").fill("Deletable Blog");
      await page.getByPlaceholder("Enter author name").fill("Author B");
      await page.getByPlaceholder("Enter blog URL").fill("http://delete.com");
      await page.getByRole("button", { name: /create/i }).click();
      await expect(page.getByText("Deletable Blog")).toBeVisible();
    });

    test("creator can delete their blog", async ({ page }) => {
      await page.getByRole("button", { name: "view" }).click();

      // التعامل مع نافذة التأكيد
      page.once("dialog", (dialog) => dialog.accept());

      await page.getByRole("button", { name: "remove" }).click();

      // تحقق أن المدونة لم تعد تظهر
      await expect(page.getByText("Deletable Blog")).not.toBeVisible();
    });
  });
});
