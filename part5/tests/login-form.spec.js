const { test, expect, beforeEach, describe } = require("@playwright/test");

describe("Blog app", () => {
  const apiUrl = "http://localhost:3003";
  const frontendUrl = "http://localhost:5173";

  const userA = {
    name: "User A",
    username: "usera",
    password: "passwordA",
  };

  const userB = {
    name: "User B",
    username: "userb",
    password: "passwordB",
  };

  beforeEach(async ({ page, request }) => {
    await request.post(`${apiUrl}/api/testing/reset`);
    await request.post(`${apiUrl}/api/users`, { data: userA });
    await request.post(`${apiUrl}/api/users`, { data: userB });
  });

  test("only the user who created a blog sees the delete button", async ({
    page,
    request,
  }) => {
    // 1. تسجيل الدخول كمستخدم A وإنشاء مدونة
    const loginResA = await request.post(`${apiUrl}/api/login`, {
      data: {
        username: userA.username,
        password: userA.password,
      },
    });
    const { token: tokenA } = await loginResA.json();

    await page.goto(frontendUrl);
    await page.evaluate(
      (user) => {
        window.localStorage.setItem("loggedBlogAppUser", JSON.stringify(user));
      },
      { ...userA, token: tokenA }
    );

    await page.reload();
    await page.getByRole("button", { name: /create new blog/i }).click();
    await page.getByPlaceholder("Enter blog title").fill("Private Blog");
    await page.getByPlaceholder("Enter author name").fill("Author A");
    await page.getByPlaceholder("Enter blog URL").fill("http://private.com");
    await page.getByRole("button", { name: /create/i }).click();
    await expect(page.getByText("Private Blog")).toBeVisible();

    // تحقق أن الزر موجود للمستخدم A
    await page.getByRole("button", { name: "view" }).click();
    await expect(page.getByRole("button", { name: "remove" })).toBeVisible();

    // 2. تسجيل الخروج ثم تسجيل الدخول كمستخدم B
    await page.getByRole("button", { name: /log out/i }).click();

    const loginResB = await request.post(`${apiUrl}/api/login`, {
      data: {
        username: userB.username,
        password: userB.password,
      },
    });
    const { token: tokenB } = await loginResB.json();

    await page.evaluate(() => {
      window.localStorage.clear();
    });

    await page.evaluate(
      (user) => {
        window.localStorage.setItem("loggedBlogAppUser", JSON.stringify(user));
      },
      { ...userB, token: tokenB }
    );

    await page.reload();

    // تحقق أن زر الحذف غير ظاهر للمستخدم B
    await page.getByRole("button", { name: "view" }).click();
    const removeButtons = await page
      .locator("button", { hasText: "remove" })
      .count();
    expect(removeButtons).toBe(0);
  });
});
