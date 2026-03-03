#!/usr/bin/env node

/**
 * Agent 1 v2: Intelligent Dynamic Refactoring Analysis
 * 
 * Updated with:
 * - Clean Architecture analysis (Ports/Adapters, CQRS, Strategies, etc)
 * - SRP (Single Responsibility Principle) analysis for Hooks
 * 
 * This agent performs LIVE analysis of the codebase state and generates
 * adaptive refactoring plans based on CURRENT conditions, not templates.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const REPO_PATH = '/home/ubuntu/rac-designer-teto';
const REPO_URL = 'https://github.com/desiderati/rac-designer-teto.git';
const BRANCH = 'manus';
const REFACTORING_DIR = path.join(REPO_PATH, '.refactoring');
const TODAY = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
const TODAY_DIR = path.join(REFACTORING_DIR, TODAY);
const PLAN_FILE = path.join(TODAY_DIR, 'refactoring-plan.md');
const CHECKLIST_FILE = path.join(TODAY_DIR, 'regression-checklist.md');

console.log('🤖 Agent 1 v2: Starting intelligent dynamic analysis...');
console.log(`📅 Date: ${TODAY}`);

try {
  // Step 1: Update repository
  console.log('\n📦 Updating repository...');
  if (!fs.existsSync(REPO_PATH)) {
    execSync(`git clone --branch ${BRANCH} ${REPO_URL} ${REPO_PATH}`, { stdio: 'inherit' });
  } else {
    execSync(`cd ${REPO_PATH} && git fetch origin && git checkout ${BRANCH} && git pull origin ${BRANCH}`, { stdio: 'inherit' });
  }

  // Step 2: Check for new commits
  console.log('\n🔍 Checking for new commits...');
  const lastAnalysisDir = getLastAnalysisDirectory(REFACTORING_DIR);
  const hasNewCommits = checkForNewCommits(REPO_PATH, lastAnalysisDir);

  if (!hasNewCommits) {
    console.log('✅ No new commits since last analysis. Skipping...');
    process.exit(0);
  }

  console.log('✅ New commits found. Proceeding with analysis...');

  // Step 3: Create today's directory
  if (!fs.existsSync(TODAY_DIR)) {
    fs.mkdirSync(TODAY_DIR, { recursive: true });
  }

  // Step 4: Perform DEEP code analysis
  console.log('\n🔬 Performing deep code analysis...');
  const codeAnalysis = performDeepCodeAnalysis(REPO_PATH);

  // Step 5: Detect issues and opportunities
  console.log('\n🎯 Detecting issues and opportunities...');
  const issues = detectIssues(codeAnalysis);
  const opportunities = detectOpportunities(codeAnalysis);
  const completedPhases = detectCompletedPhases(codeAnalysis);

  // Step 6: Generate DYNAMIC refactoring plan
  console.log('\n📋 Generating dynamic refactoring plan...');
  const refactoringPlan = generateDynamicRefactoringPlan(
    codeAnalysis,
    issues,
    opportunities,
    completedPhases
  );
  fs.writeFileSync(PLAN_FILE, refactoringPlan);
  console.log(`✅ Plan saved: ${PLAN_FILE}`);

  // Step 7: Generate ADAPTIVE regression checklist
  console.log('\n🧪 Generating adaptive regression checklist...');
  const regressionChecklist = generateAdaptiveRegressionChecklist(codeAnalysis);
  fs.writeFileSync(CHECKLIST_FILE, regressionChecklist);
  console.log(`✅ Checklist saved: ${CHECKLIST_FILE}`);

  // Step 8: Commit and push
  console.log('\n🚀 Committing to repository...');
  try {
    execSync(`cd ${REPO_PATH} && git add .refactoring/ && git commit -m "docs: agent-1 intelligent analysis for ${TODAY}" && git push origin ${BRANCH}`, { stdio: 'inherit' });
  } catch (e) {
    console.log('⚠️  Commit skipped (no changes or push failed)');
  }

  // Step 9: Send notification
  console.log('\n📢 Sending notification for approval...');
  sendApprovalNotification(TODAY, codeAnalysis, issues, opportunities);

  console.log('\n✅ Agent 1 analysis complete!');
  console.log(`📁 Reports location: .refactoring/${TODAY}/`);
  console.log('⏳ Waiting for manual approval before Agent 2 starts...');

} catch (error) {
  console.error('❌ Error during analysis:', error.message);
  process.exit(1);
}

/**
 * Get the last analysis directory
 function getLastAnalysisDirectory(refactoringDir) {
  if (!fs.existsSync(refactoringDir)) return null;
  const dirs = fs.readdirSync(refactoringDir)
    .filter(f => {
      const fullPath = path.join(refactoringDir, f);
      return fs.statSync(fullPath).isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(f);
    })
    .sort()
    .reverse();
  return dirs[0] || null;
}th > 0 ? path.join(refactoringDir, dirs[0]) : null;
}

/**
 * Check if there are new commits since last analysis
 */
