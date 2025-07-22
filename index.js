#!/usr/bin/env node

const { execSync } = require('child_process');
const { readFileSync, existsSync, writeFileSync, mkdirSync, chmodSync, appendFileSync } = require('fs');
const chalk = require('chalk');
const crypto = require('crypto');
const path = require('path');

const CONFIG = {
  TIMEOUT: {
    DEFAULT: 30000,
    MIN: 5000,
    MAX: 120000
  },
  FILE_SIZE: {
    DEFAULT_MAX: 50000,
    MIN: 1000,
    MAX: 1000000
  },
  CACHE_DURATION: 24 * 60 * 60 * 1000,
  BINARY_EXTENSIONS: [
    '.exe', '.dll', '.so', '.dylib', '.bin', '.dat', '.db', '.sqlite',
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp', '.ico',
    '.mp3', '.wav', '.flac', '.aac', '.ogg', '.mp4', '.avi', '.mkv', '.mov',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.zip', '.rar', '.tar', '.gz', '.7z', '.bz2',
    '.ttf', '.otf', '.woff', '.woff2', '.eot'
  ],
  EXCLUDE_PATTERNS: [
    'dist/*', 'build/*', 'out/*', 'target/*', 'bin/*', 'obj/*',
    'node_modules/*', 'vendor/*', '.venv/*', 'venv/*', '__pycache__/*',
    '.git/*', '.svn/*', '.hg/*',
    '.vscode/*', '.idea/*', '*.swp', '*.swo', '*~',
    '.DS_Store', 'Thumbs.db', 'desktop.ini',
    '*.min.js', '*.min.css', '*.bundle.*', '*-lock.json', '*.lock'
  ],
  FILES: {
    RULES: '.code-rules.md',
    IGNORE: '.ai-guard-ignore',
    CACHE_DIR: '.ai-guard-cache'
  },
  COMMIT_FLAGS: {
    SUCCESS: 'AI-REVIEW-PASSED',
    TIMEOUT: 'AI-REVIEW-FAILED-TIMEOUT',
    ERROR: 'AI-REVIEW-SKIPPED-ERROR'
  }
};

const DEFAULT_IGNORE_PATTERNS = [
  '*.env*', '*.key', '*.pem', '*.p12', '*.pfx', '*.keystore', '*.jks',
  '*password*', '*secret*', '*token*', '*api-key*', '*private*', '*credential*',
  '*.log', '*.tmp', '*.temp', '*.cache', '*.pid',
  'package-lock.json', 'yarn.lock', 'composer.lock', 'Gemfile.lock', 'Pipfile.lock',
  '*.min.js', '*.min.css', '*.bundle.*', '*-lock.*',
  '.ai-guard-cache/*',
  '.ai-guard-result',
  ...CONFIG.EXCLUDE_PATTERNS
];

const SENSITIVE_KEYWORDS = ['password', 'secret', 'token', 'key', 'private', 'credential'];

const AI_PROVIDERS = {
  OPENAI: {
    name: 'openai',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4',
    headers: (apiKey) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }),
    payload: (prompt, model) => ({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 1000
    }),
    extractResponse: (data) => data.choices[0].message.content
  },
  CLAUDE: {
    name: 'claude',
    apiUrl: 'https://api.anthropic.com/v1/messages',
    model: 'claude-3-sonnet-20240229',
    headers: (apiKey) => ({
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    }),
    payload: (prompt, model) => ({
      model,
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    }),
    extractResponse: (data) => data.content[0].text
  },
  GEMINI: {
    name: 'gemini',
    apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    model: 'gemini-pro',
    headers: (apiKey) => ({
      'Content-Type': 'application/json'
    }),
    payload: (prompt) => ({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1000
      }
    }),
    extractResponse: (data) => data.candidates[0].content.parts[0].text,
    buildUrl: (apiKey) => `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`
  },
  OLLAMA: {
    name: 'ollama',
    apiUrl: 'http://localhost:11434/api/generate',
    model: 'codellama',
    headers: () => ({
      'Content-Type': 'application/json'
    }),
    payload: (prompt, model) => ({
      model,
      prompt,
      stream: false,
      options: { temperature: 0.1 }
    }),
    extractResponse: (data) => data.response
  },
  COHERE: {
    name: 'cohere',
    apiUrl: 'https://api.cohere.ai/v1/generate',
    model: 'command',
    headers: (apiKey) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }),
    payload: (prompt, model) => ({
      model,
      prompt,
      max_tokens: 1000,
      temperature: 0.1
    }),
    extractResponse: (data) => data.generations[0].text
  }
};

