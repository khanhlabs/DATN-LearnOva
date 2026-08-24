import { expect, test } from '@playwright/test'

test('anonymous user sees the login screen and can switch to registration', async ({ page }) => {
  await page.goto('/learnova/auth/login')

  await expect(page.locator('.login-panel input[name="email"]')).toBeVisible()
  await expect(page.locator('.login-panel input[name="password"]')).toBeVisible()

  await page.locator('.login-panel .auth-switch-button').click()
  await expect(page).toHaveURL(/mode=register/)
  await expect(page.locator('.register-panel input[name="fullName"]')).toBeVisible()
  await expect(page.locator('.register-panel input[name="confirmPassword"]')).toBeVisible()
})

test('anonymous user is redirected from a protected profile route to login', async ({ page }) => {
  await page.goto('/learnova/user/profile')
  await expect(page).toHaveURL(/\/learnova\/auth\/login/)
  await expect(page.locator('.login-panel input[name="email"]')).toBeVisible()
})