function checkForNewCommits(repoPath, lastAnalysisDir) {
  try {
    if (!lastAnalysisDir) return true;

    const lastAnalysisDate = path.basename(lastAnalysisDir);
    const commitsAfter = execSync(
      `cd ${repoPath} && git log --oneline --since="${lastAnalysisDate}" --until="$(date -d '${lastAnalysisDate} + 1 day' +%Y-%m-%d)"`,
      { encoding: 'utf-8' }
    );
    
    return commitsAfter.trim().length > 0;
  } catch (e) {
    return true;
  }
}

/**
 * Perform DEEP code analysis
 */
function performDeepCodeAnalysis(repoPath) {
  console.log('   Analyzing file structure...');
  const fileStats = analyzeFileStructure(repoPath);

  console.log('   Analyzing clean architecture...');
  const cleanArchAnalysis = analyzeCleanArchitecture(repoPath);

  console.log('   Analyzing hooks for SRP...');
  const hooksAnalysis = analyzeHooks(repoPath);

  console.log('   Analyzing components...');
  const componentsAnalysis = analyzeComponents(repoPath);

  console.log('   Running tests...');
  const testResults = runTests(repoPath);

  console.log('   Analyzing code patterns...');
  const patterns = analyzeCodePatterns(repoPath);

  return {
    timestamp: new Date().toISOString(),
    fileStats,
    cleanArchAnalysis,
    hooksAnalysis,
    componentsAnalysis,
    testResults,
    patterns,
    recentCommits: getRecentCommits(repoPath)
  };
}

/**
 * Analyze file structure
 */
