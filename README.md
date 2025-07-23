# AI Commit Guard

🤖 **Universal AI-powered pre-commit code review tool** that automatically checks your code changes before commit using multiple AI providers.

[![npm version](https://badge.fury.io/js/ai-commit-guard.svg)](https://www.npmjs.com/package/ai-commit-guard)
[![Downloads](https://img.shields.io/npm/dm/ai-commit-guard)](https://www.npmjs.com/package/ai-commit-guard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)](https://nodejs.org/)

> 🎯 **Stop bugs before they reach your repository!** Get instant AI feedback on every commit across all your projects - from JavaScript to Python, from Dockerfiles to YAML configs.

## ✨ Features

- 🌍 **Universal Language Support** - Works with **ANY** file type (JavaScript, Python, Go, Rust, C++, HTML, CSS, YAML, Dockerfile, Markdown, etc.)
- 🤖 **5 AI Providers** - OpenAI GPT-4, Anthropic Claude, Google Gemini, Cohere, Ollama (local)
- 🚀 **Lightning Fast** - Cached results with smart binary file detection
- 🎯 **Custom Rules** - Define your own coding standards in natural language
- 🛡️ **Security First** - Auto-masks secrets, ignores sensitive files, smart filtering
- 🔧 **Zero Config** - Works out of the box with sensible defaults
- ⏱️ **Timeout Protection** - Graceful handling with configurable timeouts
- 🎨 **Beautiful Output** - Colorized, readable feedback with smart formatting
- 📊 **Commit Tracking** - Flags show which commits were AI-reviewed
- 🔄 **Modern Husky Support** - No deprecated warnings, clean setup

## 🚀 Quick Start

### 1. Install Globally

```bash
npm install -g ai-commit-guard
```

### 2. Setup in Your Project

```bash
# One command setup - works in any git repository
ai-commit-guard --setup
```

### 3. Set Your AI API Key

Choose your preferred AI provider:

```bash
# OpenAI (Recommended)
export OPENAI_API_KEY="sk-your-openai-key-here"

# Anthropic Claude
export CLAUDE_API_KEY="sk-ant-your-claude-key-here"
export AI_PROVIDER="claude"

# Google Gemini
export GEMINI_API_KEY="your-gemini-api-key"
export AI_PROVIDER="gemini"

# Cohere
export COHERE_API_KEY="your-cohere-api-key"
export AI_PROVIDER="cohere"

# Ollama (Local - Free!)
export AI_PROVIDER="ollama"
# No API key needed - runs locally
```

### 4. That's It! 🎉

Now AI Guard will automatically review your code on every commit:

```bash
git add .
git commit -m "feat: add user authentication system"
# → AI Guard automatically reviews your changes
```

## 🌐 Universal Language Support

**Works with ANY programming language and file type - no configuration needed!**

### 💻 Programming Languages
```
✅ JavaScript, TypeScript, Python, Go, Rust, Java, C++, C#, PHP, Ruby
✅ Kotlin, Swift, Dart, Scala, Clojure, Elixir, Haskell, F#
✅ Shell scripts, PowerShell, Batch files
```

### 🌐 Web Technologies
```
✅ HTML, CSS, SCSS, SASS, Less, Stylus
✅ React (JSX/TSX), Vue, Angular, Svelte, Next.js, Nuxt.js
✅ Node.js, Express, FastAPI, Django, Rails
```

### ⚙️ DevOps & Infrastructure
```
✅ Docker (Dockerfile, docker-compose.yml)
✅ Kubernetes (YAML manifests, Helm charts)
✅ Terraform, Ansible, CloudFormation, Pulumi
✅ GitHub Actions, GitLab CI, Jenkins, CircleCI
```

### 📄 Configuration & Data
```
✅ JSON, YAML, TOML, INI, XML, HCL
✅ Environment files (.env, .envrc)
✅ Config files (nginx.conf, apache.conf, etc.)
```

### 📚 Documentation & Database
```
✅ Markdown, reStructuredText, AsciiDoc
✅ SQL, NoSQL queries, Prisma schema, GraphQL
✅ API specs (OpenAPI, Swagger, Postman)
```

## 📊 Example Output

### ✅ **Clean Code (Passes Review):**
```bash
ℹ️  🔍 Checking staged files...
ℹ️  🔒 Ignored 2 binary/sensitive files
ℹ️  📝 Reviewing 3 files using OPENAI...
🤖 Sending to OPENAI for review (timeout: 30s)...
✅ Code review passed!
ℹ️  Added flag: [AI-REVIEW-PASSED]
```

### ❌ **Issues Found (Blocks Commit):**
```bash
ℹ️  🔍 Checking staged files...
ℹ️  📝 Reviewing 2 files using CLAUDE...
🤖 Sending to CLAUDE for review (timeout: 45s)...
❌ Code review failed!

  1. **Exposed Secret**: API key hardcoded in config.js line 12
     Fix: Move to environment variable process.env.API_KEY

  2. **Magic String**: 'active' used directly in user.js line 25  
     Fix: Use named constant USER_STATUS.ACTIVE

  3. **Missing Error Handling**: No try-catch in async function
     Fix: Add proper error handling for database operations
```

### ⏱️ **Timeout (Allows Commit with Flag):**
```bash
🤖 Sending to GEMINI for review (timeout: 30s)...
⚠️  AI review timed out after 30 seconds
ℹ️  Added flag: [AI-REVIEW-FAILED-TIMEOUT]
✅ Commit completed with AI review flag
```

## 📋 Configuration (Optional)

### 🎯 **Custom Coding Rules** (`.code-rules.md`)

Create project-specific rules in natural language:

```markdown
# My Project Code Review Rules

## Security Requirements
- Never commit API keys, passwords, or tokens
- All user inputs must be validated and sanitized
- Use parameterized queries for database operations
- Implement proper authentication for all endpoints

## Code Quality Standards  
- Functions should be under 25 lines
- Use TypeScript interfaces for all data structures
- Add JSDoc comments for public functions
- Follow single responsibility principle

## Project-Specific Rules
- All React components must have PropTypes or TypeScript types
- Use our custom error handling utility for async operations
- Database queries must include proper indexing considerations
- API responses must follow our standard format

## Framework Guidelines
### React/Next.js
- Use hooks instead of class components
- Implement proper loading and error states
- Use Next.js Image component for optimization

### Node.js/Express
- Always use middleware for request validation
- Implement rate limiting for public endpoints
- Use structured logging with correlation IDs
```

### 🚫 **Ignore Patterns** (`.ai-guard-ignore`)

Exclude files from AI review:

```bash
# Sensitive files (automatically ignored by default)
*.env*
*.key
*secret*
*password*
*credential*

# Generated/Build files
dist/*
build/*
out/*
coverage/*
node_modules/*

# Large dependencies
vendor/*
public/vendor/*
*.min.js
*.bundle.*
package-lock.json

# Project-specific
legacy-code/*
third-party/*
generated-schema.ts
*.generated.*
```

### ⚙️ **Environment Variables**

Fine-tune AI Guard behavior:

```bash
# AI Provider Configuration
export AI_PROVIDER="openai"              # openai|claude|gemini|cohere|ollama
export AI_MODEL="gpt-4"                  # Specific model to use
export OPENAI_API_KEY="sk-your-key"      # Your API key

# Performance Tuning
export AI_GUARD_TIMEOUT=45000            # Review timeout (45 seconds)
export AI_GUARD_MAX_FILE_SIZE=100000     # Max file size (100KB)

# Advanced Configuration
export AI_GUARD_CACHE_DURATION=86400000  # Cache duration (24 hours)
export AI_GUARD_RETRY_COUNT=3            # Number of retries on failure
```

## 🔧 Advanced Usage

### 🎛️ **Multiple AI Providers**

Switch between providers based on your needs:

```bash
# Use OpenAI for general code review
export AI_PROVIDER="openai"
export OPENAI_API_KEY="sk-your-openai-key"

# Switch to Claude for complex logic review  
export AI_PROVIDER="claude"
export CLAUDE_API_KEY="sk-ant-your-claude-key"

# Use Ollama for private/sensitive code (runs locally)
export AI_PROVIDER="ollama"
export AI_MODEL="codellama"  # or deepseek-coder, starcoder, etc.
```

### ⏱️ **Timeout Configuration**

Adjust timeouts based on project size:

```bash
# Quick reviews for small changes
export AI_GUARD_TIMEOUT=15000  # 15 seconds

# Longer timeout for large refactors
export AI_GUARD_TIMEOUT=60000  # 60 seconds

# Maximum timeout for complex projects
export AI_GUARD_TIMEOUT=120000 # 2 minutes
```

### 🎯 **Project-Specific Setup**

Different configurations for different projects:

```bash
# Frontend project - focus on React/TypeScript
echo "Focus on React best practices, TypeScript usage, and accessibility" > .code-rules.md

# Backend API - focus on security and performance  
echo "Prioritize security, error handling, and API design" > .code-rules.md

# DevOps repository - focus on infrastructure
echo "Review Terraform syntax, security groups, and resource naming" > .code-rules.md
```

### 🔄 **CI/CD Integration**

Use in continuous integration:

```yaml
# GitHub Actions example
name: AI Code Review
on: [pull_request]
jobs:
  ai-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install -g ai-commit-guard
      - run: ai-commit-guard --setup
      - run: git add . && ai-commit-guard
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

## 🏷️ Commit Message Flags

AI Guard automatically adds flags to track review status:

| Flag | Meaning | Action Needed |
|------|---------|---------------|
| `[AI-REVIEW-PASSED]` | ✅ AI approved the changes | None - code is good |
| `[AI-REVIEW-FAILED-TIMEOUT]` | ⏱️ Review timed out | Manual review recommended |
| `[AI-REVIEW-SKIPPED-ERROR]` | ❌ Error occurred (no API key, etc.) | Check configuration |
| No flag | 🚫 AI review failed - commit blocked | Fix issues and retry |

### 📊 **Team Analytics**

Track AI review coverage across your team:

```bash
# Check review coverage in recent commits
git log --oneline --grep="AI-REVIEW" | wc -l

# Find commits that need manual review
git log --oneline --grep="TIMEOUT\|ERROR" --since="1 week ago"

# Show successful AI reviews
git log --oneline --grep="AI-REVIEW-PASSED" --since="1 month ago"
```

## 🆚 Why Choose AI Commit Guard?

### **vs ESLint/Prettier**
- ✅ **Language Agnostic** - Works with any language, not just JavaScript
- ✅ **Context Aware** - Understands business logic, not just syntax
- ✅ **Custom Rules** - Natural language rules vs complex configuration
- ✅ **Security Focus** - Automatically detects exposed secrets and vulnerabilities

### **vs SonarQube**
- ✅ **Instant Feedback** - Pre-commit vs post-commit analysis
- ✅ **Zero Setup** - No server installation or complex configuration
- ✅ **AI-Powered** - Intelligent analysis vs pattern matching
- ✅ **Cost Effective** - Pay-per-use vs enterprise licensing

### **vs Manual Code Review**
- ✅ **Consistent** - Same standards applied every time
- ✅ **Fast** - Instant feedback vs waiting for reviewers
- ✅ **Educational** - Teaches best practices to junior developers
- ✅ **24/7 Available** - No dependency on team availability

## 🎯 Use Cases

### **🏢 Enterprise Teams**
- Enforce consistent coding standards across multiple teams
- Catch security vulnerabilities before they reach production
- Reduce code review time by pre-filtering obvious issues
- Onboard new developers with automated mentoring

### **🚀 Startups**
- Move fast without breaking quality standards
- Catch issues early when you can't afford technical debt
- Scale code quality as your team grows
- Focus senior developers on architecture, not basic reviews

### **👨‍🎓 Educational**
- Learn best practices through immediate feedback
- Understand security concepts through real examples
- Improve code quality incrementally
- Get explanations for why changes are needed

### **🔒 Security-Critical Projects**
- Automatically detect exposed secrets and credentials
- Catch injection vulnerabilities before commit
- Enforce secure coding practices consistently
- Maintain audit trail of all code changes

## 🐛 Troubleshooting

### **Common Issues**

#### "No AI API key found"
```bash
# Check if environment variables are set
env | grep -E "(OPENAI|CLAUDE|GEMINI|COHERE)_API_KEY"

# Set API key for current session
export OPENAI_API_KEY="sk-your-actual-key"

# Make permanent (add to shell profile)
echo 'export OPENAI_API_KEY="sk-your-key"' >> ~/.bashrc
echo 'export OPENAI_API_KEY="sk-your-key"' >> ~/.zshrc
```

#### "AI review timed out"
```bash
# Increase timeout for large projects
export AI_GUARD_TIMEOUT=60000  # 60 seconds

# Check network connectivity
curl -I https://api.openai.com

# Try with smaller changesets
git add specific-file.js  # Instead of git add .

# Use faster provider
export AI_PROVIDER="gemini"  # Often faster than OpenAI

# Use local Ollama for no network dependency
export AI_PROVIDER="ollama"
```

#### "Too many files being reviewed"
```bash
# Check what files are being processed
git diff --cached --name-only

# Add patterns to ignore large files
echo "dist/*" >> .ai-guard-ignore
echo "*.min.js" >> .ai-guard-ignore
echo "package-lock.json" >> .ai-guard-ignore

# Reduce file size limit
export AI_GUARD_MAX_FILE_SIZE=25000  # 25KB

# Stage files incrementally
git add src/components/  # Review by directory
git commit -m "feat: update components"
git add src/utils/
git commit -m "feat: update utilities"
```

#### "Husky deprecated warnings"
```bash
# Remove old husky configuration
rm -rf .husky
rm .huskyrc*

# Reinstall with modern setup
npx ai-commit-guard --setup

# Manual fix if needed
echo "npx ai-commit-guard" > .husky/pre-commit
echo 'npx ai-commit-guard --commit-msg "$1"' > .husky/commit-msg
chmod +x .husky/*
```

#### "Binary files being reviewed"
```bash
# Check git's binary detection
git diff --cached --numstat

# Add file types to ignore
echo "*.pdf" >> .ai-guard-ignore
echo "*.jpg" >> .ai-guard-ignore
echo "*.png" >> .ai-guard-ignore

# Check current ignore patterns
cat .ai-guard-ignore
```

#### "Cache issues"
```bash
# Clear cache to force fresh review
rm -rf .ai-guard-cache

# Check cache size
du -sh .ai-guard-cache

# Disable cache temporarily
export AI_GUARD_CACHE_DURATION=0
```

### **Performance Tips**

```bash
# ⚡ Optimize for speed
export AI_PROVIDER="gemini"          # Fastest provider
export AI_GUARD_TIMEOUT=20000        # Shorter timeout
export AI_GUARD_MAX_FILE_SIZE=30000  # Smaller files

# 🎯 Optimize for accuracy  
export AI_PROVIDER="claude"          # Best code understanding
export AI_GUARD_TIMEOUT=60000        # Longer timeout
export AI_MODEL="claude-3-opus"      # Most capable model

# 🔒 Optimize for privacy
export AI_PROVIDER="ollama"          # Local processing
export AI_MODEL="codellama"          # Good code model
# No API key needed, runs entirely local
```

## 📊 Analytics & Monitoring

### **Review Statistics**

Track your AI review effectiveness:

```bash
# Total commits with AI review
git log --grep="AI-REVIEW" --oneline | wc -l

# Success rate
git log --grep="AI-REVIEW-PASSED" --oneline | wc -l

# Timeout rate  
git log --grep="TIMEOUT" --oneline | wc -l

# Recent review activity
git log --grep="AI-REVIEW" --since="1 week ago" --pretty=format:"%h %s"
```

### **Team Dashboard Script**

```bash
#!/bin/bash
# ai-guard-stats.sh - Team AI review dashboard

echo "🤖 AI Commit Guard Team Statistics"
echo "=================================="

# Total commits in last 30 days
total=$(git log --since="30 days ago" --oneline | wc -l)
echo "📊 Total commits (30 days): $total"

# AI reviewed commits
reviewed=$(git log --since="30 days ago" --grep="AI-REVIEW" --oneline | wc -l)
echo "🤖 AI reviewed commits: $reviewed"

# Success rate
passed=$(git log --since="30 days ago" --grep="AI-REVIEW-PASSED" --oneline | wc -l)
echo "✅ Successful reviews: $passed"

# Calculate percentage
if [ $total -gt 0 ]; then
  coverage=$((reviewed * 100 / total))
  echo "📈 AI review coverage: ${coverage}%"
fi

echo ""
echo "🚨 Recent issues found:"
git log --since="7 days ago" --grep="AI-REVIEW" --invert-grep --grep="AI-REVIEW-PASSED" --oneline | head -5
```

## 🚀 Advanced Integrations

### **VS Code Extension** (Coming Soon)
- Real-time AI feedback as you type
- Inline suggestions and fixes
- Integration with VS Code problems panel

### **IDE Plugins** (Roadmap)
- IntelliJ IDEA / WebStorm / PyCharm support
- Real-time code analysis
- Contextual suggestions in editor

### **GitHub Actions Integration**

```yaml
name: AI Code Review
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  ai-review:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Install AI Commit Guard
        run: npm install -g ai-commit-guard
        
      - name: Run AI Review on Changes
        run: |
          # Get changed files in PR
          git diff --name-only origin/main...HEAD > changed_files.txt
          
          # Stage changed files for review
          cat changed_files.txt | xargs git add
          
          # Run AI review
          ai-commit-guard
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          AI_GUARD_TIMEOUT: 60000
          
      - name: Comment on PR
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '🤖 AI Code Review found issues that need attention. Please check the workflow logs for details.'
            });
```

### **GitLab CI Integration**

```yaml
# .gitlab-ci.yml
ai-code-review:
  stage: test
  image: node:18
  before_script:
    - npm install -g ai-commit-guard
  script:
    - git diff --name-only $CI_MERGE_REQUEST_TARGET_BRANCH_SHA..$CI_COMMIT_SHA | xargs git add
    - ai-commit-guard
  variables:
    AI_PROVIDER: "openai"
    AI_GUARD_TIMEOUT: "60000"
  only:
    - merge_requests
```

## 🔮 Roadmap

- [ ] **Code Generation** - AI suggests fixes automatically
- [ ] **Real-time IDE Extensions** - VS Code, IntelliJ support
- [ ] **Team Analytics Dashboard** - Web-based review statistics
- [ ] **Custom AI Models** - Fine-tune for your codebase
- [ ] **Batch Review Mode** - Review multiple commits at once
- [ ] **GitHub App** - Native GitHub integration
- [ ] **Slack/Discord Integration** - Review notifications
- [ ] **Multi-reviewer Mode** - Get consensus from multiple AIs
- [ ] **Learning Mode** - Improve rules from team feedback
- [ ] **Compliance Scanning** - OWASP, CWE, NIST standards
- [ ] **Performance Analysis** - Detect performance bottlenecks
- [ ] **Architecture Review** - High-level design feedback

## 🤝 Contributing

We love contributions! Here's how to get involved:

### **🐛 Bug Reports**
- Use our [issue template](https://github.com/ademalkan/ai-commit-guard/issues/new?template=bug_report.md)
- Include AI provider, OS, and Node.js version
- Provide minimal reproduction case

### **💡 Feature Requests**
- Check [existing discussions](https://github.com/ademalkan/ai-commit-guard/discussions)
- Explain the use case and expected behavior
- Consider implementation complexity

### **🔧 Code Contributions**

```bash
# 1. Fork the repository on GitHub

# 2. Clone your fork
git clone https://github.com/ademalkan/ai-commit-guard.git
cd ai-commit-guard

# 3. Install dependencies
npm install

# 4. Run tests
npm test

# 5. Make your changes
# Follow existing code style and patterns

# 6. Test your changes
npm run test:full

# 7. Submit a pull request
# Use conventional commit messages
git commit -m "feat: add support for new AI provider"
```

### **📚 Documentation**
- Improve README examples
- Add use case tutorials
- Create video guides
- Translate to other languages

## 📄 License

MIT © [Adem Alkan](https://github.com/ademalkan)

## 🌟 Support

### **💬 Community**
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/ademalkan/ai-commit-guard/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/ademalkan/ai-commit-guard/discussions)

### **📞 Professional Support**
- 🏢 **Enterprise Support**: Available for teams and organizations
- 🎓 **Training Sessions**: Custom workshops for your team
- 🔧 **Custom Integration**: Tailored solutions for your workflow

### **☕ Show Your Appreciation**

If AI Commit Guard saves you time and improves your code quality:

- ⭐ **Star this repository** on GitHub
- 🐦 **Share on Twitter** - Tag us @ai_commit_guard
- 📝 **Write a blog post** about your experience
- 💰 **Sponsor the project** on GitHub Sponsors

---


**🚀 Ready to revolutionize your code quality?**

[**Get Started →**](https://www.npmjs.com/package/ai-commit-guard)

---

*"Code quality should be universal, not language-specific"*

**Made with ❤️ by developers, for developers**

</div>