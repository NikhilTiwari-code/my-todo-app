# Jest Testing Documentation

## 🎉 Test Results

### ✅ All 21 Tests Passing!

```
Test Suites: 1 passed, 1 total
Tests:       21 passed, 21 total
Time:        5.087 s

Route Coverage: 98.63% (src/app/api/todos/route.ts)
```

---

## 📊 Test Coverage Breakdown

### GET /api/todos (9 tests)
✅ Returns todos with default pagination  
✅ Handles pagination parameters (page, limit)  
✅ Filters by `isCompleted` status  
✅ Filters by `priority` (low/medium/high)  
✅ Searches in title/description  
✅ Handles sorting (sortBy, order)  
✅ Returns 401 for unauthenticated users  
✅ Handles database errors gracefully  
✅ Enforces maximum limit of 100  

### POST /api/todos (12 tests)
✅ Creates todo with valid data  
✅ Creates todo with dueDate  
✅ Returns 400 if title is missing  
✅ Returns 400 if title is empty string  
✅ Returns 400 if description is missing  
✅ Returns 400 if priority is invalid  
✅ Returns 400 if dueDate is invalid format  
✅ Returns 400 if dueDate is in the past  
✅ Returns 401 for unauthenticated users  
✅ Handles Mongoose validation errors  
✅ Handles database errors  
✅ Trims whitespace from title/description  

---

## 🚀 Running Tests

### Run all tests:
```bash
npm test
```

### Run tests in watch mode (auto-rerun on file changes):
```bash
npm run test:watch
```

### Run tests with coverage report:
```bash
npm run test:coverage
```

Coverage report will be generated in `coverage/` directory.  
Open `coverage/lcov-report/index.html` in browser for detailed view.

---

## 📁 Test Files Structure

```
src/
└── app/
    └── api/
        └── todos/
            ├── route.ts                    # Source file (GET, POST)
            └── __tests__/
                └── route.test.ts           # Test file (21 tests)
```

---

## 🔧 Test Configuration

### jest.config.js
- **Preset**: ts-jest (TypeScript support)
- **Environment**: node (API testing)
- **Module mapping**: `@/` → `src/` (alias support)
- **Coverage**: Collects from all `src/**/*.ts` files
- **Timeout**: 10 seconds per test

### jest.setup.js
Sets environment variables for tests:
```javascript
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test-db';
```

---

## 🧪 How Tests Work

### 1. **Mocking Dependencies**
Tests mock external dependencies to isolate route logic:

```typescript
// Mocked modules
jest.mock('@/utils/db');              // Database connection
jest.mock('@/models/todos.model');    // Todo model
jest.mock('@/utils/auth');            // Auth verification
jest.mock('next/server');             // NextResponse
```

### 2. **Test Structure**
```typescript
describe('GET /api/todos', () => {
  beforeEach(() => {
    jest.clearAllMocks();  // Clean state between tests
    // Setup default mocks
  });

  it('should return todos with default pagination', async () => {
    // Arrange: Setup mocks
    // Act: Call the route
    // Assert: Check response
  });
});
```

### 3. **Example Test**
```typescript
it('should return todos with default pagination', async () => {
  // Arrange
  const mockTodos = [
    { _id: '001', title: 'Test Todo', ... },
  ];
  (Todo.find as jest.Mock).mockReturnValue({
    select: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(mockTodos),
  });

  // Act
  const request = new Request('http://localhost:3000/api/todos');
  const response = await GET(request);
  const data = await response.json();

  // Assert
  expect(Todo.find).toHaveBeenCalledWith({ owner: mockUserId });
  expect(data.data).toEqual(mockTodos);
  expect(data.pagination.page).toBe(1);
});
```

---

## 📝 What Each Test Validates

### Authentication Tests
- ✅ Verifies `getUserIdFromRequest()` is called
- ✅ Returns 401 if auth fails
- ✅ Blocks database access without auth

### Input Validation Tests
- ✅ Required fields (title, description)
- ✅ Priority enum validation (low/medium/high)
- ✅ Date format validation
- ✅ Future date validation
- ✅ Whitespace trimming

### Business Logic Tests
- ✅ Filters work correctly
- ✅ Pagination calculates correctly
- ✅ Search queries build properly
- ✅ Sorting parameters applied
- ✅ Maximum limits enforced

### Error Handling Tests
- ✅ Database errors return 500
- ✅ Validation errors return 400
- ✅ Auth errors return 401
- ✅ Structured error responses

### Data Integrity Tests
- ✅ Response format consistency
- ✅ Version fields removed (`__v`)
- ✅ Owner field set correctly
- ✅ Timestamps included

