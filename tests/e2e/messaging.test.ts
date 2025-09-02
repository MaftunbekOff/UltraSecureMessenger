
import { test, expect } from '@playwright/test';

test.describe('Messaging Flow', () => {
  test('should send and receive messages', async ({ page, context }) => {
    // Login
    await page.goto('/');
    await page.click('[data-testid="button-login"]');
    
    // Wait for authentication
    await page.waitForSelector('[data-testid="chat-sidebar"]');
    
    // Start new chat
    await page.click('[data-testid="button-new-chat"]');
    await page.fill('[data-testid="input-search-users"]', 'test@example.com');
    await page.click('[data-testid="user-search-result"]:first-child');
    
    // Send message
    const messageText = 'Hello, this is a test message!';
    await page.fill('[data-testid="input-message"]', messageText);
    await page.click('[data-testid="button-send-message"]');
    
    // Verify message appears
    await expect(page.locator('[data-testid="message-bubble"]').last()).toContainText(messageText);
  });

  test('should handle file uploads', async ({ page }) => {
    await page.goto('/chat/test-chat');
    
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/test-image.jpg');
    
    // Verify file message appears
    await expect(page.locator('[data-testid="file-message"]')).toBeVisible();
  });
});
