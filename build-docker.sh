#!/bin/bash

# Script para build da imagem Docker otimizada com tag do git

set -e

# Obter informações do git
GIT_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "v1.0.0")
GIT_COMMIT=$(git rev-parse --short HEAD)
IMAGE_NAME="flrossetto/aws-services-ui"

echo "🔨 Building Docker image..."
echo "📦 Git Tag: $GIT_TAG"
echo "🔑 Git Commit: $GIT_COMMIT"
echo "🏷️  Image: $IMAGE_NAME:$GIT_TAG"
echo ""

# Build da imagem com múltiplas tags
docker build \
  --no-cache \
  --build-arg NODE_ENV=production \
  --build-arg GIT_TAG="$GIT_TAG" \
  --build-arg GIT_COMMIT="$GIT_COMMIT" \
  -t "$IMAGE_NAME:$GIT_TAG" \
  -t "$IMAGE_NAME:$GIT_COMMIT" \
  -t "$IMAGE_NAME:latest" \
  .

echo ""
echo "✅ Build completed!"
echo ""
echo "📋 Available tags:"
echo "  $IMAGE_NAME:$GIT_TAG"
echo "  $IMAGE_NAME:$GIT_COMMIT"
echo "  $IMAGE_NAME:latest"
echo ""
echo "🚀 To run the container:"
echo "  docker run -p 8080:8080 $IMAGE_NAME:$GIT_TAG"
echo ""
echo "📤 To push to Docker Hub:"
echo "  docker push $IMAGE_NAME:$GIT_TAG"
echo "  docker push $IMAGE_NAME:$GIT_COMMIT"
echo "  docker push $IMAGE_NAME:latest"