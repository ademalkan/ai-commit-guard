#!/usr/bin/env node

const { execSync } = require('child_process');
const { readFileSync, existsSync } = require('fs');
const chalk = require('chalk');
const crypto = require('crypto');
const path = require('path');

// Constants
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
  CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  BINARY_EXTENSIONS: [
    '.exe', '.dll', '.so', '.dylib', '.bin', '.dat', '.db', '.sqlite',
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp', '.ico',
    '.mp3', '.wav', '.flac', '.aac', '.ogg', '.mp4', '.avi', '.mkv', '.mov',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.zip', '.rar', '.tar', '.gz', '.7z', '.bz2',
    '.ttf', '.otf', '.woff', '.woff2', '.eot'
  ],
  EXCLUDE_PATTERNS: [
    // Build outputs
    'dist/*', 'build/*', 'out/*', 'target/*', 'bin/*', 'obj/*',
    // Dependencies
    'node_modules/*', 'vendor/*', '.venv/*', 'venv/*', '__pycache__/*',
    // Version control
    '.git/*', '.svn/*', '.hg/*',
    // IDE files
    '.vscode/*', '.idea/*', '*.swp', '*.swo', '*~',
    // OS files
    '.DS_Store', 'Thumbs.db', 'desktop.ini',
    // Large generated files
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
  // Sensitive files
  '*.env*', '*.key', '*.pem', '*.p12', '*.pfx', '*.keystore', '*.jks',
  '*password*', '*secret*', '*token*', '*api-key*', '*private*', '*credential*',

  // Log and temporary files
  '*.log', '*.tmp', '*.temp', '*.cache', '*.pid',

  // Lock and generated files
  'package-lock.json', 'yarn.lock', 'composer.lock', 'Gemfile.lock', 'Pipfile.lock',
  '*.min.js', '*.min.css', '*.bundle.*', '*-lock.*',

  // Build and distribution directories
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

    // Auto-detect based on available API keys
    if (process.env.OPENAI_API_KEY) return 'openai';
    if (process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY) return 'claude';
    if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) return 'gemini';
    if (process.env.COHERE_API_KEY) return 'cohere';

    // Check if Ollama is running locally
    try {
      const { execSync } = require('child_process');
      execSync('curl -s http://localhost:11434/api/tags', { timeout: 1000 });
      return 'ollama';
    } catch {
      // Ollama not available
    }

    return 'openai'; // default
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
      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        return chalk.yellow('  ' + line.trim());
      } else if (line.includes('Fix:') || line.includes('Solution:')) {
        return chalk.green('  ' + line);
      } else if (line.includes('Issue:') || line.includes('Problem:')) {
        return chalk.red('  ' + line);
      } else if (line.trim().length > 0) {
        return chalk.white('  ' + line);
      }
      return '';
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

    // Check sensitive keywords
    if (SENSITIVE_KEYWORDS.some(keyword =>
        lowerPath.includes(keyword) || lowerName.includes(keyword))) {
      return true;
    }

    // Check patterns
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

        // Skip binary files by extension
        const ext = path.extname(file).toLowerCase();
        if (CONFIG.BINARY_EXTENSIONS.includes(ext)) {
          return false;
        }

        return true;
      });

      const ignorePatterns = this.loadIgnorePatterns();
      const filteredFiles = allFiles.filter(file => !this.shouldIgnoreFile(file, ignorePatterns));

      // Additional check for binary files using git
      const nonBinaryFiles = filteredFiles.filter(file => {
        try {
          // Check if file is binary using git
          const result = execSync(`git diff --cached --numstat "${file}"`, { encoding: 'utf8' });
          // Binary files show as "-	-	filename" in numstat
          return !result.startsWith('-\t-\t');
        } catch {
          // If we can't check, assume it's text
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
      return this.loadRules(); // Return default rules
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

      // Special handling for Gemini API key in URL
      if (this.provider === 'gemini' && providerConfig.buildUrl) {
        url = providerConfig.buildUrl(this.apiKey);
        headers = providerConfig.headers(); // No API key in headers for Gemini
      }

      // Special handling for Ollama (no API key needed)
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
    return hash.substring(0, 16); // Use first 16 characters for shorter filenames
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
      // Ignore cache errors
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
      if (!this.apiKey && this.provider !== 'ollama') {
        this._logWarning('No AI API key found. Please set appropriate API key environment variable');
        this._logInfo('Supported providers: OpenAI, Claude, Gemini, Cohere, Ollama');
        this._commitWithFlag(CONFIG.COMMIT_FLAGS.ERROR);
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
            this._commitWithFlag(CONFIG.COMMIT_FLAGS.TIMEOUT);
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

        if (result.toLowerCase().includes('approve')) {
          const suggestions = result.replace(/^approve/i, '').trim();
          if (suggestions) {
            console.log(chalk.blue('💡 Suggestions:'));
            console.log(this._formatAIResponse(suggestions));
          }
        }

        // Add success flag to commit message
        this._commitWithSuccessFlag();
      }

    } catch (error) {
      this._logWarning(`Review failed: ${error.message}`);
      this._commitWithFlag(CONFIG.COMMIT_FLAGS.ERROR);
    }
  }

  _commitWithSuccessFlag() {
    try {
      const originalMessage = this._getOriginalCommitMessage();
      if (originalMessage) {
        const newMessage = `${originalMessage} [${CONFIG.COMMIT_FLAGS.SUCCESS}]`;
        this._logInfo(`Adding success flag: [${CONFIG.COMMIT_FLAGS.SUCCESS}]`);

        execSync(`git commit --amend --no-edit -m "${newMessage.replace(/"/g, '\\"')}"`, {
          stdio: 'inherit'
        });
      }
      process.exit(0);
    } catch (error) {
      // If we can't amend the commit, just exit successfully
      // The commit has already been made successfully at this point
      process.exit(0);
    }
  }

  _commitWithFlag(flagType) {
    try {
      const commitMsg = this._getOriginalCommitMessage() || 'commit';
      const newMsg = `${commitMsg} [${flagType}]`;

      this._logInfo(`Committing with flag: [${flagType}]`);

      execSync(`git commit --no-verify -m "${newMsg.replace(/"/g, '\\"')}"`, {
        stdio: 'inherit'
      });

      this._logSuccess('Commit completed with AI review flag');
      process.exit(0);

    } catch (error) {
      this._logError('Could not commit. Please commit manually with flag:');
      this._logInfo(`   git commit -m "your message [${flagType}]"`);
      process.exit(1);
    }
  }

  _getOriginalCommitMessage() {
    try {
      // Check command line arguments
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

      // Check environment variable
      if (process.env.GIT_COMMIT_MESSAGE) {
        return process.env.GIT_COMMIT_MESSAGE;
      }

      // Check git commit message file
      const gitDir = execSync('git rev-parse --git-dir', { encoding: 'utf8' }).trim();
      const commitMsgFile = path.join(gitDir, 'COMMIT_EDITMSG');
      if (existsSync(commitMsgFile)) {
        const content = readFileSync(commitMsgFile, 'utf8').trim();
        return content.split('\n')[0]; // First line only
      }

      return null;
    } catch (error) {
      return null;
    }
  }
}

// Export for testing and module usage
if (require.main === module) {
  new AICommitGuard().run();
}

module.exports = AICommitGuard;