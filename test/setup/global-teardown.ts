import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global test teardown...');
  
  // Clean up any global resources if needed
  // For now, just log completion
  
  console.log('✅ Global teardown completed');
}

export default globalTeardown;