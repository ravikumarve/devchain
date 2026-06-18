# Contributing to DevChain

Thank you for your interest in contributing to DevChain! This document provides guidelines and instructions for contributing to the project.

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+ and npm
- **PostgreSQL** database (or use the provided Render database)
- **Git** for version control
- **Supabase** account (for file storage)

### Development Setup

1. **Fork and Clone the Repository**

   ```bash
   # Fork the repository on GitHub
   git clone https://github.com/your-username/devchain.git
   cd devchain
   ```

2. **Install Dependencies**

   ```bash
   # Install all workspace dependencies
   npm run install:all
   ```

3. **Set Up Environment Variables**

   ```bash
   # Copy environment templates
   cp .env.example .env
   cp backend/.env.example backend/.env
   ```

   Edit the `.env` files with your configuration:
   - Database connection string
   - JWT secrets
   - Supabase credentials
   - Stripe API keys (for payment testing)

4. **Set Up the Database**

   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Start Development Servers**

   ```bash
   # Terminal 1: Backend API
   npm start

   # Terminal 2: Web App
   cd apps/web
   npm run dev

   # Terminal 3: Mobile App (optional)
   cd apps/mobile
   npm run start
   ```

## 📋 Development Workflow

### Branch Naming

Use descriptive branch names following these patterns:

- `feature/` - New features
  - `feature/user-profile-page`
  - `feature/stripe-webhook-handling`
- `bugfix/` - Bug fixes
  - `bugfix/payment-webhook-timeout`
- `refactor/` - Code refactoring
  - `refactor/auth-middleware`
- `docs/` - Documentation updates
  - `docs/api-endpoints`
- `test/` - Test additions/updates
  - `test/payment-flow-e2e`

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```bash
feat(auth): add refresh token rotation
fix(payments): handle Stripe webhook timeout errors
docs(readme): update installation instructions
refactor(api): extract user service from controller
test(products): add e2e tests for purchase flow
```

### Pull Request Process

1. **Update Your Branch**

   ```bash
   git checkout main
   git pull origin main
   git checkout your-branch
   git rebase main
   ```

2. **Run Tests and Linting**

   ```bash
   # Backend
   cd backend
   npm run lint
   npm test

   # Web App
   cd apps/web
   npm run lint
   npm test
   ```

3. **Create Pull Request**

   - Use a clear title describing the change
   - Reference related issues (e.g., `Fixes #123`)
   - Include screenshots for UI changes
   - Describe testing performed

4. **PR Template**

   ```markdown
   ## Description
   Brief description of changes made.

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] Unit tests pass
   - [ ] Integration tests pass
   - [ ] Manual testing performed

   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Comments added for complex code
   - [ ] Documentation updated
   - [ ] No new warnings generated
   ```

## 🏗️ Project Structure

```
devchain/
├── apps/
│   ├── web/              # React web application
│   │   ├── src/
│   │   │   ├── components/    # Reusable components
│   │   │   ├── pages/        # Page components
│   │   │   ├── services/     # API services
│   │   │   ├── store/         # State management
│   │   │   └── utils/        # Utility functions
│   │   └── public/           # Static assets
│   └── mobile/           # React Native mobile app
├── backend/              # Node.js API server
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Express middleware
│   │   ├── services/     # Business logic
│   │   └── utils/        # Helper functions
│   └── prisma/           # Database schema
├── packages/
│   └── shared/           # Shared TypeScript types
└── docs/                 # Documentation
```

## 🎯 Code Style Guidelines

### Backend (Node.js + CommonJS)

- Use **CommonJS** (`require`/`module.exports`)
- Follow existing error handling patterns
- Use async/await for asynchronous operations
- Include proper error logging

```javascript
const controller = async (req, res) => {
  try {
    // Your logic here
    res.status(200).json({ data });
  } catch (err) {
    console.error('ControllerName error:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
};
```

### Frontend (React + TypeScript)

- Use **ESM** (`import`/`export`)
- Follow React best practices
- Use TypeScript for type safety
- Use shadcn/ui components for new pages

```typescript
import { useState } from 'react';

export default function Component() {
  const [data, setData] = useState(null);

  // Your logic here
  return <div>{/* JSX */}</div>;
}
```

### Database (Prisma)

- Use `snake_case` for table names (via `@@map`)
- Use `camelCase` for field names
- Always run `npx prisma generate` after schema changes

## 🧪 Testing

### Backend Testing

```bash
cd backend
npm test
```

### Frontend Testing

```bash
cd apps/web
npm test
```

### E2E Testing

```bash
# Run E2E tests (when implemented)
npm run test:e2e
```

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Description**: Clear description of the problem
2. **Steps to Reproduce**: Detailed steps to reproduce the issue
3. **Expected Behavior**: What you expected to happen
4. **Actual Behavior**: What actually happened
5. **Environment**:
   - OS and version
   - Node.js version
   - Browser version (if applicable)
6. **Screenshots**: If applicable, include screenshots
7. **Additional Context**: Any other relevant information

## 💡 Feature Requests

For feature requests:

1. **Use a clear title**: Summarize the feature in a few words
2. **Describe the feature**: What problem does this solve?
3. **Proposed solution**: How should it work?
4. **Alternatives considered**: What other approaches did you consider?
5. **Additional context**: Any other relevant information

## 📝 Documentation

### Adding Documentation

- Update README.md for user-facing changes
- Add inline comments for complex code
- Update API documentation for endpoint changes
- Create/update guides in the `docs/` directory

### API Documentation

API endpoints should be documented with:

- Description
- Request parameters
- Response format
- Authentication requirements
- Error responses

Example:

```javascript
/**
 * Get product by ID
 * 
 * @route GET /api/v1/products/:id
 * @access Public
 * @param {string} id - Product ID
 * @returns {Object} Product details
 * @throws {404} Product not found
 */
```

## 🔒 Security Considerations

- Never commit sensitive data (API keys, passwords)
- Use environment variables for configuration
- Validate all user inputs
- Sanitize data to prevent injection attacks
- Use HTTPS in production
- Keep dependencies updated

## 🤝 Community Guidelines

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members

## 📞 Getting Help

- **Documentation**: Check the `docs/` directory
- **Issues**: Search existing issues before creating new ones
- **Discussions**: Use GitHub Discussions for questions
- **Discord**: Join our community Discord (link in README)

## 🎉 Recognition

Contributors will be recognized in:

- CONTRIBUTORS.md file
- Release notes
- Project README

## 📄 License

By contributing to DevChain, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to DevChain! 🚀
