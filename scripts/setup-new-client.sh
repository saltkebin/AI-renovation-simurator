#!/usr/bin/env bash
set -euo pipefail

# 新規クライアント完全セットアップ自動化スクリプト
# Usage: ./scripts/setup-new-client.sh <client-name> <firebase-project-id>

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Color output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Error handling
trap 'echo -e "${RED}❌ Error on line $LINENO${NC}"' ERR

# Print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Usage function
usage() {
    echo "新規クライアント完全セットアップスクリプト"
    echo ""
    echo "Usage: $0 <client-name> <firebase-project-id>"
    echo ""
    echo "Examples:"
    echo "  $0 newclient airenovation-newclient"
    echo "  $0 company123 airenovation-company123"
    echo ""
    echo "Current clients and their URLs:"
    echo "  default       → airenovation2           → https://airenovation2.web.app"
    echo "  hitotoiro     → airenovation-hitotoiro  → https://airenovation-hitotoiro.web.app"
    echo "  ishibashihome → airenovation-horimoto   → https://airenovation-horimoto.web.app"
    echo ""
    echo "Prerequisites:"
    echo "  - Firebase project already created with Storage enabled"
    echo "  - GitHub secrets already configured"
    echo "  - gcloud CLI installed and authenticated"
    echo ""
    echo "This script will:"
    echo "  1. Update GitHub Actions workflow files"
    echo "  2. Set up CORS configuration for Firebase Storage"
    echo "  3. Update setup documentation"
    echo "  4. Commit and optionally push changes"
    echo ""
    exit 1
}

# Validate arguments
if [ $# -ne 2 ]; then
    print_error "Invalid number of arguments"
    usage
fi

readonly CLIENT_NAME="${1:?Error: client-name required}"
readonly FIREBASE_PROJECT_ID="${2:?Error: firebase-project-id required}"

# Validate inputs
if [[ ! "$CLIENT_NAME" =~ ^[a-z0-9]+$ ]]; then
    print_error "Client name must contain only lowercase letters and numbers"
    exit 1
fi

if [[ ! "$FIREBASE_PROJECT_ID" =~ ^[a-z0-9-]+$ ]]; then
    print_error "Firebase project ID must contain only lowercase letters, numbers, and hyphens"
    exit 1
fi

CLIENT_UPPER=$(echo "$CLIENT_NAME" | tr 'a-z' 'A-Z')

# Determine expected URL
EXPECTED_URL=""
case "$FIREBASE_PROJECT_ID" in
    "airenovation2")
        EXPECTED_URL="https://airenovation2.web.app"
        ;;
    "airenovation-"*)
        EXPECTED_URL="https://${FIREBASE_PROJECT_ID}.web.app"
        ;;
    *)
        EXPECTED_URL="https://${FIREBASE_PROJECT_ID}.web.app"
        ;;
esac

print_info "🚀 Starting complete setup for client: $CLIENT_NAME"
print_info "Firebase project: $FIREBASE_PROJECT_ID"
print_info "Client name (uppercase): $CLIENT_UPPER"
print_info "Expected URL: $EXPECTED_URL"

# Step 1: Update GitHub Actions workflows
print_info "📝 Step 1: Updating GitHub Actions workflows..."

# Update manual-deploy.yml
MANUAL_DEPLOY_FILE="$ROOT_DIR/.github/workflows/manual-deploy.yml"
if [ -f "$MANUAL_DEPLOY_FILE" ]; then
    # Add to options list if not already present
    if ! grep -q "- $CLIENT_NAME" "$MANUAL_DEPLOY_FILE"; then
        # Find the line with "# Add new client names here" and add before it
        sed -i "/# Add new client names here/i\\          - $CLIENT_NAME" "$MANUAL_DEPLOY_FILE"
        print_success "Added $CLIENT_NAME to manual-deploy.yml options"
    else
        print_warning "$CLIENT_NAME already exists in manual-deploy.yml"
    fi

    # Add conditional configuration if not present
    if ! grep -q "elif.*$CLIENT_UPPER" "$MANUAL_DEPLOY_FILE"; then
        # Find the last elif block and add after it
        sed -i "/elif.*ISHIBASHIHOME.*then/,/fi/ {
            /fi/i\\          elif [ \"\$CLIENT_UPPER\" = \"$CLIENT_UPPER\" ]; then\\
            CONFIG_JSON='\${{ secrets.FIREBASE_CONFIG_$CLIENT_UPPER }}'\\
            GEMINI_KEY='\${{ secrets.GEMINI_API_KEY_$CLIENT_UPPER }}'
        }" "$MANUAL_DEPLOY_FILE"
        print_success "Added $CLIENT_UPPER configuration to manual-deploy.yml"
    else
        print_warning "$CLIENT_UPPER configuration already exists in manual-deploy.yml"
    fi
else
    print_error "manual-deploy.yml not found"
    exit 1
fi

