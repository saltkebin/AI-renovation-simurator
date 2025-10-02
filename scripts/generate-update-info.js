#!/usr/bin/env node

/**
 * Generate update information from git commits
 *
 * This script reads recent git commits and generates user-friendly
 * update information for the UPDATE_HISTORY in constants.ts
 *
 * Usage:
 *   node scripts/generate-update-info.js
 *   node scripts/generate-update-info.js --commits 5
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Number of commits to analyze
const commitCount = process.argv.includes('--commits')
  ? parseInt(process.argv[process.argv.indexOf('--commits') + 1])
  : 3;

// Get recent commits with their dates and messages
function getRecentCommits() {
  try {
    const output = execSync(
      `git log -${commitCount} --pretty=format:"%ad|%s" --date=format:"%Y-%m-%d"`,
      { encoding: 'utf-8' }
    );

    return output.split('\n').filter(line => line.trim()).map(line => {
      const parts = line.split('|');
      const date = parts[0] || '';
      const subject = parts.slice(1).join('|') || '';
      return { date, subject, body: '' };
    });
  } catch (error) {
    console.error('Error reading git commits:', error.message);
    return [];
  }
}

// Convert technical commit message to user-friendly update info
function convertToUserFriendly(commit) {
  const { date, subject, body } = commit;

  // Extract feature type from conventional commits format
  const conventionalCommitRegex = /^(feat|fix|docs|style|refactor|perf|test|chore)(\(.+?\))?:\s*(.+)$/;
  const match = subject.match(conventionalCommitRegex);

  let title = subject;
  let description = subject;
  let shouldInclude = true;

  if (match) {
    const [, type, scope, message] = match;

    // Skip internal/developer-only commits
    if (type === 'docs' || type === 'test' || type === 'chore' || type === 'refactor') {
      shouldInclude = false;
    }

    // Skip if message contains internal keywords
    const internalKeywords = [
      'リファクタ', 'refactor', 'テスト', 'test',
      'ドキュメント', 'document', 'ビルド', 'build',
      'デバッグ', 'debug', 'ログ', 'log',
      '依存関係', 'dependency', 'dependencies',
      'CI/CD', 'pipeline', 'workflow'
    ];

    if (internalKeywords.some(keyword => message.toLowerCase().includes(keyword.toLowerCase()))) {
      shouldInclude = false;
    }

    title = message.trim();

    // Generate description based on type
    if (type === 'feat') {
      description = `${message}ができるようになりました。`;
    } else if (type === 'fix') {
      description = `${message}に関する問題を修正し、より使いやすくなりました。`;
    } else if (type === 'style') {
      // Only include UI/UX improvements, not code style
      if (message.toLowerCase().includes('ui') ||
          message.toLowerCase().includes('デザイン') ||
          message.toLowerCase().includes('表示')) {
        description = `${message}を改善しました。`;
      } else {
        shouldInclude = false;
      }
    } else {
      description = `${message}を更新しました。`;
    }
  } else {
    // No conventional format, use subject as-is
    // Skip if contains internal keywords
    const internalKeywords = [
      'リファクタ', 'refactor', 'テスト', 'test',
      'ドキュメント', 'document', 'ビルド', 'build',
      'デバッグ', 'debug', 'ログ', 'log',
      '依存関係', 'dependency', 'CI/CD'
    ];

    if (internalKeywords.some(keyword => subject.toLowerCase().includes(keyword.toLowerCase()))) {
      shouldInclude = false;
    }

    // Try to make it more user-friendly
    if (subject.includes('追加') || subject.includes('作成')) {
      description = `${subject}しました。`;
    } else if (subject.includes('実装')) {
      description = `${subject}を完了しました。`;
    } else if (subject.includes('修正') || subject.includes('改善')) {
      description = `${subject}により、より使いやすくなりました。`;
    } else {
      // Default: just add period
      description = `${subject}`;
      if (!description.endsWith('。') && !description.endsWith('.')) {
        description += 'を実施しました。';
      }
    }

    title = subject;
  }

  // If body contains more detailed info, use it
  if (body && body.length > 10) {
    description = body;
  }

  // Clean up redundant phrases
  description = description.replace(/を追加を追加/, 'を追加');
  description = description.replace(/を実装を実装/, 'を実装');
  description = description.replace(/しましたしました/, 'しました');
  description = description.replace(/機能機能/, '機能');

  return {
    date,
    title: title.trim(),
    description: description.trim(),
    shouldInclude
  };
}

// Generate the UPDATE_HISTORY array code
function generateUpdateHistoryCode(updates) {
  const entries = updates.map(update => {
    return `  {
    date: '${update.date}',
    title: '${update.title}',
    description: '${update.description}'
  }`;
  }).join(',\n');

  return `export const UPDATE_HISTORY: UpdateInfo[] = [
${entries}
];`;
}

// Read current constants.ts file
function getCurrentConstantsContent() {
  const constantsPath = path.join(__dirname, '..', 'constants.ts');
  return fs.readFileSync(constantsPath, 'utf-8');
}

// Update constants.ts with new UPDATE_HISTORY
function updateConstantsFile(newHistoryCode) {
  const constantsPath = path.join(__dirname, '..', 'constants.ts');
  let content = getCurrentConstantsContent();

  // Replace the UPDATE_HISTORY array
  const regex = /export const UPDATE_HISTORY: UpdateInfo\[\] = \[[\s\S]*?\];/;
  content = content.replace(regex, newHistoryCode);

  fs.writeFileSync(constantsPath, content, 'utf-8');
  console.log('✅ Updated constants.ts with new update history');
}

// Main execution
function main() {
  console.log(`📖 Reading last ${commitCount} git commits...`);

  const commits = getRecentCommits();

  if (commits.length === 0) {
    console.log('⚠️  No commits found. Make sure you are in a git repository.');
    return;
  }

  console.log(`\n📝 Found ${commits.length} commits:\n`);

  const updates = commits
    .map(commit => convertToUserFriendly(commit))
    .filter(update => update.shouldInclude)
    .map(update => {
      console.log(`[${update.date}] ${update.title}`);
      console.log(`   ${update.description}\n`);
      return update;
    });

  if (updates.length === 0) {
    console.log('⚠️  No user-facing updates found in recent commits.');
    console.log('💡 Tip: Use "feat:" or "fix:" commits for user-facing features.');
    return;
  }

  const newHistoryCode = generateUpdateHistoryCode(updates);

  console.log('\n🔄 Updating constants.ts...');
  updateConstantsFile(newHistoryCode);

  console.log('\n✨ Done! Update history has been automatically generated.');
  console.log('💡 Tip: Review constants.ts and edit the descriptions if needed.');
}

main();
