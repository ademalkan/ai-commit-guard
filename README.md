# AI Commit Guard

🤖 **AI-powered pre-commit code review tool** that automatically checks your code changes before commit using OpenAI GPT-4 or Anthropic Claude.

[![npm version](https://badge.fury.io/js/ai-commit-guard.svg)](https://www.npmjs.com/package/ai-commit-guard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)](https://nodejs.org/)

## ✨ Features

- 🔍 **Smart Detection** - Only reviews staged `.js`, `.ts`, `.jsx`, `.tsx`, `.vue`, `.py` files
- 🚀 **Lightning Fast** - Cached results for unchanged code
- 🎯 **Custom Rules** - Define your own coding standards
- 🔄 **Multi-Provider** - Works with OpenAI GPT-4 or Anthropic Claude
- 🛡️ **Security First** - Automatically ignores sensitive files and masks secrets
- 🛡️ **Zero Config** - Works out of the box with sensible defaults
- ⏱️ **Timeout Protection** - Handles network issues gracefully with commit message flags
- 📝 **Detailed Feedback** - Get specific line-by-line suggestions

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

### 4. That's It! 🎉

Now AI Guard will automatically review your code on every commit:

```bash
git add .
git commit -m "feat: add user authentication"
# → AI Guard automatically reviews your changes
```

## 📋 Custom Rules & Security (Optional)

### Custom Coding Rules
Create a `.code-rules.md` file in your project root to define custom coding standards:

```markdown
# My Code Review Rules

## Magic Strings
- No string literals in code, use constants
- Event properties should use EVENT_FIELDS constant

## Functions
- Functions should not exceed 20 lines
- Use descriptive function names
- Follow single responsibility principle

## Variables
- Use camelCase for variables
- Boolean variables should start with is/has/can/should
- No single letter variables except for loops

## Error Handling
- Always use try-catch for async operations
- Log errors with appropriate context

## Examples

❌ **Bad:**
```javascript
event['status'] = 'active';
function getData() { /* 30 lines of mixed responsibilities */ }
let x = true;
```

✅ **Good:**
```javascript
const EVENT_FIELDS = { STATUS: 'status' };
event[EVENT_FIELDS.STATUS] = 'active';

function fetchUserData() { /* single responsibility */ }
function processUserData() { /* separate concern */ }

let isUserActive = true;
```
```

### Security & Ignore Patterns
Create a `.ai-guard-ignore` file to exclude sensitive files from AI review:

```bash
# Sensitive files (automatically ignored)
*.env*
*.key
*.pem
*password*
*secret*
*token*
*api-key*

# Custom patterns
config/database.js
secrets/
.env.*
*-secret.json
api-keys.txt

# Large files
dist/*
build/*
*.min.js
package-lock.json
```

**🔒 Built-in Security Features:**
- Automatically detects and ignores sensitive files
- Masks API keys and secrets in code diffs
- Filters out files containing `password`, `secret`, `token`, `key`
- Skips large files (>50KB by default)

## 🛠️ Usage

### Automatic Mode (Recommended)
AI Guard runs automatically when you commit:

```bash
git add src/
git commit -m "refactor: improve error handling"
# 🔍 Checking staged files...
# 📝 Reviewing 3 files...
# 🤖 Sending to AI for review...
# ✅ Code review passed!
```

### Manual Mode
Run review without committing:

```bash
npx ai-commit-guard
```

### ⏱️ Timeout Protection
```bash
🔍 Checking staged files...
📝 Reviewing 2 files...
🤖 Sending to AI for review (timeout: 30s)...
⏱️ AI review timed out after 30 seconds
📝 Added [AI-REVIEW-FAILED: Timeout] to commit message
```

### 🔒 Security Protection
```bash
🔍 Checking staged files...
🔒 Ignored 2 sensitive/excluded files
📝 Reviewing 1 files...
✅ Code review passed!
```

## 📊 Example Output

### ✅ Passing Review
```bash
🔍 Checking staged files...
📝 Reviewing 2 files...
🤖 Sending to AI for review...
✅ Code review passed!

💡 Suggestions:
• Consider adding JSDoc comments for public functions
• Variable naming looks great, well done!
```

### ❌ Failing Review
```bash
🔍 Checking staged files...
📝 Reviewing 3 files...
🤖 Sending to AI for review...
❌ Code review failed!

Issues found:
• src/utils.js: Magic string 'status' on line 15
  Fix: Use EVENT_FIELDS.STATUS constant

• src/api.js: Function getUserData() is 25 lines long
  Fix: Split into fetchUser() and processUser() functions

• src/components/User.tsx: Variable 'x' is not descriptive
  Fix: Rename to 'isUserLoggedIn' or similar
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key | - |
| `CLAUDE_API_KEY` | Your Claude API key | - |
| `AI_PROVIDER` | AI provider: `openai` or `claude` | `openai` |
| `AI_GUARD_TIMEOUT` | Review timeout in milliseconds | `30000` (30s) |
| `AI_GUARD_MAX_FILE_SIZE` | Max file size for review in bytes | `50000` (50KB) |

### Files

| File | Purpose |
|------|---------|
| `.code-rules.md` | Your custom coding rules |
| `.ai-guard-ignore` | Files to exclude from AI review |
| `.ai-guard-cache/` | Cache directory (auto-created) |

### Advanced Configuration

```bash
# Custom timeout (45 seconds)
export AI_GUARD_TIMEOUT=45000

# Custom file size limit (100KB)
export AI_GUARD_MAX_FILE_SIZE=100000

# Use Claude instead of OpenAI
export AI_PROVIDER=claude
export CLAUDE_API_KEY="sk-ant-your-key"
```

## 🎯 Supported File Types

- **JavaScript**: `.js`
- **TypeScript**: `.ts`
- **React**: `.jsx`, `.tsx`
- **Vue**: `.vue`
- **Python**: `.py`

## 🔧 Advanced Usage

### Custom Ignore Patterns
```bash
# Create project-specific ignore rules
cat > .ai-guard-ignore << 'EOF'
# Database configs
config/database.js
config/secrets.json

# Generated files
dist/*
build/*
*.generated.js

# Third-party
vendor/*
libs/*
EOF
```

### Different Rules Per Project
```bash
# Create project-specific rules
echo "# Strict React Rules\n- All components must have PropTypes" > .code-rules.md
```

### Timeout Configuration
```bash
# Longer timeout for large projects
export AI_GUARD_TIMEOUT=60000  # 60 seconds

# Commit with custom timeout
AI_GUARD_TIMEOUT=45000 git commit -m "feat: large refactor"
```

### Temporary Disable
```bash
# Skip AI review for this commit
git commit -m "docs: update README" --no-verify
```

### Clear Cache
```bash
# Remove cached reviews
rm -rf .ai-guard-cache
```

## 🏷️ Commit Message Flags

When AI review fails or times out, flags are automatically added to your commit messages:

### Timeout Cases
```
feat: add user authentication

[AI-REVIEW-FAILED: Timeout]
```

### Error Cases
```
fix: update validation logic

[AI-REVIEW-SKIPPED: Error]
```

**Flag Meanings:**
- **No flag** = AI review completed successfully ✅
- **`[AI-REVIEW-FAILED: Timeout]`** = Review timed out, manual review recommended ⏱️
- **`[AI-REVIEW-SKIPPED: Error]`** = Error occurred (no API key, network issue, etc.) ❌

This helps your team track which commits received AI review and which need manual attention.

## 🤔 Why AI Commit Guard?

| Problem | Solution |
|---------|----------|
| 😰 **Inconsistent code style across team** | ✅ Enforces rules automatically |
| 😴 **Bugs slip through manual review** | ✅ AI catches common mistakes |
| 😬 **Junior developers need guidance** | ✅ Educational feedback on every commit |
| 😤 **Code review takes too long** | ✅ Pre-filter obvious issues |
| 😵 **Forget to follow team standards** | ✅ Instant feedback at commit time |

## 🆚 Comparison

| Feature | AI Commit Guard | ESLint | Manual Review |
|---------|-----------------|--------|---------------|
| **Custom Rules** | ✅ Natural language | ⚠️ Config syntax | ✅ Human judgment |
| **Context Aware** | ✅ Understands logic | ❌ Syntax only | ✅ Full context |
| **Security Protection** | ✅ Auto-masks secrets | ❌ No security features | ⚠️ Manual vigilance |
| **Learning** | ✅ Teaches best practices | ❌ Just flags errors | ⚠️ Inconsistent |
| **Speed** | ✅ Instant (cached) | ✅ Very fast | ❌ Slow |
| **Flexibility** | ✅ Any rule you write | ⚠️ Predefined rules | ✅ Completely flexible |
| **Timeout Handling** | ✅ Graceful degradation | ✅ Always works | ✅ Always works |

## 🐛 Troubleshooting

### Common Issues

**"No AI API key found"**
```bash
# Check if key is set
echo $OPENAI_API_KEY

# Set the key
export OPENAI_API_KEY="sk-your-key-here"

# Make it permanent (add to ~/.bashrc or ~/.zshrc)
echo 'export OPENAI_API_KEY="sk-your-key-here"' >> ~/.bashrc
```

**"AI review timed out"**
```bash
# Increase timeout for large projects
export AI_GUARD_TIMEOUT=60000  # 60 seconds

# Check network connection
curl -I https://api.openai.com

# Try with smaller changesets
git add specific-file.js  # Instead of git add .
```

**"Sensitive files being reviewed"**
```bash
# Check ignore patterns
cat .ai-guard-ignore

# Add patterns for your project
echo "config/secrets.js" >> .ai-guard-ignore
echo "*.env.*" >> .ai-guard-ignore
```

**"Review is too slow"**
```bash
# Enable caching (default: enabled)
ls -la .ai-guard-cache/

# Reduce file size limit
export AI_GUARD_MAX_FILE_SIZE=25000  # 25KB

# Stage fewer files at once
git add src/specific-file.js
```

**"Not a git repository"**
```bash
# Initialize git first
git init
git add .
git commit -m "initial commit"
```

**"No staged files to review"**
```bash
# Make sure files are staged
git status
git add .
```

**"AI connection failed"**
```bash
# Check your API key and internet connection
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models
```

### Performance Tips

- 🏃‍♂️ **Enable caching**: Cache is enabled by default
- 📁 **Stage only what you need**: `git add specific-file.js`
- 🎯 **Use specific rules**: More specific rules = faster reviews
- 🧹 **Clean cache periodically**: `rm -rf .ai-guard-cache`

## 📈 Roadmap

- [ ] Support for more file types (Go, Rust, C++)
- [ ] Integration with popular IDEs
- [ ] Team dashboards and analytics
- [ ] Custom AI model fine-tuning
- [ ] Slack/Discord notifications
- [ ] CI/CD pipeline integration

## 🤝 Contributing

We love contributions! Here's how to help:

1. **🍴 Fork** the repository
2. **🌱 Create** your feature branch: `git checkout -b my-feature`
3. **✅ Commit** your changes: `git commit -m 'Add cool feature'`
4. **🚀 Push** to the branch: `git push origin my-feature`
5. **📝 Open** a Pull Request

## 📄 License

MIT © [Adem Alkan](https://github.com/ademalkan/ai-commit-guard)

## 💬 Support & Community

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/ademalkan/ai-commit-guard/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/ademalkan/ai-commit-guard/discussions)

---

**Made with ❤️ for better code quality**

*Star ⭐ this repo if it helps you write better code!*