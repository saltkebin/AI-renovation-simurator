#!/usr/bin/env bash
set -euo pipefail

# 新規クライアント向けCORS設定自動化スクリプト
# Usage: ./scripts/setup-client-cors.sh <client-name> <firebase-project-id>

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_NAME="$(basename "${BASH_SOURCE[0]}")"

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
    echo "Usage: $SCRIPT_NAME <client-name> <firebase-project-id>"
    echo ""
    echo "Examples:"
    echo "  $SCRIPT_NAME newclient airenovation-newclient"
    echo "  $SCRIPT_NAME company123 airenovation-company123"
    echo ""
    echo "Current clients:"
    echo "  default      → airenovation2"
    echo "  hitotoiro    → airenovation-hitotoiro"
    echo "  ishibashihome → airenovation-horimoto"
    echo ""
    echo "Prerequisites:"
    echo "  - gcloud CLI installed and authenticated"
    echo "  - gsutil available"
    echo "  - Firebase project already created with Storage enabled"
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

print_info "Setting up CORS for client: $CLIENT_NAME"
print_info "Firebase project: $FIREBASE_PROJECT_ID"

# Check if gcloud is installed and authenticated
if ! command -v gcloud >/dev/null 2>&1; then
    print_error "gcloud CLI is not installed. Please install it first:"
    echo "https://cloud.google.com/sdk/docs/install"
    exit 1
fi

if ! command -v gsutil >/dev/null 2>&1; then
    print_error "gsutil is not available. Please install Google Cloud SDK."
    exit 1
fi

# Check authentication
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n1 >/dev/null; then
    print_error "Not authenticated with gcloud. Run: gcloud auth login"
    exit 1
fi

# Set project
print_info "Setting gcloud project to $FIREBASE_PROJECT_ID..."
if ! gcloud config set project "$FIREBASE_PROJECT_ID" 2>/dev/null; then
    print_error "Failed to set project. Make sure the project exists and you have access."
    exit 1
fi

# Determine bucket name
BUCKET_NAME="${FIREBASE_PROJECT_ID}.firebasestorage.app"

# Check if bucket exists
print_info "Checking if bucket exists: $BUCKET_NAME"
if ! gsutil ls "gs://$BUCKET_NAME" >/dev/null 2>&1; then
    print_error "Bucket gs://$BUCKET_NAME does not exist."
    print_info "Make sure Firebase Storage is enabled for project $FIREBASE_PROJECT_ID"
    exit 1
fi

print_success "Bucket found: gs://$BUCKET_NAME"

# Create CORS configuration
readonly CORS_FILE="/tmp/cors-${CLIENT_NAME}.json"
cat > "$CORS_FILE" << 'EOF'
[
  {
    "origin": ["*"],
    "method": ["GET"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
EOF

print_info "Created CORS configuration file: $CORS_FILE"

# Apply CORS settings
print_info "Applying CORS settings to bucket..."
if gsutil cors set "$CORS_FILE" "gs://$BUCKET_NAME"; then
    print_success "CORS settings applied successfully!"
else
    print_error "Failed to apply CORS settings"
    exit 1
fi

# Verify CORS settings
print_info "Verifying CORS settings..."
if gsutil cors get "gs://$BUCKET_NAME" | grep -q "origin"; then
    print_success "CORS settings verified!"
else
    print_warning "CORS verification inconclusive"
fi

# Clean up
rm -f "$CORS_FILE"

# Determine expected URL based on known patterns
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

# Summary
echo ""
print_success "🎉 CORS setup completed for client: $CLIENT_NAME"
echo ""
print_info "Summary:"
echo "  Client: $CLIENT_NAME"
echo "  Project: $FIREBASE_PROJECT_ID"
echo "  Bucket: gs://$BUCKET_NAME"
echo "  Expected URL: $EXPECTED_URL"
echo "  CORS: Configured for cross-origin access"
echo ""
print_info "Next steps:"
echo "  1. Deploy the application to verify CORS functionality"
echo "  2. Test product image generation feature at: $EXPECTED_URL"
echo "  3. Update client documentation if needed"
echo ""