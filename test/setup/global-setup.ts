import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...');
  
  // Wait for services to be ready
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Wait for web server
    console.log('⏳ Waiting for web server...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    console.log('✅ Web server is ready');
    
    // Wait for API server
    console.log('⏳ Waiting for API server...');
    const response = await page.request.get('http://localhost:4000/api/v1/healthz');
    if (!response.ok()) {
      throw new Error('API server is not ready');
    }
    console.log('✅ API server is ready');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
  
  console.log('✅ Global setup completed');
}

export default globalSetup;