import { expect, test } from "@playwright/test";

test("changing rulesets preserves setup and Rules preserves the started board", async ({ page }) => {
  await page.goto("/");
  await page.locator("#vs-computer").click();
  await page.locator("#ruleset-select").selectOption("british");
  await page.locator("#ruleset-select").selectOption("international");

  await expect(page.locator("#start-computer")).toBeVisible();
  await page.locator("#start-computer").click();
  await expect(page.locator("#game > .square")).toHaveCount(100);
  await expect(page.locator("#game > .square .piece")).toHaveCount(40);

  await page.evaluate(() => {
    document.dispatchEvent(new CustomEvent("checkers:move", {
      detail: {
        from: 44,
        to: 55,
        captures: [1],
        pendingCaptures: [1]
      }
    }));
  });
  await expect(page.locator(".last-captured-ghost")).toHaveCount(0);
  await page.evaluate(() => {
    document.dispatchEvent(new CustomEvent("checkers:move", {
      detail: { from: 44, to: 55, captures: [1], pendingCaptures: [] }
    }));
  });
  await expect(page.locator(".last-captured-ghost")).toHaveCount(1);

  await page.locator(".menu-hidden").click();
  await page.locator("#rules").click();
  await expect(page.locator("#menu")).toContainText("International draughts");
  await expect(page.locator("#game > .square")).toHaveCount(100);
  await expect(page.locator("#game > .square .piece")).toHaveCount(40);
});
