// tests/blog_app.spec.js

const { test, expect, beforeEach, describe } = require("@playwright/test");

const apiUrl = "http://localhost:3003";
const frontendUrl = "http://localhost:5173";

const user = {
  name: "Test User",
  username: "testuser",
  password: "password",
};

test.describe("Blog app", () => {
  test.beforeEach(async ({ page, request }) => {
    // إعادة تعيين قاعدة البيانات
    await request.post(`${apiUrl}/api/testing/reset`);

    // إنشاء مستخدم
    await request.post(`${apiUrl}/api/users`, { data: user });

    // الانتقال إلى الواجهة الأمامية
    await page.goto(frontendUrl);
  });

  test("Login form is shown", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "blogs" })).toBeVisible();
    await expect(page.getByPlaceholder("Username")).toBeVisible();
    await expect(page.getByPlaceholder("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "login" })).toBeVisible();
  });

  test.describe("Login", () => {
    test("succeeds with correct credentials", async ({ page }) => {
      await page.getByPlaceholder("Username").fill(user.username);
      await page.getByPlaceholder("Password").fill(user.password);
      await page.getByRole("button", { name: "login" }).click();

      await expect(page.getByText(`${user.name} logged-in`)).toBeVisible();
    });

    test("fails with wrong credentials", async ({ page }) => {
      await page.getByPlaceholder("Username").fill(user.username);
      await page.getByPlaceholder("Password").fill("wrongpassword");
      await page.getByRole("button", { name: "login" }).click();

      await expect(
        page.getByText("Invalid username or password")
      ).toBeVisible();
    });
  });

  test.describe("When logged in", () => {
    test.beforeEach(async ({ page, request }) => {
      // تسجيل الدخول عبر API
      const response = await request.post(`${apiUrl}/api/login`, {
        data: {
          username: user.username,
          password: user.password,
        },
      });
      const { token } = await response.json();

      // تخزين معلومات المستخدم في localStorage
      await page.goto(frontendUrl);
      await page.evaluate(
        ({ token, user }) => {
          window.localStorage.setItem(
            "loggedBlogAppUser",
            JSON.stringify({ token, name: user.name, username: user.username })
          );
        },
        { token, user }
      );

      await page.reload();
    });

    test("a new blog can be created", async ({ page }) => {
      await page.getByRole("button", { name: "create new blog" }).click();
      await page.getByPlaceholder("Title").fill("New Blog");
      await page.getByPlaceholder("Author").fill("Author Name");
      await page.getByPlaceholder("URL").fill("http://example.com");
      await page.getByRole("button", { name: "create" }).click();

      await expect(page.getByText("New Blog Author Name")).toBeVisible();
    });

    test("a blog can be liked", async ({ page, request }) => {
      // إنشاء مدونة عبر API
      const loginResponse = await request.post(`${apiUrl}/api/login`, {
        data: {
          username: user.username,
          password: user.password,
        },
      });
      const { token } = await loginResponse.json();

      await request.post(`${apiUrl}/api/blogs`, {
        data: {
          title: "Likeable Blog",
          author: "Author",
          url: "http://example.com",
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await page.reload();
      await page.getByRole("button", { name: "view" }).click();
      const likeButton = page.getByRole("button", { name: "like" });
      await likeButton.click();

      await expect(page.getByText("likes: 1")).toBeVisible();
    });

    test("a blog can be deleted by the user who created it", async ({
      page,
      request,
    }) => {
      // إنشاء مدونة عبر API
      const loginResponse = await request.post(`${apiUrl}/api/login`, {
        data: {
          username: user.username,
          password: user.password,
        },
      });
      const { token } = await loginResponse.json();

      await request.post(`${apiUrl}/api/blogs`, {
        data: {
          title: "Deletable Blog",
          author: "Author",
          url: "http://example.com",
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await page.reload();
      await page.getByRole("button", { name: "view" }).click();

      // التعامل مع نافذة التأكيد
      page.on("dialog", async (dialog) => {
        await dialog.accept();
      });

      await page.getByRole("button", { name: "remove" }).click();
      await expect(page.getByText("Deletable Blog Author")).not.toBeVisible();
    });

    test("only the creator sees the delete button", async ({
      page,
      request,
      browser,
    }) => {
      // إنشاء مدونة عبر API
      const loginResponse = await request.post(`${apiUrl}/api/login`, {
        data: {
          username: user.username,
          password: user.password,
        },
      });
      const { token } = await loginResponse.json();

      await request.post(`${apiUrl}/api/blogs`, {
        data: {
          title: "Private Blog",
          author: "Author",
          url: "http://example.com",
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // تسجيل الخروج
      await page.evaluate(() => {
        window.localStorage.removeItem("loggedBlogAppUser");
      });

      // إنشاء مستخدم جديد
      const newUser = {
        name: "Another User",
        username: "anotheruser",
        password: "password",
      };
      await request.post(`${apiUrl}/api/users`, { data: newUser });

      // تسجيل الدخول بالمستخدم الجديد
      const newLoginResponse = await request.post(`${apiUrl}/api/login`, {
        data: {
          username: newUser.username,
          password: newUser.password,
        },
      });
      const { token: newToken } = await newLoginResponse.json();

      await page.evaluate(
        ({ token, user }) => {
          window.localStorage.setItem(
            "loggedBlogAppUser",
            JSON.stringify({ token, name: user.name, username: user.username })
          );
        },
        { token: newToken, user: newUser }
      );

      await page.reload();
      await page.getByRole("button", { name: "view" }).click();

      await expect(
        page.getByRole("button", { name: "remove" })
      ).not.toBeVisible();
    });

    test("blogs are ordered by likes in descending order", async ({
      page,
      request,
    }) => {
      // تسجيل الدخول عبر API
      const loginResponse = await request.post(`${apiUrl}/api/login`, {
        data: {
          username: user.username,
          password: user.password,
        },
      });
      const { token } = await loginResponse.json();

      // إنشاء مدونات بإعجابات مختلفة
      const blogs = [
        { title: "Blog A", author: "Author A", url: "http://a.com", likes: 5 },
        { title: "Blog B", author: "Author B", url: "http://b.com", likes: 15 },
        { title: "Blog C", author: "Author C", url: "http://c.com", likes: 10 },
      ];

      for (const blog of blogs) {
        await request.post(`${apiUrl}/api/blogs`, {
          data: blog,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      await page.reload();

      const viewButtons = await page
        .getByRole("button", { name: "view" })
        .all();
      for (const btn of viewButtons) {
        await btn.click();
      }

      const blogElements = await page.locator(".blog").all();
      const likesArray = [];

      for (const blogElement of blogElements) {
        const likeText = await blogElement.locator(".likes").innerText();
        const match = likeText.match(/likes:\s*(\d+)/i);
        if (match) {
          likesArray.push(Number(match[1]));
        }
      }

      const sortedLikes = [...likesArray].sort((a, b) => b - a);
      expect(likesArray).toEqual(sortedLikes);
    });
  });
});
