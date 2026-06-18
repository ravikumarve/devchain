# DevChain Testing Guide

## Overview

This guide provides comprehensive testing instructions for DevChain, covering unit tests, integration tests, and end-to-end testing.

## Prerequisites

- Node.js 20+ installed
- PostgreSQL database running
- Stripe test account configured
- All dependencies installed (`npm run install:all`)

## Environment Setup

### 1. Configure Test Environment

```bash
# Copy test environment template
cp backend/.env.example backend/.env.test

# Update with test credentials
# - Use test database URL
# - Use Stripe test keys
# - Use test Supabase bucket
```

### 2. Database Setup for Testing

```bash
cd backend

# Create test database
createdb devchain_test

# Run migrations on test database
DATABASE_URL="postgresql://user:pass@localhost/devchain_test" npx prisma migrate deploy

# Seed test data
node seed-products.js
```

## Backend Testing

### Unit Tests

```bash
cd backend
npm test
```

**Test Coverage Areas:**
- Authentication controllers
- Payment processing
- File upload/download
- Product management
- Order processing
- Ownership verification

### Integration Tests

```bash
# Test API endpoints
npm run test:integration
```

**Key Test Scenarios:**
- User registration and login
- Product creation and retrieval
- Payment flow with Stripe
- File upload and download
- Webhook handling
- Error scenarios

### Manual API Testing

```bash
# Start backend server
npm start

# Test health endpoint
curl http://localhost:10000/health

# Test authentication
curl -X POST http://localhost:10000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"testpass123"}'

# Test product creation (requires auth token)
curl -X POST http://localhost:10000/api/v1/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Product","description":"Test description","price":9.99,"category":"test","tags":["test"]}'
```

## Frontend Testing

### Unit Tests

```bash
cd apps/web
npm test
```

**Test Coverage Areas:**
- Component rendering
- User interactions
- Form validation
- API integration
- State management
- Error handling

### Integration Tests

```bash
# Test user flows
npm run test:integration
```

**Key Test Scenarios:**
- User registration flow
- Login/logout flow
- Product browsing
- Purchase flow
- File download
- Dashboard navigation

### Manual Browser Testing

```bash
# Start web app
cd apps/web
npm run dev

# Open http://localhost:5173
# Test the following flows:
```

#### Test Flow 1: User Registration
1. Navigate to `/register`
2. Fill in registration form
3. Submit form
4. Verify redirect to login
5. Attempt login with new credentials

#### Test Flow 2: Product Browsing
1. Navigate to `/marketplace`
2. Browse product listings
3. Test filtering by category
4. Test search functionality
5. Click on product details

#### Test Flow 3: Purchase Flow
1. Login as test user
2. Navigate to product detail page
3. Click "Buy Now" button
4. Complete Stripe checkout (test mode)
5. Verify redirect to success page
6. Check ownership certificate

#### Test Flow 4: File Download
1. Navigate to purchased product
2. Click download button
3. Verify file download starts
4. Check file integrity

## End-to-End Testing

### Complete Purchase Flow

```bash
# 1. Start all services
npm start                    # Backend
cd apps/web && npm run dev   # Frontend

# 2. Open browser to http://localhost:5173

# 3. Execute test scenario:
#    a. Register new user
#    b. Browse products
#    c. Purchase product with Stripe test card
#    d. Verify ownership certificate
#    e. Download purchased file
#    f. Check dashboard for purchase history
```

### Stripe Test Mode

**Test Card Numbers:**
- Success: `4242 4242 4242 4242`
- Requires authentication: `4000 0025 0000 3155`
- Card declined: `4000 0000 0000 9995`
- Insufficient funds: `4000 0025 0000 3155`

**Test Flow:**
1. Use Stripe test keys in `.env`
2. Complete purchase with test card
3. Verify webhook events received
4. Check order status in database
5. Verify ownership record created

### Error Scenario Testing

#### Test Failed Payments
1. Start purchase flow
2. Use declined card (`4000 0000 0000 9995`)
3. Verify error message displayed
4. Check order status is "failed"
5. Verify no ownership record created

#### Test Canceled Sessions
1. Start purchase flow
2. Cancel on Stripe checkout page
3. Verify redirect to cancel page
4. Check order status is "canceled"
5. Verify no ownership record created

#### Test Webhook Failures
1. Simulate webhook failure
2. Verify error logging
3. Check retry mechanism
4. Verify data consistency

## Performance Testing

### Load Testing

```bash
# Install artillery
npm install -g artillery

# Run load test
artillery run tests/load-test.yml
```

**Key Metrics:**
- Response time < 200ms (p95)
- Error rate < 1%
- Throughput > 100 req/s

### Database Performance

