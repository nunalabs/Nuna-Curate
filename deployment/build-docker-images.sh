#!/bin/bash

# ==============================================================================
# NUNA CURATE - DOCKER IMAGE BUILD SCRIPT
# ==============================================================================
# Builds optimized Docker images for production deployment
# Supports multi-platform builds for deployment flexibility
# ==============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# ==============================================================================
# Configuration
# ==============================================================================

# Default values
BUILD_TYPE="single"  # single or multi-platform
IMAGE_TAG="latest"
REGISTRY=""  # Docker registry (leave empty for local builds)
PUSH_IMAGES="false"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --multi-platform)
            BUILD_TYPE="multi"
            shift
            ;;
        --tag)
            IMAGE_TAG="$2"
            shift 2
            ;;
        --registry)
            REGISTRY="$2"
            shift 2
            ;;
        --push)
            PUSH_IMAGES="true"
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --multi-platform    Build for multiple platforms (linux/amd64, linux/arm64)"
            echo "  --tag TAG           Image tag (default: latest)"
            echo "  --registry URL      Docker registry URL (e.g., ghcr.io/username)"
            echo "  --push              Push images to registry after building"
            echo "  --help              Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                                    # Build for local platform"
            echo "  $0 --tag v1.0.0                       # Build with specific tag"
            echo "  $0 --multi-platform --push            # Build multi-platform and push"
            echo "  $0 --registry ghcr.io/user --push     # Build and push to GitHub Container Registry"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# ==============================================================================
# Pre-flight Checks
# ==============================================================================

log_info "Running pre-flight checks..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed. Please install Docker first."
    exit 1
fi

log_success "Docker is installed"

# Check if buildx is available for multi-platform builds
if [ "$BUILD_TYPE" = "multi" ]; then
    if ! docker buildx version &> /dev/null; then
        log_error "Docker Buildx is not available. Please update Docker."
        exit 1
    fi

    # Create/use buildx builder
    if ! docker buildx inspect multiplatform-builder &> /dev/null; then
        log_info "Creating multiplatform builder..."
        docker buildx create --name multiplatform-builder --use
    else
        log_info "Using existing multiplatform builder..."
        docker buildx use multiplatform-builder
    fi

    log_success "Docker Buildx is configured"
fi

# Check if registry is set when push is enabled
if [ "$PUSH_IMAGES" = "true" ] && [ -z "$REGISTRY" ]; then
    log_error "Registry must be specified when using --push"
    exit 1
fi

# ==============================================================================
# Image Configuration
# ==============================================================================

# Define image names
if [ -n "$REGISTRY" ]; then
    FRONTEND_IMAGE="$REGISTRY/nuna-frontend:$IMAGE_TAG"
    BACKEND_IMAGE="$REGISTRY/nuna-backend:$IMAGE_TAG"
else
    FRONTEND_IMAGE="nuna-frontend:$IMAGE_TAG"
    BACKEND_IMAGE="nuna-backend:$IMAGE_TAG"
fi

log_info "Build Configuration:"
echo "  Build Type: $BUILD_TYPE"
echo "  Image Tag: $IMAGE_TAG"
echo "  Frontend: $FRONTEND_IMAGE"
echo "  Backend: $BACKEND_IMAGE"
if [ "$PUSH_IMAGES" = "true" ]; then
    echo "  Push: Enabled"
else
    echo "  Push: Disabled"
fi
echo ""

# ==============================================================================
# Build Images
# ==============================================================================

# Build flags based on build type
if [ "$BUILD_TYPE" = "multi" ]; then
    PLATFORMS="linux/amd64,linux/arm64"
    BUILD_CMD="docker buildx build --platform $PLATFORMS"
    if [ "$PUSH_IMAGES" = "true" ]; then
        BUILD_CMD="$BUILD_CMD --push"
    else
        BUILD_CMD="$BUILD_CMD --load"
        log_warning "Multi-platform build without --push will only load the image for current platform"
    fi
else
    BUILD_CMD="docker build"
    if [ "$PUSH_IMAGES" = "true" ]; then
        PUSH_AFTER_BUILD="true"
    fi
fi

# Build Frontend
log_info "Building frontend image..."
START_TIME=$(date +%s)

$BUILD_CMD \
    -f apps/web/Dockerfile \
    -t "$FRONTEND_IMAGE" \
    --build-arg NODE_ENV=production \
    .

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

log_success "Frontend image built in ${DURATION}s"

# Push frontend if single platform and push enabled
if [ "$BUILD_TYPE" = "single" ] && [ "$PUSH_IMAGES" = "true" ]; then
    log_info "Pushing frontend image..."
    docker push "$FRONTEND_IMAGE"
    log_success "Frontend image pushed"
fi

# Build Backend
log_info "Building backend image..."
START_TIME=$(date +%s)

$BUILD_CMD \
    -f apps/backend/Dockerfile \
    -t "$BACKEND_IMAGE" \
    --build-arg NODE_ENV=production \
    .

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

log_success "Backend image built in ${DURATION}s"

# Push backend if single platform and push enabled
if [ "$BUILD_TYPE" = "single" ] && [ "$PUSH_IMAGES" = "true" ]; then
    log_info "Pushing backend image..."
    docker push "$BACKEND_IMAGE"
    log_success "Backend image pushed"
fi

# ==============================================================================
# Image Analysis
# ==============================================================================

if [ "$BUILD_TYPE" = "single" ]; then
    log_info "Image sizes:"

    FRONTEND_SIZE=$(docker images "$FRONTEND_IMAGE" --format "{{.Size}}")
    BACKEND_SIZE=$(docker images "$BACKEND_IMAGE" --format "{{.Size}}")

    echo "  Frontend: $FRONTEND_SIZE"
    echo "  Backend:  $BACKEND_SIZE"
    echo ""

    # Layer analysis
    log_info "Layer count:"
    FRONTEND_LAYERS=$(docker history "$FRONTEND_IMAGE" --quiet | wc -l)
    BACKEND_LAYERS=$(docker history "$BACKEND_IMAGE" --quiet | wc -l)

    echo "  Frontend: $FRONTEND_LAYERS layers"
    echo "  Backend:  $BACKEND_LAYERS layers"
    echo ""
fi

# ==============================================================================
# Summary
# ==============================================================================

log_success "Build completed successfully!"
echo ""
log_info "Next steps:"
if [ "$PUSH_IMAGES" = "true" ]; then
    echo "  Images have been pushed to registry"
    echo "  Update your docker-compose.prod.yml to use these images"
else
    echo "  Images are available locally"
    echo "  Run: docker images | grep nuna"
    echo ""
    echo "  To deploy locally:"
    echo "    docker-compose -f docker-compose.prod.yml up -d"
    echo ""
    echo "  To push to registry:"
    echo "    $0 --registry <your-registry> --push"
fi
echo ""
log_info "Image tags:"
echo "  $FRONTEND_IMAGE"
echo "  $BACKEND_IMAGE"