# Update auto-deploy-all-clients.yml
AUTO_DEPLOY_FILE="$ROOT_DIR/.github/workflows/auto-deploy-all-clients.yml"
if [ -f "$AUTO_DEPLOY_FILE" ]; then
    # Add to matrix client list if not already present
    if ! grep -q "$CLIENT_NAME" "$AUTO_DEPLOY_FILE"; then
        sed -i "s/client: \[\([^]]*\)\]/client: [\1, $CLIENT_NAME]/" "$AUTO_DEPLOY_FILE"
        print_success "Added $CLIENT_NAME to auto-deploy matrix"
    else
        print_warning "$CLIENT_NAME already exists in auto-deploy matrix"
    fi

    # Add conditional configuration if not present
    if ! grep -q "elif.*$CLIENT_UPPER" "$AUTO_DEPLOY_FILE"; then
        # Find the last elif block and add after it
        sed -i "/elif.*ISHIBASHIHOME.*then/,/fi/ {
            /fi/i\\          elif [ \"\$CLIENT_UPPER\" = \"$CLIENT_UPPER\" ]; then\\
            CONFIG_JSON='\${{ secrets.FIREBASE_CONFIG_$CLIENT_UPPER }}'\\
            GEMINI_KEY='\${{ secrets.GEMINI_API_KEY_$CLIENT_UPPER }}'
        }" "$AUTO_DEPLOY_FILE"
        print_success "Added $CLIENT_UPPER configuration to auto-deploy-all-clients.yml"
    else
        print_warning "$CLIENT_UPPER configuration already exists in auto-deploy-all-clients.yml"
    fi
else
    print_error "auto-deploy-all-clients.yml not found"
    exit 1
fi

# Step 2: Set up CORS
print_info "🔧 Step 2: Setting up CORS configuration..."
if [ -f "$SCRIPT_DIR/setup-client-cors.sh" ]; then
    bash "$SCRIPT_DIR/setup-client-cors.sh" "$CLIENT_NAME" "$FIREBASE_PROJECT_ID"
else
    print_error "CORS setup script not found. Please run manually."
fi

# Step 3: Update documentation
print_info "📚 Step 3: Updating documentation..."
SETUP_DOC="$ROOT_DIR/NEW_CLIENT_SETUP.md"
if [ -f "$SETUP_DOC" ]; then
    # Add example to documentation if not already present
    if ! grep -q "$CLIENT_NAME" "$SETUP_DOC"; then
        # Update the example in the document
        sed -i "s/例: \`hitotoiro\`/例: \`hitotoiro\`, \`$CLIENT_NAME\`/" "$SETUP_DOC"

        # Update the client list if it exists
        if grep -q "current clients:" "$SETUP_DOC"; then
            sed -i "/current clients:/a\\- $CLIENT_NAME → $FIREBASE_PROJECT_ID → $EXPECTED_URL" "$SETUP_DOC"
        fi

        print_success "Updated setup documentation with $CLIENT_NAME example"
    fi
fi

# Step 4: Git operations
print_info "📦 Step 4: Committing changes..."
cd "$ROOT_DIR"

# Check if there are changes to commit
if git diff --quiet && git diff --cached --quiet; then
    print_warning "No changes to commit"
else
    git add .
    git commit -m "feat: 新規クライアント $CLIENT_NAME を追加

- GitHub Actions workflows に $CLIENT_NAME を追加
- Firebase project: $FIREBASE_PROJECT_ID
- Expected URL: $EXPECTED_URL
- CORS設定を自動適用
- ドキュメントを更新

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

    print_success "Changes committed successfully"

    # Ask if user wants to push
    echo ""
    read -p "Push changes to GitHub? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git push
        print_success "Changes pushed to GitHub"
    else
        print_info "Changes committed locally but not pushed"
    fi
fi

# Final summary
echo ""
print_success "🎉 Complete setup finished for client: $CLIENT_NAME"
echo ""
print_info "Summary:"
echo "  ✅ Client: $CLIENT_NAME"
echo "  ✅ Firebase Project: $FIREBASE_PROJECT_ID"
echo "  ✅ Expected URL: $EXPECTED_URL"
echo "  ✅ GitHub Actions: Updated"
echo "  ✅ CORS: Configured"
echo "  ✅ Documentation: Updated"
echo ""
print_info "Required GitHub Secrets (set these manually):"
echo "  - FIREBASE_CONFIG_$CLIENT_UPPER"
echo "  - FIREBASE_SERVICE_ACCOUNT_$CLIENT_UPPER"
echo "  - GEMINI_API_KEY_$CLIENT_UPPER"
echo ""
print_info "Next steps:"
echo "  1. Set the required GitHub secrets"
echo "  2. Run manual deployment to test: GitHub Actions → Manual Deploy to Client → $CLIENT_NAME"
echo "  3. Configure Firestore and Storage rules in Firebase Console"
echo "  4. Set up PIN authentication (config/auth document)"
echo "  5. Test at: $EXPECTED_URL"
echo ""