---

## 🎯 Test Coverage Goals

| Category | Target | Current |
|----------|--------|---------|
| **Statements** | >90% | 98.63% ✅ |
| **Branches** | >85% | 98.14% ✅ |
| **Functions** | >90% | 100% ✅ |
| **Lines** | >90% | 98.52% ✅ |

**Status**: Excellent coverage! Only missed edge case is pagination edge scenarios.

---

## 🐛 Debugging Failed Tests

### Check test output:
```bash
npm test -- --verbose
```

### Run specific test file:
```bash
npm test -- route.test.ts
```

### Run specific test:
```bash
npm test -- -t "should return todos with default pagination"
```

### Check coverage for specific file:
```bash
npm test -- --coverage --collectCoverageFrom="src/app/api/todos/route.ts"
```

---

## 🔍 Common Test Patterns

### 1. Testing Query Parameters
```typescript
const request = new Request('http://localhost:3000/api/todos?page=2&limit=5');
await GET(request);

expect(mockFind.skip).toHaveBeenCalledWith(5);  // (2-1) * 5
expect(mockFind.limit).toHaveBeenCalledWith(5);
```

### 2. Testing Request Body
```typescript
const request = new Request('http://localhost:3000/api/todos', {
  method: 'POST',
  body: JSON.stringify({ title: 'Test', description: 'Desc' }),
});
```

### 3. Testing Error Responses
```typescript
const response = await POST(request);
const data = await response.json();

expect(response.status).toBe(400);
expect(data.error.code).toBe('VALIDATION_ERROR');
expect(data.error.message).toBe('Title is required');
```

### 4. Testing Database Interactions
```typescript
expect(Todo.find).toHaveBeenCalledWith({
  owner: mockUserId,
  isCompleted: true,
});
```

---

## 📚 Best Practices

### ✅ DO:
- Mock external dependencies (DB, auth, APIs)
- Test both success and error cases
- Test edge cases (empty strings, nulls, limits)
- Use descriptive test names
- Clean up mocks between tests (`beforeEach`)
- Test HTTP status codes
- Verify error message structure

### ❌ DON'T:
- Test implementation details
- Make real database calls in unit tests
- Skip error case testing
- Write tests that depend on execution order
- Mock too deeply (mock at boundaries)
- Test third-party library code

---

## 🚦 CI/CD Integration

Add to your CI pipeline:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3  # Upload coverage
```

---

## 📊 Coverage Report Location

After running `npm run test:coverage`:

```
coverage/
├── lcov-report/
│   └── index.html          # ← Open this in browser
├── coverage-final.json
└── lcov.info
```

**View detailed coverage:**
```bash
open coverage/lcov-report/index.html    # Mac/Linux
start coverage/lcov-report/index.html   # Windows
```

---

## 🎓 Next Steps

### Add more tests:
1. **Integration tests** - Test with real database (separate suite)
2. **Todo item routes** - Test GET/PUT/PATCH/DELETE by ID
3. **Auth routes** - Test login, register, logout
4. **E2E tests** - Test full user flows

### Improve coverage:
```bash
npm run test:coverage -- --coverageThreshold='{"global":{"statements":95}}'
```

---

## 💡 Tips

- **Run tests before commits**: Add to git pre-commit hook
- **Watch mode is your friend**: Use `npm run test:watch` during development
- **Read test failures carefully**: Stack traces show exact assertion failures
- **Update snapshots carefully**: Only when intentional changes made
- **Keep tests fast**: Unit tests should run in milliseconds

---

## 📞 Troubleshooting

### Tests timing out?
- Increase timeout in jest.config.js: `testTimeout: 20000`
- Or per test: `it('test', async () => {...}, 20000)`

### Mocks not working?
- Check mock path matches import path exactly
- Ensure `jest.clearAllMocks()` in `beforeEach`
- Use `jest.fn()` for function mocks

### Coverage not collected?
- Check `collectCoverageFrom` patterns in jest.config.js
- Ensure files are TypeScript (.ts)
- JSX coverage issues are normal (doesn't affect API route tests)

---

## ✅ Summary

You now have:
- ✅ **21 comprehensive tests** covering all scenarios
- ✅ **98.63% code coverage** on todos route
- ✅ **Jest configured** for TypeScript + Next.js
- ✅ **npm scripts** for running tests
- ✅ **Mocking strategy** for external dependencies
- ✅ **CI/CD ready** test setup

**All tests passing! Your todos API is well-tested and production-ready!** 🎉