function analyzeFileStructure(repoPath) {
  try {
    const fileCount = execSync(`cd ${repoPath} && find src -type f \\( -name "*.ts" -o -name "*.tsx" \\) | wc -l`, { encoding: 'utf-8' }).trim();
    const totalLines = execSync(`cd ${repoPath} && find src -type f \\( -name "*.ts" -o -name "*.tsx" \\) -exec wc -l {} + | tail -1 | awk '{print $1}'`, { encoding: 'utf-8' }).trim();
    const testFiles = execSync(`cd ${repoPath} && find src -type f -name "*.test.ts" -o -name "*.test.tsx" | wc -l`, { encoding: 'utf-8' }).trim();

    return {
      totalFiles: parseInt(fileCount),
      totalLines: parseInt(totalLines),
      testFiles: parseInt(testFiles),
      testCoverage: (parseInt(testFiles) / parseInt(fileCount) * 100).toFixed(2)
    };
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Analyze Clean Architecture patterns
 * 1. Ports/Adapters
 * 2. CQRS
 * 3. Strategies
 * 4. Normalization functions
 * 5. Duplicate patterns
 * 6. Magic numbers
 */
function analyzeCleanArchitecture(repoPath) {
  try {
    const srcDir = path.join(repoPath, 'src');
    const content = fs.readdirSync(srcDir);
    
    const analysis = {
      status: 'FOUND',
      patterns: {
        portsAdapters: false,
        cqrs: false,
        strategies: false,
        repositories: false,
        useCases: false
      },
      recommendations: [],
      normalizationFunctions: 0,
      duplicatePatterns: 0,
      magicNumbers: 0
    };

    // Get all files
    let allFiles = [];
    try {
      allFiles = execSync(`cd ${repoPath} && find src -type f \\( -name "*.ts" -o -name "*.tsx" \\)`, { encoding: 'utf-8' }).split('\n').filter(f => f);
    } catch (e) {
      // Ignore
    }

    // Check for Ports & Adapters pattern
    if (content.includes('ports') || content.includes('adapters')) {
      analysis.patterns.portsAdapters = true;
    } else {
      analysis.recommendations.push('Consider Ports & Adapters pattern for better abstraction');
    }

    // Check for CQRS pattern
    const hasCQRS = allFiles.some(f => f.includes('command') || f.includes('query'));
    if (hasCQRS) {
      analysis.patterns.cqrs = true;
    } else {
      analysis.recommendations.push('CQRS pattern could improve separation of concerns');
    }

    // Check for Strategy patterns
    const hasStrategies = allFiles.some(f => f.includes('strategy'));
    if (hasStrategies) {
      analysis.patterns.strategies = true;
    } else {
      analysis.recommendations.push('Strategy pattern could enhance extensibility');
    }

    // Check for Repository pattern
    const hasRepositories = allFiles.some(f => f.includes('repository'));
    if (hasRepositories) {
      analysis.patterns.repositories = true;
    }

    // Check for Use Cases
    const hasUseCases = allFiles.some(f => f.includes('usecase') || f.includes('use-case'));
    if (hasUseCases) {
      analysis.patterns.useCases = true;
    }

    // Analyze normalization functions
    const factoryPath = path.join(repoPath, 'src/lib/canvas/factory/elements-factory.ts');
    if (fs.existsSync(factoryPath)) {
      const factoryContent = fs.readFileSync(factoryPath, 'utf-8');
      const normalizationFunctions = (factoryContent.match(/normalize\w+/g) || []).length;
      analysis.normalizationFunctions = normalizationFunctions;
    }

    // Detect duplicate patterns
    const duplicatePatterns = findDuplicatePatternsInFiles(allFiles, repoPath);
    analysis.duplicatePatterns = duplicatePatterns.length;
    if (duplicatePatterns.length > 0) {
      analysis.recommendations.push(`Found ${duplicatePatterns.length} duplicate patterns - consider extraction`);
    }

    // Detect magic numbers
    const magicNumberCount = countMagicNumbers(allFiles, repoPath);
    analysis.magicNumbers = magicNumberCount;
    if (magicNumberCount > 10) {
      analysis.recommendations.push(`Found ${magicNumberCount} magic numbers - centralize in constants`);
    }

    return analysis;
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Count magic numbers in codebase
 */
function countMagicNumbers(files, repoPath) {
  let count = 0;
  for (const file of files.slice(0, 20)) {
    if (!file) continue;
    try {
      const content = fs.readFileSync(path.join(repoPath, file), 'utf-8');
      const matches = content.match(/:\s*\d+[,;]/g) || [];
      count += matches.length;
    } catch (e) {
      // Skip
    }
  }
  return count;
}

/**
 * Find duplicate patterns in files
 */
function findDuplicatePatternsInFiles(files, repoPath) {
  const patterns = {};
  for (const file of files.slice(0, 30)) {
    if (!file) continue;
    try {
      const content = fs.readFileSync(path.join(repoPath, file), 'utf-8');
      const lines = content.split('\n').filter(l => l.trim().length > 30);
      for (const line of lines) {
        patterns[line] = (patterns[line] || 0) + 1;
      }
    } catch (e) {
      // Skip
    }
  }
  return Object.entries(patterns).filter(([_, count]) => count > 1).slice(0, 5);
}

/**
 * Analyze Hooks for SRP (Single Responsibility Principle)
 */
function analyzeHooks(repoPath) {
  try {
    const hooksDir = path.join(repoPath, 'src/components/rac-editor/hooks');
    
    if (!fs.existsSync(hooksDir)) {
      return { status: 'NOT_FOUND' };
    }

    const hookFiles = fs.readdirSync(hooksDir).filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
    const analysis = {
      status: 'FOUND',
      totalHooks: hookFiles.length,
      srpViolations: [],
      recommendations: []
    };

    for (const file of hookFiles) {
      const filePath = path.join(hooksDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').length;

      // Check for SRP violations
      const hasMultipleUseEffects = (content.match(/useEffect/g) || []).length > 2;
      const hasMultipleStates = (content.match(/useState/g) || []).length > 3;
      const hasMultipleCallbacks = (content.match(/useCallback/g) || []).length > 2;
      const isLarge = lines > 150;

      if (hasMultipleUseEffects || hasMultipleStates || hasMultipleCallbacks || isLarge) {
        analysis.srpViolations.push({
          file,
          lines,
          issues: [
            hasMultipleUseEffects ? 'Multiple useEffect calls' : null,
            hasMultipleStates ? 'Multiple useState calls' : null,
            hasMultipleCallbacks ? 'Multiple useCallback calls' : null,
            isLarge ? 'Large hook (>150 lines)' : null
          ].filter(Boolean)
        });
      }
    }

    if (analysis.srpViolations.length > 0) {
      analysis.recommendations.push(
        `Found ${analysis.srpViolations.length} hooks with potential SRP violations - consider splitting into smaller hooks`
      );
    }

    return analysis;
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Analyze components
 */
function analyzeComponents(repoPath) {
  try {
    const componentsDir = path.join(repoPath, 'src/components/rac-editor');
    
    if (!fs.existsSync(componentsDir)) {
      return { status: 'NOT_FOUND' };
    }

    const componentFiles = execSync(`cd ${repoPath} && find src/components/rac-editor -type f \\( -name "*.tsx" \\) | wc -l`, { encoding: 'utf-8' }).trim();

    return {
      status: 'FOUND',
      totalComponents: parseInt(componentFiles),
      recommendations: []
    };
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Run tests
 */
function runTests(repoPath) {
  try {
    const output = execSync(`cd ${repoPath} && pnpm test 2>&1 | tail -20`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    
    const passMatch = output.match(/(\d+)\s+passed/);
    const failMatch = output.match(/(\d+)\s+failed/);

    return {
      status: 'SUCCESS',
      passed: passMatch ? parseInt(passMatch[1]) : 0,
      failed: failMatch ? parseInt(failMatch[1]) : 0,
      output: output.substring(0, 500)
    };
  } catch (e) {
    return {
      status: 'FAILED',
      error: e.message
    };
  }
}

/**
 * Analyze code patterns
 */
function analyzeCodePatterns(repoPath) {
  try {
    const srcDir = path.join(repoPath, 'src');
    const allFiles = execSync(`cd ${repoPath} && find src -type f \\( -name "*.ts" -o -name "*.tsx" \\)`, { encoding: 'utf-8' }).split('\n').filter(f => f);

    const patterns = {
      usesTypeScript: true,
      hasTests: false,
      hasConstants: false,
      hasStrategies: false,
      hasDuplication: false
    };

    patterns.hasTests = allFiles.some(f => f.includes('.test.'));
    patterns.hasConstants = allFiles.some(f => f.includes('constants'));
    patterns.hasStrategies = allFiles.some(f => f.includes('strategy'));

    return patterns;
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Get recent commits
 */
function getRecentCommits(repoPath) {
  try {
    return execSync(`cd ${repoPath} && git log --oneline -10`, { encoding: 'utf-8' });
  } catch (e) {
    return '';
  }
}

/**
 * Detect CURRENT issues in the codebase
 */
function detectIssues(analysis) {
  const issues = [];

  // Issue 1: Test failures
  if (analysis.testResults.status === 'FAILED') {
    issues.push({
      severity: 'CRITICAL',
      title: 'Test Failures',
      description: 'Some tests are failing. This must be fixed before refactoring.',
      impact: 'Blocks all refactoring'
    });
  }

  // Issue 2: Low test coverage
  if (analysis.fileStats.testCoverage < 50) {
    issues.push({
      severity: 'HIGH',
      title: 'Low Test Coverage',
      description: `Only ${analysis.fileStats.testCoverage}% of files have tests`,
      impact: 'Increases refactoring risk'
    });
  }

  // Issue 3: SRP violations in hooks
  if (analysis.hooksAnalysis.srpViolations && analysis.hooksAnalysis.srpViolations.length > 0) {
    issues.push({
      severity: 'MEDIUM',
      title: 'SRP Violations in Hooks',
      description: `${analysis.hooksAnalysis.srpViolations.length} hooks have potential SRP violations`,
      impact: 'Reduced maintainability and testability',
      details: analysis.hooksAnalysis.srpViolations.map(v => `${v.file}: ${v.issues.join(', ')}`)
    });
  }

  // Issue 4: Clean Architecture gaps
  if (analysis.cleanArchAnalysis.recommendations && analysis.cleanArchAnalysis.recommendations.length > 0) {
    issues.push({
      severity: 'MEDIUM',
      title: 'Clean Architecture Opportunities',
      description: 'Missing design patterns that could improve architecture',
      impact: 'Reduced extensibility and maintainability',
      details: analysis.cleanArchAnalysis.recommendations
    });
  }

  return issues;
}

/**
 * Detect OPPORTUNITIES for improvement
 */
function detectOpportunities(analysis) {
  const opportunities = [];

  // Opportunity 1: Implement missing design patterns
  const missingPatterns = [];
  if (!analysis.cleanArchAnalysis.patterns.portsAdapters) missingPatterns.push('Ports & Adapters');
  if (!analysis.cleanArchAnalysis.patterns.cqrs) missingPatterns.push('CQRS');
  if (!analysis.cleanArchAnalysis.patterns.strategies) missingPatterns.push('Strategy Pattern');

  if (missingPatterns.length > 0) {
    opportunities.push({
      priority: 'HIGH',
      title: 'Implement Design Patterns',
      description: `Consider implementing: ${missingPatterns.join(', ')}`,
      effort: '3-5 days',
      benefit: 'Improved architecture, extensibility, and maintainability'
    });
  }

  // Opportunity 2: Refactor hooks for SRP
  if (analysis.hooksAnalysis.srpViolations && analysis.hooksAnalysis.srpViolations.length > 0) {
    opportunities.push({
      priority: 'HIGH',
      title: 'Refactor Hooks for SRP',
      description: `Split ${analysis.hooksAnalysis.srpViolations.length} hooks into smaller, focused hooks`,
      effort: '2-3 days',
      benefit: 'Improved testability, reusability, and maintainability'
    });
  }

  // Opportunity 3: Centralize constants
  if (analysis.cleanArchAnalysis.recommendations && analysis.cleanArchAnalysis.recommendations.some(r => r.includes('magic numbers'))) {
    opportunities.push({
      priority: 'MEDIUM',
      title: 'Centralize Configuration',
      description: 'Move magic numbers and configuration to constants file',
      effort: '1-2 days',
      benefit: 'Single source of truth for configuration'
    });
  }

  // Opportunity 4: Improve test coverage
  if (analysis.fileStats.testCoverage < 80) {
    opportunities.push({
      priority: 'MEDIUM',
      title: 'Improve Test Coverage',
      description: `Increase test coverage from ${analysis.fileStats.testCoverage}% to 80%+`,
      effort: '2-3 days',
      benefit: 'Safer refactoring and fewer regressions'
    });
  }

  return opportunities;
}

/**
 * Detect COMPLETED phases from previous analyses
 */
function detectCompletedPhases(analysis) {
  const completed = [];

  if (analysis.cleanArchAnalysis.patterns.portsAdapters) {
    completed.push('Ports & Adapters Pattern');
  }
  if (analysis.cleanArchAnalysis.patterns.cqrs) {
    completed.push('CQRS Pattern');
  }
  if (analysis.cleanArchAnalysis.patterns.strategies) {
    completed.push('Strategy Pattern');
  }

  if (analysis.patterns.hasConstants) {
    completed.push('Constant Centralization');
  }

  if (analysis.patterns.hasTests) {
    completed.push('Test Infrastructure');
  }

  return completed;
}

/**
 * Generate DYNAMIC refactoring plan based on CURRENT state
 */
function generateDynamicRefactoringPlan(analysis, issues, opportunities, completed) {
  let plan = `# 🔄 Dynamic Refactoring Plan - ${TODAY}\n\n`;
  plan += `**Generated:** ${analysis.timestamp}\n`;
  plan += `**Repository:** desiderati/rac-designer-teto\n`;
  plan += `**Branch:** manus\n\n`;

  // Section 1: Current State
  plan += `---\n\n## 📊 Current State Analysis\n\n`;
  plan += `### Code Metrics\n`;
  plan += `- **Total Files:** ${analysis.fileStats.totalFiles}\n`;
  plan += `- **Total Lines:** ${analysis.fileStats.totalLines}\n`;
  plan += `- **Test Files:** ${analysis.fileStats.testFiles}\n`;
  plan += `- **Test Coverage:** ${analysis.fileStats.testCoverage}%\n\n`;

  plan += `### Architecture Analysis\n`;
  plan += `- **Normalization Functions:** ${analysis.cleanArchAnalysis.normalizationFunctions}\n`;
  plan += `- **Duplicate Patterns:** ${analysis.cleanArchAnalysis.duplicatePatterns}\n`;
  plan += `- **Magic Numbers:** ${analysis.cleanArchAnalysis.magicNumbers}\n`;
  plan += `- **Hooks with SRP Issues:** ${analysis.hooksAnalysis.srpViolations ? analysis.hooksAnalysis.srpViolations.length : 0}\n\n`;

  // Section 2: Completed Phases
  if (completed.length > 0) {
    plan += `### ✅ Previously Completed\n`;
    for (const phase of completed) {
      plan += `- ✅ ${phase}\n`;
    }
    plan += '\n';
  }

  // Section 3: Critical Issues
  const criticalIssues = issues.filter(i => i.severity === 'CRITICAL');
  if (criticalIssues.length > 0) {
    plan += `### 🚨 Critical Issues (MUST FIX FIRST)\n\n`;
    for (const issue of criticalIssues) {
      plan += `#### ${issue.title}\n`;
      plan += `**Severity:** ${issue.severity}\n`;
      plan += `**Description:** ${issue.description}\n`;
      plan += `**Impact:** ${issue.impact}\n\n`;
      
      if (issue.details) {
        plan += `**Details:**\n`;
        for (const detail of issue.details) {
          plan += `- ${detail}\n`;
        }
        plan += '\n';
      }
    }
  }

  // Section 4: High Priority Issues
  const highIssues = issues.filter(i => i.severity === 'HIGH');
  if (highIssues.length > 0) {
    plan += `### ⚠️ High Priority Issues\n\n`;
    for (const issue of highIssues) {
      plan += `#### ${issue.title}\n`;
      plan += `**Description:** ${issue.description}\n`;
      plan += `**Impact:** ${issue.impact}\n\n`;
    }
  }

  // Section 5: Refactoring Phases
  plan += `---\n\n## 🎯 Recommended Refactoring Phases\n\n`;
  
  const phases = generatePhases(analysis, issues, opportunities, completed);
  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
    plan += `### Phase ${i + 1}: ${phase.title}\n\n`;
    plan += `**Objective:** ${phase.objective}\n`;
    plan += `**Effort:** ${phase.effort}\n`;
    plan += `**Benefit:** ${phase.benefit}\n`;
    plan += `**Priority:** ${phase.priority}\n\n`;

    plan += `**Tasks:**\n`;
    for (const task of phase.tasks) {
      plan += `- [ ] ${task}\n`;
    }
    plan += '\n';

    plan += `**Expected Outcome:**\n`;
    plan += `${phase.outcome}\n\n`;
  }

  // Section 6: Opportunities
  if (opportunities.length > 0) {
    plan += `---\n\n## 💡 Future Opportunities\n\n`;
    for (const opp of opportunities) {
      plan += `### ${opp.title}\n`;
      plan += `**Priority:** ${opp.priority}\n`;
      plan += `**Effort:** ${opp.effort}\n`;
      plan += `**Benefit:** ${opp.benefit}\n\n`;
    }
  }

  // Section 7: Recent Commits
  plan += `---\n\n## 📝 Recent Commits\n\n`;
  plan += `\`\`\`\n${analysis.recentCommits}\`\`\`\n\n`;

  // Section 8: Approval
  plan += `---\n\n## ✅ Approval Checklist\n\n`;
  plan += `- [ ] You have reviewed this dynamic plan\n`;
  plan += `- [ ] All phases align with your vision\n`;
  plan += `- [ ] You understand the scope and timeline\n`;
  plan += `- [ ] You approve the regression checklist\n`;
  plan += `- [ ] You are ready to proceed\n\n`;

  plan += `**To Approve:** Reply with "APPROVED" or edit regression-checklist.md if needed\n\n`;

  plan += `---\n\n*This plan was dynamically generated by Agent 1 based on CURRENT code analysis*\n`;

  return plan;
}

/**
 * Generate phases based on CURRENT state
 */
function generatePhases(analysis, issues, opportunities, completed) {
  const phases = [];

  // Phase 1: Fix critical issues
  const criticalIssues = issues.filter(i => i.severity === 'CRITICAL');
  if (criticalIssues.length > 0) {
    phases.push({
      title: 'Fix Critical Issues',
      objective: 'Resolve all critical issues that block refactoring',
      effort: '1-2 days',
      benefit: 'Unblock refactoring efforts',
      priority: 'CRITICAL',
      tasks: criticalIssues.map(i => `Fix: ${i.title}`),
      outcome: 'All critical issues resolved, tests passing'
    });
  }

  // Phase 2: Address high priority issues
  const highIssues = issues.filter(i => i.severity === 'HIGH');
  if (highIssues.length > 0) {
    phases.push({
      title: 'Address High Priority Issues',
      objective: 'Resolve high priority issues',
      effort: '2-3 days',
      benefit: 'Improved code quality and maintainability',
      priority: 'HIGH',
      tasks: highIssues.map(i => `Resolve: ${i.title}`),
      outcome: 'High priority issues addressed'
    });
  }

  // Phase 3: Implement top opportunities
  const topOpportunities = opportunities.filter(o => o.priority === 'HIGH').slice(0, 2);
  if (topOpportunities.length > 0) {
    for (const opp of topOpportunities) {
      phases.push({
        title: opp.title,
        objective: opp.description,
        effort: opp.effort,
        benefit: opp.benefit,
        priority: 'HIGH',
        tasks: [`Implement: ${opp.title}`, 'Add tests', 'Update documentation'],
        outcome: `${opp.title} successfully implemented`
      });
    }
  }

  // Phase 4: Polish and documentation
  phases.push({
    title: 'Documentation & Polish',
    objective: 'Document changes and improve code quality',
    effort: '1-2 days',
    benefit: 'Better maintainability and onboarding',
    priority: 'MEDIUM',
    tasks: ['Add JSDoc comments', 'Update README', 'Create extension guide'],
    outcome: 'Comprehensive documentation and polished code'
  });

  return phases;
}

/**
 * Generate ADAPTIVE regression checklist
 */
function generateAdaptiveRegressionChecklist(analysis) {
  let checklist = `# 🧪 Adaptive Regression Checklist - ${TODAY}\n\n`;
  checklist += `**Generated:** ${analysis.timestamp}\n`;
  checklist += `**Repository:** desiderati/rac-designer-teto\n`;
  checklist += `**Branch:** manus\n\n`;

  checklist += `---\n\n## 📋 Overview\n\n`;
  checklist += `This checklist is dynamically generated based on the CURRENT state of the codebase.\n`;
  checklist += `Tests are selected based on:\n`;
  checklist += `- Current code structure\n`;
  checklist += `- Recent changes\n`;
  checklist += `- Identified issues\n`;
  checklist += `- Code coverage gaps\n\n`;

  checklist += `---\n\n## ✅ Automated Tests\n\n`;

  checklist += `### 1. Unit Tests - Core Functionality\n\n`;
  checklist += `**Command:** \`pnpm test -- src/lib/canvas/factory/\`\n`;
  checklist += `**Expected:** All tests passing\n`;
  checklist += `**Timeout:** 60s\n`;
  checklist += `**Critical:** YES\n\n`;

  checklist += `### 2. Component Tests\n\n`;
  checklist += `**Command:** \`pnpm test -- src/components/rac-editor/\`\n`;
  checklist += `**Expected:** All tests passing\n`;
  checklist += `**Timeout:** 120s\n`;
  checklist += `**Critical:** YES\n\n`;

  checklist += `### 3. Type Safety\n\n`;
  checklist += `**Command:** \`pnpm tsc --noEmit\`\n`;
  checklist += `**Expected:** 0 errors\n`;
  checklist += `**Timeout:** 30s\n`;
  checklist += `**Critical:** YES\n\n`;

  checklist += `### 4. Code Quality\n\n`;
  checklist += `**Command:** \`pnpm lint\`\n`;
  checklist += `**Expected:** 0 errors (warnings acceptable)\n`;
  checklist += `**Timeout:** 30s\n`;
  checklist += `**Critical:** NO\n\n`;

  if (analysis.fileStats.testCoverage < 70) {
    checklist += `### 5. Coverage Analysis\n\n`;
    checklist += `**Command:** \`pnpm test -- --coverage\`\n`;
    checklist += `**Expected:** Coverage >= 70%\n`;
    checklist += `**Timeout:** 90s\n`;
    checklist += `**Critical:** YES (Low coverage detected)\n\n`;
  }

  checklist += `---\n\n## 📝 Manual Tests (Informative)\n\n`;
  checklist += `These are for manual validation after refactoring:\n\n`;
  checklist += `- [ ] Elements can be created on canvas\n`;
  checklist += `- [ ] Element properties can be edited\n`;
  checklist += `- [ ] Undo/redo functionality works\n`;
  checklist += `- [ ] No visual regressions\n`;
  checklist += `- [ ] Performance is acceptable\n\n`;

  checklist += `---\n\n## 🔄 Execution Rules\n\n`;
  checklist += `- Each test can fail up to 3 times before stopping\n`;
  checklist += `- Agent 2 will attempt automatic fixes\n`;
  checklist += `- If 3 retries fail, Agent 2 will rollback\n`;
  checklist += `- You will be notified only on critical failures\n\n`;

  checklist += `---\n\n*This checklist was dynamically generated based on current code analysis*\n`;

  return checklist;
}

/**
 * Send approval notification
 */
function sendApprovalNotification(date, analysis, issues, opportunities) {
  console.log('\n' + '='.repeat(70));
  console.log('📢 INTELLIGENT ANALYSIS COMPLETE');
  console.log('='.repeat(70));
  console.log(`\n✅ Dynamic analysis for ${date} is ready for review!\n`);
  
  console.log('📊 Analysis Summary:');
  console.log(`   - Files: ${analysis.fileStats.totalFiles}`);
  console.log(`   - Lines: ${analysis.fileStats.totalLines}`);
  console.log(`   - Test Coverage: ${analysis.fileStats.testCoverage}%\n`);

  if (issues.length > 0) {
    console.log(`⚠️  Issues Detected: ${issues.length}`);
    const critical = issues.filter(i => i.severity === 'CRITICAL').length;
    const high = issues.filter(i => i.severity === 'HIGH').length;
    if (critical > 0) console.log(`   - Critical: ${critical}`);
    if (high > 0) console.log(`   - High: ${high}`);
    console.log();
  }

  if (opportunities.length > 0) {
    console.log(`💡 Opportunities: ${opportunities.length}\n`);
  }

  console.log('📁 Location: .refactoring/' + date + '/');
  console.log('   - refactoring-plan.md (DYNAMIC)');
  console.log('   - regression-checklist.md (ADAPTIVE)');
  console.log('\n⏳ Waiting for your approval...');
  console.log('\n💡 Next: Review the files and approve to trigger Agent 2');
  console.log('='.repeat(70) + '\n');
}