```bash
# Check query performance
cd backend
npx prisma studio

# Analyze slow queries
# Add indexes where needed
# Optimize N+1 queries
```

## Security Testing

### Authentication Testing

```bash
# Test protected endpoints without auth
curl http://localhost:10000/api/v1/products/seller/me
# Expected: 401 Unauthorized

# Test with invalid token
curl -H "Authorization: Bearer invalid" \
  http://localhost:10000/api/v1/products/seller/me
# Expected: 401 Unauthorized
```

### Authorization Testing

```bash
# Test accessing other user's data
curl -H "Authorization: Bearer USER_A_TOKEN" \
  http://localhost:10000/api/v1/products/USER_B_PRODUCT_ID
# Expected: 403 Forbidden

# Test download without purchase
curl -H "Authorization: Bearer USER_TOKEN" \
  http://localhost:10000/api/v1/uploads/product/PRODUCT_ID/download
# Expected: 403 Forbidden
```

### Input Validation Testing

```bash
# Test SQL injection attempts
curl -X POST http://localhost:10000/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{"title":"<script>alert(1)</script>","price":"-100"}'
# Expected: 400 Bad Request

# Test XSS attempts
curl -X POST http://localhost:10000/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{"title":"<img src=x onerror=alert(1)>","description":"test"}'
# Expected: 400 Bad Request or sanitized input
```

## Automated Testing

### CI/CD Pipeline

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm run install:all
      - name: Run tests
        run: npm test
      - name: Run lint
        run: npm run lint
```

### Test Coverage

```bash
# Generate coverage report
npm test -- --coverage

# View coverage report
open coverage/lcov-report/index.html
```

**Target Coverage:**
- Statements: > 80%
- Branches: > 75%
- Functions: > 80%
- Lines: > 80%

## Troubleshooting

### Common Issues

**Database Connection Errors:**
```bash
# Check database is running
pg_isready

# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL
```

**Stripe Webhook Issues:**
```bash
# Verify webhook secret
echo $STRIPE_WEBHOOK_SECRET

# Test webhook endpoint
curl -X POST http://localhost:10000/api/v1/payments/webhook \
  -H "stripe-signature: TEST_SIGNATURE" \
  -d '{"type":"test","data":{}}'
```

**File Upload Issues:**
```bash
# Check Supabase credentials
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_KEY

# Test bucket access
# Use Supabase dashboard to verify permissions
```

## Test Data Management

### Reset Test Database

```bash
# Drop and recreate test database
dropdb devchain_test
createdb devchain_test

# Run migrations
cd backend
DATABASE_URL="postgresql://user:pass@localhost/devchain_test" npx prisma migrate deploy

# Seed test data
node seed-products.js
```

### Clean Test Data

```bash
# Clear all test data
cd backend
npx prisma migrate reset

# Reseed with fresh data
node seed-products.js
```

## Continuous Testing

### Watch Mode

```bash
# Run tests in watch mode
npm test -- --watch

# Run lint in watch mode
npm run lint -- --watch
```

### Pre-commit Hooks

```bash
# Install husky
npm install husky --save-dev

# Setup pre-commit hook
npx husky install
npx husky add .husky/pre-commit "npm run lint && npm test"
```

## Reporting Test Results

### Test Report Format

```markdown
## Test Results - [Date]

### Summary
- Total Tests: 150
- Passed: 145
- Failed: 5
- Skipped: 0
- Coverage: 82%

### Failed Tests
1. `test_purchase_flow` - Stripe webhook timeout
2. `test_file_download` - Supabase permission error
3. `test_user_registration` - Email validation issue
4. `test_product_search` - Search index not updated
5. `test_analytics_dashboard` - Data aggregation error

### Recommendations
- Fix Stripe webhook retry logic
- Update Supabase bucket permissions
- Improve email validation regex
- Implement search index updates
- Optimize dashboard queries
```

## Best Practices

1. **Write Tests First**: TDD approach for new features
2. **Keep Tests Independent**: Each test should run in isolation
3. **Use Descriptive Names**: Test names should explain what they test
4. **Mock External Services**: Don't rely on real Stripe/Supabase in unit tests
5. **Test Edge Cases**: Don't just test happy paths
6. **Maintain Test Data**: Keep test data consistent and predictable
7. **Run Tests Frequently**: Integrate with CI/CD pipeline
8. **Review Coverage**: Aim for high but realistic coverage

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Stripe Test Mode](https://stripe.com/docs/testing)
- [Supabase Testing](https://supabase.com/docs/guides/tests)
- [Prisma Testing](https://www.prisma.io/docs/guides/testing)

---

**Last Updated**: April 22, 2026
**Maintained By**: DevChain Team
