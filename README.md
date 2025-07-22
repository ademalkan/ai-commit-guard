# AI Commit Guard

🤖 **Universal AI-powered pre-commit code review tool** that automatically checks your code changes before commit using multiple AI providers.

[![npm version](https://badge.fury.io/js/ai-commit-guard.svg)](https://www.npmjs.com/package/ai-commit-guard)
[![Downloads](https://img.shields.io/npm/dm/ai-commit-guard)](https://www.npmjs.com/package/ai-commit-guard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)](https://nodejs.org/)

> 🎯 **Stop bugs before they reach your repository!** Get instant AI feedback on every commit across all your projects - from JavaScript to Python, from Dockerfiles to YAML configs.

## ✨ Features

- 🌍 **Universal Language Support** - Works with ANY file type (JavaScript, Python, Go, Rust, C++, HTML, CSS, YAML, Dockerfile, etc.)
- 🤖 **5 AI Providers** - OpenAI GPT-4, Claude, Gemini, Cohere, Ollama (local)
- 🚀 **Lightning Fast** - Cached results with smart binary file detection
- 🎯 **Custom Rules** - Define your own coding standards in natural language
- 🛡️ **Security First** - Auto-masks secrets, ignores sensitive files, smart filtering
- 🔧 **Zero Config** - Works out of the box with sensible defaults
- ⏱️ **Timeout Protection** - Handles network issues gracefully with commit message flags
- 🎨 **Beautiful Output** - Colorized, readable feedback with smart formatting
- 📊 **Commit Tracking** - Flags show which commits were AI-reviewed

## 🚀 Quick Start

### 1. Install Globally

```bash
npm install -g ai-commit-guard
```

### 2. Setup in Your Project

```bash
# Install husky (if not already installed)
npm install --save-dev husky
npx husky init

# Add AI Guard to pre-commit hook
echo "npx ai-commit-guard" > .husky/pre-commit
chmod +x .husky/pre-commit
```

### 3. Set Your AI API Key

**Option A: OpenAI (Recommended)**
```bash
export OPENAI_API_KEY="sk-your-openai-key-here"
```

**Option B: Anthropic Claude**
```bash
export CLAUDE_API_KEY="sk-ant-your-claude-key-here"
export AI_PROVIDER="claude"
```

**Option C: Google Gemini**
```bash
export GEMINI_API_KEY="your-gemini-api-key"
export AI_PROVIDER="gemini"
```

**Option D: Cohere**
```bash
export COHERE_API_KEY="your-cohere-api-key"
export AI_PROVIDER="cohere"
```

**Option E: Ollama (Local, Free)**
```bash
# Install and run Ollama locally
export AI_PROVIDER="ollama"
# No API key needed!
```

### 4. That's It! 🎉

Now AI Guard will automatically review your code on every commit:

```bash
git add .
git commit -m "feat: add user authentication"
# → AI Guard automatically reviews your changes
```

## 🌐 Universal Language Support

Works with **ANY** programming language and file type:

### 💻 Programming Languages
```bash
✅ JavaScript, TypeScript, Python, Go, Rust, Java, C++, C#, PHP, Ruby
✅ Kotlin, Swift, Dart, Scala, Clojure, Elixir, Haskell, F#
✅ Shell scripts, PowerShell, Batch files
```

### 🌐 Web Technologies
```bash
✅ HTML, CSS, SCSS, SASS, Less
✅ React (JSX/TSX), Vue, Angular, Svelte, Angular
✅ Node.js, Express, Next.js, Nuxt.js
```

### ⚙️ DevOps & Infrastructure
```bash
✅ Docker (Dockerfile, docker-compose.yml)
✅ Kubernetes (YAML manifests, Helm charts)
✅ Terraform, Ansible, CloudFormation
✅ GitHub Actions, GitLab CI, Jenkins
```

### 📄 Configuration & Data
```bash
✅ JSON, YAML, TOML, INI, XML
✅ Environment files (.env, .envrc)
✅ Config files (nginx.conf, apache.conf)
```

### 📚 Documentation & Database
```bash
✅ Markdown, reStructuredText, AsciiDoc
✅ SQL, NoSQL queries, Prisma schema
✅ API specs (OpenAPI, GraphQL)
```

## 📋 Custom Rules & Security (Optional)

### Universal Coding Rules
Create a `.code-rules.md` file in your project root to define coding standards for **any language**:

```markdown
# Universal Code Review Rules

## Code Quality
- Use meaningful variable and function names
- Keep functions under 30 lines when possible
- No magic numbers or strings - use named constants
- Add comments for complex business logic
- Remove unused imports and variables

## Security & Best Practices
- Never commit sensitive data (API keys, passwords, tokens)
- Validate all user inputs
- Use proper error handling
- Follow consistent naming conventions
- Add appropriate logging for debugging

## Language-Specific Rules

### Python
- Follow PEP 8 style guidelines
- Use type hints for function parameters
- Prefer list comprehensions over loops when appropriate

### JavaScript/TypeScript
- Use const/let instead of var
- Prefer async/await over .then() chains
- Add JSDoc comments for public functions

### Go
- Follow Go naming conventions
- Handle errors explicitly
- Use context for cancellation

### Docker
- Use multi-stage builds for smaller images
- Don't run containers as root
- Pin base image versions

### YAML/Config Files
- Use consistent indentation
- Add comments explaining complex configurations
- Validate syntax and structure
```

### Security & Ignore Patterns
Create a `.ai-guard-ignore` file to exclude files from AI review:

```bash
# Sensitive files (automatically ignored by default)
*.env*
*.key
*.pem
*.keystore
*password*
*secret*
*token*
*api-key*
*credential*

# Build and generated files
dist/*
build/*
out/*
target/*
node_modules/*
vendor/*
.venv/*
__pycache__/*

# Binary files (automatically detected)
*.exe
*.dll
*.so
*.dylib
*.jpg
*.png
*.pdf
*.zip

# Custom patterns for your project
legacy-code/*
third-party/*
generated/*
*.generated.*
temp/*
```

**🔒 Built-in Security Features:**
- Automatically detects and ignores sensitive files by name patterns
- Smart binary file detection (by extension and git analysis)
- Masks API keys, tokens, and secrets in code diffs
- Configurable file size limits to skip large files
- Comprehensive exclude patterns for build artifacts

## 🛠️ Usage Examples

### Multi-Language Projects
```bash
git add .
# Reviews: Python APIs, React frontend, Dockerfile, k8s YAML, Go services
git commit -m "feat: add microservice architecture"
```

### Frontend Applications
```bash
git add src/ public/ package.json
# Reviews: TypeScript, CSS, HTML, JSON configs, component files
git commit -m "ui: redesign dashboard with dark mode"
```

### Infrastructure as Code
```bash
git add infrastructure/
# Reviews: Terraform, Kubernetes YAML, shell scripts, Ansible playbooks
git commit -m "infra: add auto-scaling and monitoring"
```

### Documentation Projects
```bash
git add docs/ README.md
# Reviews: Markdown, configuration files, API specs
git commit -m "docs: update API documentation and examples"
```

## 📊 Beautiful Output Examples

### ✅ Successful Review
```bash
ℹ️  🔍 Checking staged files...
ℹ️  🔒 Ignored 3 binary/sensitive files
ℹ️  📝 Reviewing 5 files using OPENAI...
🤖 Sending to OPENAI for review (timeout: 30s)...
✅ Code review passed! [AI-REVIEW-PASSED]

💡 Suggestions:
  • Great job using environment variables for configuration
  • Consider adding error handling in api/users.py line 45
  • Docker multi-stage build looks efficient!
```

### ❌ Issues Found
```bash
ℹ️  🔍 Checking staged files...
ℹ️  📝 Reviewing 4 files using CLAUDE...
🤖 Sending to CLAUDE for review...
❌ Code review failed!

  • src/auth.js: Hardcoded API key on line 12
    Fix: Move to environment variable or config file
    
  • docker-compose.yml: Using 'latest' tag for production
    Fix: Pin specific version like 'postgres:14.2'
    
  • README.md: Missing installation instructions
    Fix: Add quick start section with prerequisites
```

### ⏱️ Timeout Protection
```bash
ℹ️  🔍 Checking staged files...
ℹ️  📝 Reviewing 8 files using GEMINI...
🤖 Sending to GEMINI for review (timeout: 30s)...
⚠️  AI review timed out after 30 seconds
ℹ️  Adding timeout flag: [AI-REVIEW-FAILED-TIMEOUT]
✅ Commit completed with AI review flag
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `OPENAI_API_KEY` | OpenAI API key | - | `sk-proj-...` |
| `CLAUDE_API_KEY` | Claude API key | - | `sk-ant-...` |
| `GEMINI_API_KEY` | Google Gemini API key | - | `AIza...` |
| `COHERE_API_KEY` | Cohere API key | - | `co-...` |
| `AI_PROVIDER` | AI provider to use | `openai` | `claude`, `gemini`, `cohere`, `ollama` |
| `AI_MODEL` | Specific model name | Provider default | `gpt-4`, `claude-3-sonnet`, `gemini-pro` |
| `AI_GUARD_TIMEOUT` | Review timeout (ms) | `30000` | `45000` |
| `AI_GUARD_MAX_FILE_SIZE` | Max file size (bytes) | `50000` | `100000` |

### Configuration Files

| File | Purpose | Auto-created |
|------|---------|--------------|
| `.code-rules.md` | Custom coding rules | ❌ |
| `.ai-guard-ignore` | Files to exclude | ❌ |
| `.ai-guard-cache/` | Response cache | ✅ |

### Advanced Configuration Examples

```bash
# Use Ollama locally (free, private)
export AI_PROVIDER="ollama"
export AI_MODEL="codellama"  # or llama2, mistral, etc.

# High-performance setup
export AI_GUARD_TIMEOUT=60000        # 60 seconds
export AI_GUARD_MAX_FILE_SIZE=100000 # 100KB files

# Team consistency
export AI_PROVIDER="openai"
export AI_MODEL="gpt-4"
```

## 🔧 Advanced Usage

### Provider-Specific Features

#### OpenAI GPT-4
- **Best overall accuracy**
- **Great with multiple languages**
- **Excellent security analysis**

#### Anthropic Claude
- **Superior code understanding**
- **Great with complex logic**
- **Excellent explanations**

#### Google Gemini
- **Fast and efficient**
- **Good with structured data**
- **Free tier available**

#### Cohere
- **Strong with documentation**
- **Good API design analysis**
- **Reliable performance**

#### Ollama (Local)
- **Complete privacy** - runs locally
- **No API costs** - free to use
- **Works offline** - no internet needed
- **Multiple models** - codellama, llama2, mistral, etc.

### Temporary Overrides
```bash
# Use different provider for one commit
AI_PROVIDER=claude git commit -m "refactor: complex algorithm"

# Longer timeout for large changes  
AI_GUARD_TIMEOUT=120000 git commit -m "feat: major refactoring"

# Skip AI review completely
git commit -m "docs: fix typo" --no-verify
```

### Cache Management
```bash
# View cache status
ls -la .ai-guard-cache/

# Clear old cache entries
find .ai-guard-cache -name "*.json" -mtime +7 -delete

# Clear all cache
rm -rf .ai-guard-cache
```

## 🏷️ Commit Message Flags

AI Guard automatically adds flags to track review status:

### Success Cases
```
feat: add payment processing [AI-REVIEW-PASSED]
```

### Timeout Cases
```  
refactor: large codebase changes [AI-REVIEW-FAILED-TIMEOUT]
```

### Error Cases
```
fix: urgent hotfix [AI-REVIEW-SKIPPED-ERROR]
```

**Flag Benefits:**
- ✅ **Transparency** - Team knows which commits were AI-reviewed
- 🔍 **Audit Trail** - Easy to find commits that need manual review
- 📊 **Analytics** - Track AI review coverage over time
- 🚨 **Risk Assessment** - Prioritize manual review for flagged commits

## 🤔 Why Choose AI Commit Guard?

### 🆚 Comparison with Other Tools

| Feature | AI Commit Guard | ESLint/Prettier | SonarQube | Manual Review |
|---------|-----------------|-----------------|-----------|---------------|
| **Language Support** | ✅ Universal (any language) | ⚠️ JavaScript-focused | ✅ Multi-language | ✅ Any language |
| **Custom Rules** | ✅ Natural language | ⚠️ Complex config | ⚠️ Preset rules | ✅ Unlimited flexibility |
| **Context Understanding** | ✅ Understands business logic | ❌ Syntax only | ⚠️ Pattern-based | ✅ Full context |
| **Security Analysis** | ✅ Auto-detects secrets | ❌ Limited | ✅ Comprehensive | ⚠️ Manual vigilance |
| **Setup Complexity** | ✅ Zero config | ⚠️ Config files needed | ❌ Complex setup | ✅ No setup |
| **Speed** | ✅ Instant (cached) | ✅ Very fast | ❌ Slow scans | ❌ Human speed |
| **Cost** | 💰 Pay per use | 🆓 Free | 💰 Enterprise pricing | 💰 Developer time |
| **Learning** | ✅ Teaches best practices | ❌ Just flags issues | ⚠️ Reports only | ✅ Mentoring |

### 🎯 Perfect For

- **🏢 Enterprise Teams** - Consistent quality across all projects
- **🚀 Startups** - Fast development with quality gates
- **👨‍🏫 Mentoring** - Educational feedback for junior developers
- **🔒 Security-Critical** - Catch vulnerabilities early
- **🌐 Multi-Language** - Teams using diverse tech stacks
- **📚 Open Source** - Maintain quality in community contributions

## 🐛 Troubleshooting

### Common Issues & Solutions

#### "No AI API key found"
```bash
# Check current environment
env | grep -E "(OPENAI|CLAUDE|GEMINI|COHERE)_API_KEY"

# Set for current session
export OPENAI_API_KEY="sk-your-key"

# Make permanent (choose one)
echo 'export OPENAI_API_KEY="sk-your-key"' >> ~/.bashrc
echo 'export OPENAI_API_KEY="sk-your-key"' >> ~/.zshrc
```

#### "AI review timed out"
```bash
# Increase timeout
export AI_GUARD_TIMEOUT=60000  # 60 seconds

# Try different provider
export AI_PROVIDER="claude"    # Often faster than OpenAI

# Use local Ollama (no network dependency)
export AI_PROVIDER="ollama"
```

#### "Too many files being reviewed"
```bash
# Check what's being reviewed
git diff --cached --name-only

# Add to .ai-guard-ignore
echo "dist/*" >> .ai-guard-ignore
echo "*.generated.*" >> .ai-guard-ignore

# Stage specific files only
git add src/ --exclude="*.test.js"
```

#### "Binary files being reviewed"
```bash
# Check git's binary detection
git diff --cached --numstat

# Binary files show as: -	-	filename
# These should be automatically excluded

# If still having issues, add to ignore:
echo "*.pdf" >> .ai-guard-ignore
echo "*.jpg" >> .ai-guard-ignore
```

#### "Review quality is poor"
```bash
# Use more specific rules in .code-rules.md
echo "Focus on security and logic errors, not style" >> .code-rules.md

# Try a different AI provider
export AI_PROVIDER="claude"  # Often better for code understanding

# Increase context with smaller changesets  
git add specific-files.js  # Instead of git add .
```

### Performance Optimization

```bash
# Enable better caching
export NODE_ENV=production

# Reduce file size threshold
export AI_GUARD_MAX_FILE_SIZE=25000  # 25KB

# Use faster provider for large projects
export AI_PROVIDER="gemini"  # Generally faster

# Clear old cache periodically
find .ai-guard-cache -mtime +30 -delete
```

## 📈 Roadmap

### 🔜 Coming Soon
- [ ] **VS Code Extension** - Inline AI review as you code
- [ ] **GitHub Actions Integration** - PR-level reviews
- [ ] **IDE Plugins** - IntelliJ, WebStorm, PyCharm support
- [ ] **Team Analytics** - Review metrics and insights

### 🎯 Future Features
- [ ] **Custom AI Models** - Fine-tune for your codebase
- [ ] **Slack/Discord Bots** - Review notifications
- [ ] **Git Hook Templates** - Pre-push, pre-merge reviews
- [ ] **Language Servers** - Real-time review in any editor

### 🤝 Community Requests
- [ ] **Review Confidence Scores** - AI certainty indicators
- [ ] **Multi-reviewer** - Get opinions from multiple AIs
- [ ] **Learning Mode** - Improve rules from team feedback
- [ ] **Compliance Checks** - OWASP, CWE, NIST standards

## 🤝 Contributing

We love contributions! Here's how to get started:

### 🚀 Quick Contribution
```bash
# 1. Fork on GitHub
# 2. Clone your fork
git clone https://github.com/yourusername/ai-commit-guard.git
cd ai-commit-guard

# 3. Install dependencies  
npm install

# 4. Run tests
npm test

# 5. Make your changes
# 6. Test thoroughly
npm run test:full

# 7. Submit PR with description
```

### 🎯 Areas We Need Help
- **🌐 Language Support** - Testing with more programming languages
- **📚 Documentation** - Examples, tutorials, best practices
- **🧪 Testing** - Unit tests, integration tests, edge cases
- **🎨 UI/UX** - Better CLI output, error messages
- **🔧 Integrations** - IDE plugins, CI/CD tools

### 📋 Contribution Guidelines
- **Code Style** - Run `npm run lint` before submitting
- **Tests** - Add tests for new features
- **Documentation** - Update README for new features
- **Commits** - Use conventional commits (`feat:`, `fix:`, etc.)

## 📄 License

MIT © [Adem Alkan](https://github.com/ademalkan)

## 💬 Support & Community

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/ademalkan/ai-commit-guard/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/ademalkan/ai-commit-guard/discussions)

### 🌟 Show Your Support

If AI Commit Guard helps you write better code:

- ⭐ **Star this repo** on GitHub
- 🐦 **Tweet about it** - `@mention` us!
- 📝 **Write a blog post** - Share your experience
- 💬 **Tell your team** - Spread the word

---

**Made with ❤️ for universal code quality**

*"Code quality should be universal, not language-specific"* - AI Commit Guard Team