class AICommitGuard {
  constructor() {
    this.apiKey = this._getApiKey();
    this.provider = this._getProvider();
    this.timeout = this._getTimeout();
    this.maxFileSize = this._getMaxFileSize();
    this.model = this._getModel();
  }

  _getApiKey() {
    return process.env.OPENAI_API_KEY ||
        process.env.CLAUDE_API_KEY ||
        process.env.ANTHROPIC_API_KEY ||
        process.env.GEMINI_API_KEY ||
        process.env.GOOGLE_API_KEY ||
        process.env.COHERE_API_KEY ||
        process.env.AI_API_KEY;
  }

  _getProvider() {
    const envProvider = process.env.AI_PROVIDER?.toLowerCase();

    if (envProvider && AI_PROVIDERS[envProvider.toUpperCase()]) {
      return envProvider;
    }

    if (process.env.OPENAI_API_KEY) return 'openai';
    if (process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY) return 'claude';
    if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) return 'gemini';
    if (process.env.COHERE_API_KEY) return 'cohere';

    try {
      const { execSync } = require('child_process');
      execSync('curl -s http://localhost:11434/api/tags', { timeout: 1000 });
      return 'ollama';
    } catch {
    }

    return 'openai';
  }

  _getTimeout() {
    const timeout = parseInt(process.env.AI_GUARD_TIMEOUT) || CONFIG.TIMEOUT.DEFAULT;
    return Math.max(CONFIG.TIMEOUT.MIN, Math.min(CONFIG.TIMEOUT.MAX, timeout));
  }

  _getMaxFileSize() {
    const size = parseInt(process.env.AI_GUARD_MAX_FILE_SIZE) || CONFIG.FILE_SIZE.DEFAULT_MAX;
    return Math.max(CONFIG.FILE_SIZE.MIN, Math.min(CONFIG.FILE_SIZE.MAX, size));
  }

  _getModel() {
    const provider = this.provider.toUpperCase();
    return process.env.AI_MODEL ||
        process.env[`${provider}_MODEL`] ||
        AI_PROVIDERS[provider].model;
  }

  _logInfo(message) {
    console.log(chalk.blue('ℹ️ ') + chalk.white(message));
  }

  _logSuccess(message) {
    console.log(chalk.green('✅ ') + chalk.white(message));
  }

  _logWarning(message) {
    console.log(chalk.yellow('⚠️  ') + chalk.white(message));
  }

  _logError(message) {
    console.log(chalk.red('❌ ') + chalk.white(message));
  }

  _logAI(message) {
    console.log(chalk.magenta('🤖 ') + chalk.cyan(message));
  }

  _formatAIResponse(response) {
    const lines = response.split('\n');
    return lines.map(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return '';

      if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.match(/^\d+\./)) {
        return chalk.yellow('  ' + trimmedLine);
      } else if (trimmedLine.includes('Fix:') || trimmedLine.includes('Solution:') || trimmedLine.includes('Improvement:')) {
        return chalk.green('  ' + trimmedLine);
      } else if (trimmedLine.includes('Issue:') || trimmedLine.includes('Problem:') || trimmedLine.includes('Error:')) {
        return chalk.red('  ' + trimmedLine);
      } else if (trimmedLine.includes('Great job') || trimmedLine.includes('excellent') || trimmedLine.includes('good')) {
        return chalk.green('  ' + trimmedLine);
      } else {
        return chalk.white('  ' + trimmedLine);
      }
    }).join('\n');
  }

  loadIgnorePatterns() {
    const patterns = [...DEFAULT_IGNORE_PATTERNS];

    if (existsSync(CONFIG.FILES.IGNORE)) {
      try {
        const customPatterns = readFileSync(CONFIG.FILES.IGNORE, 'utf8')
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#'));
        patterns.push(...customPatterns);
      } catch (error) {
        this._logWarning(`Could not read ${CONFIG.FILES.IGNORE}: ${error.message}`);
      }
    }

    return patterns;
  }

  shouldIgnoreFile(filePath, patterns) {
    const fileName = path.basename(filePath);
    const lowerPath = filePath.toLowerCase();
    const lowerName = fileName.toLowerCase();

    if (SENSITIVE_KEYWORDS.some(keyword =>
        lowerPath.includes(keyword) || lowerName.includes(keyword))) {
      return true;
    }

    return patterns.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        return regex.test(filePath) || regex.test(fileName);
      }
      return filePath.includes(pattern) || fileName.includes(pattern);
    });
  }

  getStagedFiles() {
    try {
      const output = execSync('git diff --cached --name-only', { encoding: 'utf8' });
      const allFiles = output.trim().split('\n').filter(file => {
        if (!file) return false;

        const ext = path.extname(file).toLowerCase();
        if (CONFIG.BINARY_EXTENSIONS.includes(ext)) {
          return false;
        }

        return true;
      });

      const ignorePatterns = this.loadIgnorePatterns();
      const filteredFiles = allFiles.filter(file => !this.shouldIgnoreFile(file, ignorePatterns));

      const nonBinaryFiles = filteredFiles.filter(file => {
        try {
          const result = execSync(`git diff --cached --numstat "${file}"`, { encoding: 'utf8' });
          return !result.startsWith('-\t-\t');
        } catch {
          return true;
        }
      });

      const ignoredCount = allFiles.length - nonBinaryFiles.length;
      if (ignoredCount > 0) {
        this._logInfo(`🔒 Ignored ${ignoredCount} binary/sensitive/excluded files`);
      }

      return nonBinaryFiles;
    } catch (error) {
      this._logWarning('Could not get staged files');
      return [];
    }
  }

  getChanges(files) {
    return files.map(file => {
      try {
        const diff = execSync(`git diff --cached "${file}"`, { encoding: 'utf8' });

        if (diff.length > this.maxFileSize) {
          this._logWarning(`${file} is too large (${(diff.length/1024).toFixed(1)}KB), skipping detailed review`);
          return `--- ${file} ---\n[File too large for AI review - ${(diff.length/1024).toFixed(1)}KB]`;
        }

        const filteredDiff = this.filterSensitiveContent(diff);
        return `--- ${file} ---\n${filteredDiff}`;
      } catch (error) {
        this._logWarning(`Could not get diff for ${file}: ${error.message}`);
        return '';
      }
    }).filter(change => change).join('\n\n');
  }

  filterSensitiveContent(content) {
    return content
        .replace(/(['"`])sk-[a-zA-Z0-9]{32,}(['"`])/g, '$1[API_KEY_HIDDEN]$2')
        .replace(/(['"`])[a-zA-Z0-9]{32,}(['"`])/g, (match, quote1, quote2) => {
          const lowerMatch = match.toLowerCase();
          if (SENSITIVE_KEYWORDS.some(keyword => lowerMatch.includes(keyword))) {
            return `${quote1}[SECRET_HIDDEN]${quote2}`;
          }
          return match;
        })
        .replace(/password\s*[:=]\s*['"`][^'"`]+['"`]/gi, 'password: "[PASSWORD_HIDDEN]"')
        .replace(/token\s*[:=]\s*['"`][^'"`]+['"`]/gi, 'token: "[TOKEN_HIDDEN]"')
        .replace(/(secret|key)\s*[:=]\s*['"`][^'"`]+['"`]/gi, '$1: "[SECRET_HIDDEN]"');
  }

  loadRules() {
    if (!existsSync(CONFIG.FILES.RULES)) {
      return `
# Universal Code Review Rules

## Code Quality & Maintainability
- Use meaningful and descriptive names for variables, functions, and classes
- Keep functions focused and concise (prefer under 20-30 lines)
- Avoid magic numbers and strings - use named constants or configuration
- Remove unused variables, imports, and dead code
- Add appropriate comments for complex logic and business rules

## Best Practices
- Follow consistent naming conventions for your language/framework
- Handle errors appropriately - don't ignore or suppress them silently
- Validate inputs and handle edge cases
- Use proper logging instead of debug print statements
- Follow the DRY principle - avoid code duplication

## Security & Safety
- Never commit sensitive data (passwords, API keys, tokens, credentials)
- Validate and sanitize all user inputs
- Use secure coding practices appropriate for your language
- Don't hardcode configuration values that should be external
- Be careful with file permissions and access controls

## Structure & Organization
- Organize code logically with proper separation of concerns
- Use consistent indentation and formatting
- Keep related code together
- Make sure public APIs are well documented
- Consider backward compatibility when making changes

## Testing & Reliability
- Include appropriate error handling and recovery
- Consider edge cases and boundary conditions
- Make sure changes don't break existing functionality
- Add tests for new features when applicable
- Use meaningful commit messages that explain the "why" not just the "what"

Review all code changes regardless of programming language, markup, configuration, or documentation files.
      `.trim();
    }

    try {
      return readFileSync(CONFIG.FILES.RULES, 'utf8');
    } catch (error) {
      this._logWarning(`Could not read ${CONFIG.FILES.RULES}: ${error.message}`);
      return this.loadRules();
    }
  }

  async callWithTimeout(apiCall, timeoutMs) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`AI review timeout after ${timeoutMs/1000} seconds`));
      }, timeoutMs);

      apiCall()
          .then(result => {
            clearTimeout(timer);
            resolve(result);
          })
          .catch(error => {
            clearTimeout(timer);
            reject(error);
          });
    });
  }

  async callAI(prompt) {
    const providerConfig = AI_PROVIDERS[this.provider.toUpperCase()];

    if (!providerConfig) {
      throw new Error(`Unsupported AI provider: ${this.provider}`);
    }

    const apiCall = async () => {
      let url = providerConfig.apiUrl;
      let headers = providerConfig.headers(this.apiKey);
      let payload = providerConfig.payload(prompt, this.model);

      if (this.provider === 'gemini' && providerConfig.buildUrl) {
        url = providerConfig.buildUrl(this.apiKey);
        headers = providerConfig.headers();
      }

      if (this.provider === 'ollama') {
        headers = providerConfig.headers();
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed (${response.status}): ${errorText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || JSON.stringify(data.error));
      }

      return providerConfig.extractResponse(data);
    };

    return await this.callWithTimeout(apiCall, this.timeout);
  }

  createPrompt(changes, rules) {
    return `
You are an expert code reviewer. Please review the following code changes against the established rules and best practices.

## Review Guidelines:
${rules}

## Code Changes to Review:
${changes}

## Instructions:
- Review ALL changes regardless of programming language (JavaScript, Python, Go, Rust, Java, C++, HTML, CSS, YAML, JSON, Markdown, configuration files, etc.)
- Look for code quality issues, potential bugs, security concerns, and adherence to best practices
- Consider the context and purpose of the changes
- Be constructive and specific in your feedback

## Response Format:
If there are issues that should prevent the commit:
- Start response with "REJECT"
- List specific problems with file names and locations when possible
- Provide clear, actionable solutions for each issue
- Prioritize critical issues (security, bugs) over style issues

If the code meets standards:
- Start response with "APPROVE"
- Optionally suggest minor improvements or praise good practices
- Keep suggestions brief and constructive

## Examples of what to look for:
- Security vulnerabilities (exposed secrets, injection risks, unsafe operations)
- Logic errors and potential bugs
- Performance issues or inefficient patterns
- Maintainability concerns (unclear naming, complex logic)
- Missing error handling
- Configuration or documentation issues
- Inconsistent formatting or style (only if severe)

Focus on functionality, security, and maintainability over minor style preferences.
    `.trim();
  }

  getCacheKey(changes) {
    const hash = crypto.createHash('sha256').update(changes + this.provider + this.model).digest('hex');
    return hash.substring(0, 16);
  }

  getCache(key) {
    try {
      const cacheFile = path.join(CONFIG.FILES.CACHE_DIR, `${key}.json`);
      if (existsSync(cacheFile)) {
        const data = JSON.parse(readFileSync(cacheFile, 'utf8'));
        if (Date.now() - data.timestamp < CONFIG.CACHE_DURATION) {
          return data.result;
        }
      }
    } catch (error) {
    }
    return null;
  }

  setCache(key, result) {
    try {
      const { mkdirSync, writeFileSync } = require('fs');

      if (!existsSync(CONFIG.FILES.CACHE_DIR)) {
        mkdirSync(CONFIG.FILES.CACHE_DIR, { recursive: true });
      }

      const cacheFile = path.join(CONFIG.FILES.CACHE_DIR, `${key}.json`);
      const cacheData = {
        result,
        timestamp: Date.now(),
        provider: this.provider,
        model: this.model
      };

      writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2));
    } catch (error) {
      this._logWarning(`Could not write cache: ${error.message}`);
    }
  }

  async run() {
    try {
      if (process.argv.includes('--setup')) {
        return this._runSetup();
      }

      if (process.argv.includes('--commit-msg')) {
        return this._handleCommitMsg();
      }

      if (process.argv.includes('--version') || process.argv.includes('-v')) {
        return this._showVersion();
      }

      if (process.argv.includes('--help') || process.argv.includes('-h')) {
        return this._showHelp();
      }

      if (!this.apiKey && this.provider !== 'ollama') {
        this._logWarning('No AI API key found. Please set appropriate API key environment variable');
        this._logInfo('Supported providers: OpenAI, Claude, Gemini, Cohere, Ollama');
        this._storeReviewResult('ERROR');
        process.exit(0);
        return;
      }

      this._logInfo('🔍 Checking staged files...');

      const stagedFiles = this.getStagedFiles();
      if (stagedFiles.length === 0) {
        this._logSuccess('No relevant files to review');
        process.exit(0);
      }

      this._logInfo(`📝 Reviewing ${stagedFiles.length} files using ${this.provider.toUpperCase()}...`);

      const changes = this.getChanges(stagedFiles);
      if (!changes.trim()) {
        this._logWarning('No meaningful changes to review');
        process.exit(0);
      }

      const cacheKey = this.getCacheKey(changes);
      let result = this.getCache(cacheKey);

      if (result) {
        this._logInfo('📦 Using cached result');
      } else {
        this._logAI(`Sending to ${this.provider.toUpperCase()} for review (timeout: ${this.timeout/1000}s)...`);

        try {
          const rules = this.loadRules();
          const prompt = this.createPrompt(changes, rules);
          result = await this.callAI(prompt);
          this.setCache(cacheKey, result);
        } catch (timeoutError) {
          if (timeoutError.message.includes('timeout')) {
            this._logWarning(`AI review timed out after ${this.timeout/1000} seconds`);
            this._storeReviewResult('TIMEOUT');
            process.exit(0);
            return;
          }
          throw timeoutError;
        }
      }

      if (result.toLowerCase().startsWith('reject')) {
        this._logError('Code review failed!');
        console.log(this._formatAIResponse(result.replace(/^reject/i, '').trim()));
        process.exit(1);
      } else {
        this._logSuccess('Code review passed!');
        this._storeReviewResult('SUCCESS');
        process.exit(0);
      }

    } catch (error) {
      this._logWarning(`Review failed: ${error.message}`);
      this._storeReviewResult('ERROR');
      process.exit(0);
    }
  }

  _runSetup() {
    try {
      console.log('🚀 Setting up AI Commit Guard hooks...\n');

      try {
        execSync('git rev-parse --git-dir', { stdio: 'ignore' });
      } catch (error) {
        console.log('❌ Not a git repository. Please run this in a git repository.');
        console.log('💡 Initialize git first: git init');
        process.exit(1);
      }

      if (!existsSync('.husky')) {
        console.log('📦 Installing husky...');

        if (!existsSync('package.json')) {
          console.log('📝 Creating package.json...');
          execSync('npm init -y', { stdio: 'inherit' });
        }

        try {
          execSync('npm install --save-dev husky', { stdio: 'inherit' });
          execSync('npx husky init', { stdio: 'inherit' });
          console.log('✅ Husky installed successfully\n');
        } catch (error) {
          console.log('⚠️  Could not install husky automatically. Please install manually:');
          console.log('   npm install --save-dev husky');
          console.log('   npx husky init\n');
        }
      }

      if (!existsSync('.husky')) {
        mkdirSync('.husky', { recursive: true });
      }

      console.log('🔍 Setting up pre-commit hook...');
      const preCommitHook = `npx ai-commit-guard`;
      writeFileSync('.husky/pre-commit', preCommitHook);

      if (process.platform !== 'win32') {
        try {
          chmodSync('.husky/pre-commit', '755');
        } catch (error) {
        }
      }

      console.log('📝 Setting up commit-msg hook...');
      const commitMsgHook = `npx ai-commit-guard --commit-msg "$1"`;
      writeFileSync('.husky/commit-msg', commitMsgHook);

      if (process.platform !== 'win32') {
        try {
          chmodSync('.husky/commit-msg', '755');
        } catch (error) {
        }
      }

      console.log('📁 Updating .gitignore...');
      const gitignoreEntries = `
# AI Commit Guard
.ai-guard-cache/
.ai-guard-result
`;

      let gitignoreContent = '';
      if (existsSync('.gitignore')) {
        gitignoreContent = readFileSync('.gitignore', 'utf8');
      }

      if (!gitignoreContent.includes('.ai-guard-cache/')) {
        appendFileSync('.gitignore', gitignoreEntries);
        console.log('✅ Added AI Commit Guard entries to .gitignore');
      }

      if (!existsSync('.ai-guard-ignore')) {
        console.log('📋 Creating sample .ai-guard-ignore...');
        const sampleIgnore = `# AI Commit Guard - Files to exclude from review

# Sensitive files (automatically ignored by default)
*.env*
*.key
*secret*
*password*

# Project-specific ignores
dist/*
build/*
generated/*
legacy-code/*
third-party/*

# Large files
*.min.js
*.bundle.*
package-lock.json
`;
        writeFileSync('.ai-guard-ignore', sampleIgnore);
      }

      if (!existsSync('.code-rules.md')) {
        console.log('📜 Creating sample .code-rules.md...');
        const sampleRules = `# Project Code Review Rules

## Code Quality
- Use meaningful variable and function names
- Keep functions under 20-30 lines when possible  
- No magic numbers or strings - use named constants
- Remove unused imports and variables
- Add comments for complex business logic

## Security & Best Practices
- Never commit sensitive data (API keys, passwords, tokens)
- Validate all user inputs
- Use proper error handling with try-catch blocks
- Follow consistent naming conventions
- Use parameterized queries to prevent SQL injection

## Project-Specific Rules
- Add your team's specific coding standards here
- Language-specific best practices
- Framework conventions (React, Vue, etc.)
- Database and API guidelines
`;
        writeFileSync('.code-rules.md', sampleRules);
      }

      console.log('\n🎉 AI Commit Guard setup completed successfully!\n');

      console.log('📋 What happens now:');
      console.log('  1. pre-commit: AI reviews your code changes');
      console.log('  2. commit-msg: Adds appropriate flags to commit message\n');

      console.log('📁 Configuration files:');
      console.log('  .code-rules.md       - Customize your coding standards');
      console.log('  .ai-guard-ignore     - Exclude files from AI review\n');

      console.log('🔑 Set your AI API key:');
      console.log('  export OPENAI_API_KEY="sk-your-openai-key"');
      console.log('  # or');
      console.log('  export CLAUDE_API_KEY="sk-ant-your-claude-key"');
      console.log('  export AI_PROVIDER="claude"\n');

      console.log('🚀 Try it now:');
      console.log('  git add .');
      console.log('  git commit -m "feat: your feature description"');
      console.log('\n💡 Need help? Check the README.md for more configuration options.');

      process.exit(0);

    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      console.log('\n🔧 Manual setup instructions:');
      console.log('1. Install husky: npm install --save-dev husky');
      console.log('2. Initialize: npx husky init');
      console.log('3. Add pre-commit hook: echo "npx ai-commit-guard" > .husky/pre-commit');
      console.log('4. Add commit-msg hook: echo "npx ai-commit-guard --commit-msg \\$1" > .husky/commit-msg');
      console.log('5. Set permissions: chmod +x .husky/*');
      process.exit(1);
    }
  }

  _handleCommitMsg() {
    try {
      const commitMsgFile = process.argv[process.argv.indexOf('--commit-msg') + 1];
      if (!commitMsgFile || !existsSync(commitMsgFile)) {
        process.exit(0);
      }

      const currentMsg = readFileSync(commitMsgFile, 'utf8').trim();
      const reviewResult = this._getStoredReviewResult();

      if (!reviewResult) {
        process.exit(0);
      }

      let flag;
      switch (reviewResult) {
        case 'SUCCESS':
          flag = CONFIG.COMMIT_FLAGS.SUCCESS;
          break;
        case 'TIMEOUT':
          flag = CONFIG.COMMIT_FLAGS.TIMEOUT;
          break;
        case 'ERROR':
          flag = CONFIG.COMMIT_FLAGS.ERROR;
          break;
        default:
          process.exit(0);
      }

      if (!currentMsg.includes(`[${flag}]`)) {
        const newMsg = `${currentMsg} [${flag}]`;
        writeFileSync(commitMsgFile, newMsg);
        this._logInfo(`Added flag: [${flag}]`);
      }

      this._clearStoredReviewResult();
      process.exit(0);

    } catch (error) {
      this._logWarning(`Could not handle commit message: ${error.message}`);
      process.exit(0);
    }
  }

  _storeReviewResult(result) {
    try {
      writeFileSync('.ai-guard-result', result);
    } catch (error) {
    }
  }

  _getStoredReviewResult() {
    try {
      if (existsSync('.ai-guard-result')) {
        return readFileSync('.ai-guard-result', 'utf8').trim();
      }
    } catch (error) {
    }
    return null;
  }

  _clearStoredReviewResult() {
    try {
      const fs = require('fs');
      if (existsSync('.ai-guard-result')) {
        fs.unlinkSync('.ai-guard-result');
      }
    } catch (error) {
    }
  }

  _showVersion() {
    const packagePath = path.join(__dirname, 'package.json');
    let version = '2.0.0';

    try {
      if (existsSync(packagePath)) {
        const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
        version = pkg.version || version;
      }
    } catch (error) {
    }

    console.log(`🤖 AI Commit Guard v${version}`);
    console.log('Universal AI-powered pre-commit code review tool');
    console.log('');
    console.log('Supported AI Providers:');
    console.log('  • OpenAI GPT-4');
    console.log('  • Anthropic Claude');
    console.log('  • Google Gemini');
    console.log('  • Cohere Command');
    console.log('  • Ollama (Local)');
    console.log('');
    console.log('More info: https://github.com/ademalkan/ai-commit-guard');
    process.exit(0);
  }

  _showHelp() {
    console.log('🤖 AI Commit Guard - Universal AI-powered code review tool');
    console.log('');
    console.log('USAGE:');
    console.log('  ai-commit-guard [OPTIONS]');
    console.log('');
    console.log('OPTIONS:');
    console.log('  --setup              Setup AI Commit Guard hooks in current project');
    console.log('  --commit-msg <file>  Handle commit message (used by git hooks)');
    console.log('  --version, -v        Show version information');
    console.log('  --help, -h           Show this help message');
    console.log('');
    console.log('ENVIRONMENT VARIABLES:');
    console.log('  OPENAI_API_KEY       OpenAI API key');
    console.log('  CLAUDE_API_KEY       Anthropic Claude API key');
    console.log('  GEMINI_API_KEY       Google Gemini API key');
    console.log('  COHERE_API_KEY       Cohere API key');
    console.log('  AI_PROVIDER          AI provider (openai|claude|gemini|cohere|ollama)');
    console.log('  AI_MODEL             Specific model name to use');
    console.log('  AI_GUARD_TIMEOUT     Review timeout in milliseconds (default: 30000)');
    console.log('  AI_GUARD_MAX_FILE_SIZE  Max file size in bytes (default: 50000)');
    console.log('');
    console.log('EXAMPLES:');
    console.log('  # Setup in new project');
    console.log('  ai-commit-guard --setup');
    console.log('');
    console.log('  # Set API key and commit');
    console.log('  export OPENAI_API_KEY="sk-your-key"');
    console.log('  git add .');
    console.log('  git commit -m "feat: add new feature"');
    console.log('');
    console.log('  # Use different AI provider');
    console.log('  export CLAUDE_API_KEY="sk-ant-your-key"');
    console.log('  export AI_PROVIDER="claude"');
    console.log('');
    console.log('  # Use local Ollama');
    console.log('  export AI_PROVIDER="ollama"');
    console.log('');
    console.log('CONFIGURATION FILES:');
    console.log('  .code-rules.md       Custom coding rules and standards');
    console.log('  .ai-guard-ignore     Files to exclude from AI review');
    console.log('');
    console.log('For more information, visit:');
    console.log('  https://github.com/ademalkan/ai-commit-guard');
    process.exit(0);
  }

  _getOriginalCommitMessage() {
    try {
      if (process.argv[2] && existsSync(process.argv[2])) {
        const commitMsgFile = process.argv[2];
        const content = readFileSync(commitMsgFile, 'utf8').trim();
        if (content && !content.startsWith('#')) {
          return content.split('\n')[0];
        }
      }

      const gitDir = execSync('git rev-parse --git-dir', { encoding: 'utf8' }).trim();
      const commitMsgFile = path.join(gitDir, 'COMMIT_EDITMSG');
      if (existsSync(commitMsgFile)) {
        const content = readFileSync(commitMsgFile, 'utf8').trim();
        if (content && !content.startsWith('#')) {
          return content.split('\n')[0];
        }
      }

      const args = process.argv.slice(2);
      for (let i = 0; i < args.length; i++) {
        if (args[i] === '-m' && args[i + 1]) {
          return args[i + 1];
        }
        if (args[i].startsWith('-m=')) {
          return args[i].substring(3);
        }
        if (args[i].startsWith('-m') && args[i].length > 2) {
          return args[i].substring(2);
        }
      }

      if (process.env.GIT_COMMIT_MESSAGE) {
        return process.env.GIT_COMMIT_MESSAGE;
      }

      return null;
    } catch (error) {
      this._logWarning(`Could not get commit message: ${error.message}`);
      return null;
    }
  }
}

if (require.main === module) {
  new AICommitGuard().run();
}

module.exports = AICommitGuard;