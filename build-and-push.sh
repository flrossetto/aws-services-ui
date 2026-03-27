#!/bin/bash

# Script para build e push da imagem Docker para Docker Hub

set -e

# Obter informações do git
GIT_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "v1.0.0")
GIT_COMMIT=$(git rev-parse --short HEAD)
IMAGE_NAME="flrossetto/aws-services-ui"

echo "🚀 Docker Build & Push Script"
echo "============================="
echo "📦 Git Tag: $GIT_TAG"
echo "🔑 Git Commit: $GIT_COMMIT"
echo "🏷️  Image: $IMAGE_NAME"
echo ""

# Verificar se está logado no Docker Hub
if ! docker info 2>/dev/null | grep -q "Username"; then
    echo "❌ Not logged into Docker Hub. Please run:"
    echo "   docker login"
    exit 1
fi

echo "🔨 Building Docker image..."
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
echo "📤 Pushing images to Docker Hub..."

# Push das imagens
echo "  Pushing $IMAGE_NAME:$GIT_TAG..."
docker push "$IMAGE_NAME:$GIT_TAG"

echo "  Pushing $IMAGE_NAME:$GIT_COMMIT..."
docker push "$IMAGE_NAME:$GIT_COMMIT"

echo "  Pushing $IMAGE_NAME:latest..."
docker push "$IMAGE_NAME:latest"

echo ""
echo "🎉 All images pushed successfully!"
echo ""
echo "📋 Available images on Docker Hub:"
echo "  https://hub.docker.com/r/flrossetto/aws-services-ui/tags"
echo ""
echo "🚀 To deploy:"
echo "  docker pull $IMAGE_NAME:$GIT_TAG"
echo "  docker run -p 8080:8080 $IMAGE_NAME:$GIT_TAG"