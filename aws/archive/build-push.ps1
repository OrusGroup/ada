<#
.SYNOPSIS
    Builds and Pushes the ADA Scanner Docker Image to AWS ECR.
.DESCRIPTION
    1. Authenticates Docker with AWS ECR.
    2. Builds the Docker image locally (including Chrome).
    3. Tags the image.
    4. Pushes it to the ECR repository.
#>

$ECR_REPO_NAME = "adacomply-scanner"
$AWS_REGION = "us-east-1"
$ACCOUNT_ID = aws sts get-caller-identity --query Account --output text

Write-Host "🚀 Starting Docker Build & Push Pipeline..." -ForegroundColor Cyan

# 1. Create Repository if not exists
Write-Host "1. Checking/Creating ECR Repository: $ECR_REPO_NAME"
try {
    aws ecr describe-repositories --repository-names $ECR_REPO_NAME | Out-Null
} catch {
    Write-Host "   Creating new repository..."
    aws ecr create-repository --repository-name $ECR_REPO_NAME | Out-Null
}

$ECR_URI = "$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_NAME"

# 2. Login to ECR
Write-Host "2. Logging in to ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

# 3. Build Image
Write-Host "3. Building Docker Image (This may take a few minutes)..."
# Go up one level to root context
Push-Location ..
docker build -t "$ECR_REPO_NAME`":latest .
Pop-Location

# 4. Tag Image
Write-Host "4. Tagging Image..."
docker tag "$ECR_REPO_NAME`":latest "$ECR_URI`":latest

# 5. Push Image
Write-Host "5. Pushing Image to ECR (This requires good internet)..."
docker push "$ECR_URI`":latest

Write-Host "✅ DONE! Image pushed to: $ECR_URI`":latest" -ForegroundColor Green
Write-Host "   Next Step: Update App Runner service to use this Image URI."
