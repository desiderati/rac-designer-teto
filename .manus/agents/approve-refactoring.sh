#!/bin/bash

# Approval Script for Agent 2 Execution
# 
# Usage: ./approve-refactoring.sh [YYYYMMDD]
# 
# Example: ./approve-refactoring.sh 2026-02-26
# 
# This script:
# 1. Validates that the analysis exists
# 2. Creates an APPROVED marker file
# 3. Triggers Agent 2 execution
# 4. Monitors execution progress

set -e

REPO_PATH="/home/ubuntu/rac-designer-teto"
REFACTORING_DIR="${REPO_PATH}/.refactoring"

# Get date from argument or use today
if [ -z "$1" ]; then
  ANALYSIS_DATE=$(date +%Y-%m-%d)
else
  ANALYSIS_DATE="$1"
fi

ANALYSIS_DIR="${REFACTORING_DIR}/${ANALYSIS_DATE}"
APPROVED_MARKER="${ANALYSIS_DIR}/.approved"

echo "🔍 Checking for analysis..."

# Validate analysis exists
if [ ! -d "$ANALYSIS_DIR" ]; then
  echo "❌ Analysis not found for date: $ANALYSIS_DATE"
  echo "📁 Location: $ANALYSIS_DIR"
  exit 1
fi

if [ ! -f "${ANALYSIS_DIR}/refactoring-plan.md" ]; then
  echo "❌ Refactoring plan not found"
  exit 1
fi

if [ ! -f "${ANALYSIS_DIR}/regression-checklist.md" ]; then
  echo "❌ Regression checklist not found"
  exit 1
fi

echo "✅ Analysis found for $ANALYSIS_DATE"

# Show plan summary
echo ""
echo "📋 Refactoring Plan Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
grep "^### Phase" "${ANALYSIS_DIR}/refactoring-plan.md" | head -5
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Show checklist summary
echo ""
echo "🧪 Regression Tests:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
grep "^### " "${ANALYSIS_DIR}/regression-checklist.md" | grep -v "^### Phase" | head -5
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Confirmation
echo ""
echo "⚠️  This will trigger automatic refactoring execution!"
echo ""
read -p "Do you approve? (yes/no): " -r APPROVAL

if [[ ! $APPROVAL =~ ^[Yy][Ee][Ss]$ ]]; then
  echo "❌ Approval cancelled"
  exit 1
fi

# Create approval marker
echo "✅ Creating approval marker..."
touch "$APPROVED_MARKER"

# Commit approval
echo "🚀 Committing approval..."
cd "$REPO_PATH"
git add ".refactoring/${ANALYSIS_DATE}/.approved"
git commit -m "docs: approved refactoring for ${ANALYSIS_DATE}" || true
git push origin manus || true

echo ""
echo "✅ Approval complete!"
echo "🤖 Agent 2 will now execute the refactoring plan"
echo ""
echo "📄 Execution will be logged to:"
echo "   .refactoring/${ANALYSIS_DATE}/regression-run.md"
echo ""
echo "💡 You will be notified when execution completes"
echo ""

# Optionally trigger Agent 2 immediately
echo "🚀 Triggering Agent 2 execution..."
node /home/ubuntu/agent-2-executor.mjs

echo ""
echo "✅ Agent 2 execution triggered!"
