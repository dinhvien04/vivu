# Vivu Test Suite

Comprehensive test suite cho dự án Vivu bao gồm unit tests, integration tests và end-to-end tests.

## Cấu trúc thư mục

```
test/
├── api/                    # Unit tests cho API (NestJS)
│   ├── *.controller.test.ts
│   ├── *.service.test.ts
│   └── dto/
├── web/                    # Unit tests cho Web (Next.js)
│   ├── pages/
│   └── *.test.tsx
├── integration/            # Integration tests
│   └── *.integration.test.ts
├── e2e/                   # End-to-end tests (Playwright)
│   └── *.e2e.test.ts
├── types/                 # Tests cho shared types
│   └── types.test.ts
└── setup/                 # Test configuration
    ├── jest.config.js
    ├── jest.setup.ts
    ├── playwright.config.ts
    └── global-*.ts
```

## Loại tests

### 1. Unit Tests (Jest)

**API Tests:**
- Controllers: Test HTTP endpoints, validation, error handling
- Services: Test business logic, data transformation
- DTOs: Test validation rules, type transformation
- Utilities: Test helper functions, security headers

**Web Tests:**
- Components: Test rendering, user interactions
- Pages: Test page structure, navigation
- API Client: Test HTTP requests, error handling
- Layout: Test responsive design, accessibility

### 2. Integration Tests (Jest + Supertest)

- Test toàn bộ API flow từ HTTP request đến response
- Test database interactions (khi có)
- Test middleware, guards, interceptors
- Test CORS, security headers, rate limiting

### 3. End-to-End Tests (Playwright)

- Test user journeys hoàn chỉnh
- Test cross-browser compatibility
- Test responsive design trên mobile/desktop
- Test performance, accessibility
- Test API endpoints từ external perspective

## Chạy tests

### Tất cả tests
```bash
pnpm test:all
```

### Unit tests
```bash
# Tất cả unit tests
pnpm test

# Chỉ API tests
pnpm test:api

# Chỉ Web tests  
pnpm test:web

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage
```

### Integration tests
```bash
pnpm test:integration
```

### E2E tests
```bash
# Headless mode
pnpm test:e2e

# Headed mode (xem browser)
pnpm test:e2e:headed

# UI mode (interactive)
pnpm test:e2e:ui
```

## Test Coverage

Mục tiêu coverage:
- **Unit tests**: ≥ 80% cho business logic
- **Integration tests**: Cover tất cả API endpoints
- **E2E tests**: Cover các user journey chính

### Xem coverage report
```bash
pnpm test:coverage
open coverage/lcov-report/index.html
```

## Quy ước viết test

### 1. Naming Convention

```typescript
// File names
*.test.ts        // Unit tests
*.integration.test.ts  // Integration tests  
*.e2e.test.ts    // E2E tests

// Test descriptions
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should do something when condition', () => {
      // test implementation
    });
  });
});
```

### 2. Test Structure (AAA Pattern)

```typescript
it('should return user when valid ID provided', () => {
  // Arrange
  const userId = 'user_123';
  const expectedUser = { id: userId, name: 'John' };
  
  // Act
  const result = userService.findById(userId);
  
  // Assert
  expect(result).toEqual(expectedUser);
});
```

### 3. Mock Strategy

- **Unit tests**: Mock external dependencies
- **Integration tests**: Mock external services, use real DB
- **E2E tests**: Minimal mocking, test real system

### 4. Test Data

- Sử dụng factory functions cho test data
- Tránh hardcode values, dùng constants
- Clean up test data sau mỗi test

## CI/CD Integration

### GitHub Actions

Tests chạy tự động trên:
- Pull requests
- Push to main branch
- Nightly builds

### Test Reports

- Jest coverage: `coverage/lcov-report/`
- Playwright reports: `test-results/`
- JUnit XML cho CI: `test-results/results.xml`

## Debugging Tests

### Jest Tests
```bash
# Debug specific test
node --inspect-brk node_modules/.bin/jest --runInBand specific.test.ts

# VS Code: Add breakpoint và chạy "Debug Jest Tests"
```

### Playwright Tests
```bash
# Debug mode
pnpm test:e2e --debug

# Trace viewer
npx playwright show-trace trace.zip
```

## Performance Testing

### Load Testing (k6)
```bash
# Sẽ thêm sau khi có staging environment
k6 run scripts/load-test.js
```

### Lighthouse CI
```bash
# Performance audit
lhci autorun
```

## Accessibility Testing

### Automated A11y Tests
- axe-core integration trong Playwright
- WCAG 2.1 AA compliance checking
- Color contrast validation

### Manual Testing Checklist
- [ ] Keyboard navigation
- [ ] Screen reader compatibility  
- [ ] Focus management
- [ ] ARIA labels

## Troubleshooting

### Common Issues

1. **Tests timeout**: Tăng timeout trong config
2. **Flaky tests**: Thêm proper waits, stable selectors
3. **Memory leaks**: Đảm bảo cleanup trong afterEach
4. **Port conflicts**: Check services running trên ports 3000/4000

### Debug Commands
```bash
# Check running processes
lsof -i :3000
lsof -i :4000

# Clear Jest cache
jest --clearCache

# Reset Playwright browsers
npx playwright install
```

## Contributing

1. Viết tests cho mọi feature mới
2. Maintain coverage threshold
3. Update tests khi thay đổi API
4. Review test failures trong CI
5. Document test scenarios phức tạp

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/)
- [Playwright Documentation](https://playwright.dev/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)