const { test, expect, beforeEach, describe } = require("@playwright/test");

describe("Blog app", () => {
  const apiUrl = "http://localhost:3003";
  const frontendUrl = "http://localhost:5173";

  const user = {
    name: "Order Tester",
    username: "orderuser",
    password: "secret",
  };

  beforeEach(async ({ page, request }) => {
    await request.post(`${apiUrl}/api/testing/reset`);
    await request.post(`${apiUrl}/api/users`, { data: user });

    // تسجيل الدخول وحفظ التوكن
    const loginRes = await request.post(`${apiUrl}/api/login`, {
      data: {
        username: user.username,
        password: user.password,
      },
    });

    const { token } = await loginRes.json();

    // إنشاء مدونات بثلاث قيم إعجاب مختلفة
    const blogs = [
      {
        title: "Blog with 5 likes",
        author: "Author A",
        url: "http://a.com",
        likes: 5,
      },
      {
        title: "Blog with 15 likes",
        author: "Author B",
        url: "http://b.com",
        likes: 15,
      },
      {
        title: "Blog with 10 likes",
        author: "Author C",
        url: "http://c.com",
        likes: 10,
      },
    ];

    for (const blog of blogs) {
      await request.post(`${apiUrl}/api/blogs`, {
        data: blog,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    // حفظ المستخدم في localStorage
    await page.goto(frontendUrl);
    await page.evaluate(
      (user) => {
        window.localStorage.setItem("loggedBlogAppUser", JSON.stringify(user));
      },
      { ...user, token }
    );

    await page.reload();
  });

  test("blogs are ordered by number of likes (descending)", async ({
    page,
  }) => {
    // عرض تفاصيل كل مدونة
    const viewButtons = await page.getByRole("button", { name: "view" }).all();
    for (const btn of viewButtons) {
      await btn.click();
    }

    // تحديد كل عناصر المدونات
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
