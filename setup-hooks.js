#!/usr/bin/env node

const { execSync } = require('child_process');
const { writeFileSync, existsSync, mkdirSync, chmodSync, readFileSync, appendFileSync } = require('fs');

async function runSetup() {
    console.log('🚀 Setting up AI Commit Guard hooks...\n');

    try {
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

if (require.main === module) {
    runSetup();
}

module.exports = runSetup;