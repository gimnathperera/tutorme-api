# Docker-based Azure Deployment Guide

This guide shows how to deploy your TutorMe API with MongoDB using Docker containers on Azure, eliminating the need for separate database services.

## 🐳 Docker Deployment Options

### Option 1: Azure Container Instances (Simplest)

#### 1.1 Build and Push Docker Images

```bash
# Build the production image
docker build -t tutorme-api:latest .

# Tag for Azure Container Registry
docker tag tutorme-api:latest your-registry.azurecr.io/tutorme-api:latest

# Push to registry
docker push your-registry.azurecr.io/tutorme-api:latest
```

#### 1.2 Deploy with Docker Compose

```bash
# Create resource group
az group create --name tutorme-rg --location "East US"

# Create container group with both services
az container create \
  --resource-group tutorme-rg \
  --name tutorme-stack \
  --image your-registry.azurecr.io/tutorme-api:latest \
  --cpu 2 \
  --memory 4 \
  --ports 3000 \
  --environment-variables \
    NODE_ENV=production \
    MONGODB_URL="mongodb://admin:password@localhost:27017/tutorme?authSource=admin" \
    JWT_SECRET="your-jwt-secret" \
  --command-line "docker-compose -f docker-compose.prod.yml up"
```

### Option 2: Azure Kubernetes Service (AKS) - Recommended

#### 2.1 Create AKS Cluster

```bash
# Create AKS cluster
az aks create \
  --resource-group tutorme-rg \
  --name tutorme-aks \
  --node-count 2 \
  --enable-addons monitoring \
  --generate-ssh-keys \
  --node-vm-size Standard_B2s

# Get credentials
az aks get-credentials --resource-group tutorme-rg --name tutorme-aks
```

#### 2.2 Deploy to AKS

```bash
# Create namespace
kubectl create namespace tutorme

# Apply the deployment
kubectl apply -f k8s-deployment.yaml

# Check status
kubectl get pods -n tutorme
kubectl get services -n tutorme
```

#### 2.3 Get External IP

```bash
# Get the external IP of your API
kubectl get service tutorme-api-service -n tutorme
```

### Option 3: Azure Container Apps (Serverless)

#### 3.1 Create Container Apps Environment

```bash
# Create Container Apps environment
az containerapp env create \
  --name tutorme-env \
  --resource-group tutorme-rg \
  --location "East US"
```

#### 3.2 Deploy MongoDB Container App

```bash
# Deploy MongoDB
az containerapp create \
  --name tutorme-mongo \
  --resource-group tutorme-rg \
  --environment tutorme-env \
  --image mongo:7 \
  --target-port 27017 \
  --ingress internal \
  --env-vars \
    MONGO_INITDB_ROOT_USERNAME=admin \
    MONGO_INITDB_ROOT_PASSWORD=password \
    MONGO_INITDB_DATABASE=tutorme
```

#### 3.3 Deploy API Container App

```bash
# Deploy API
az containerapp create \
  --name tutorme-api \
  --resource-group tutorme-rg \
  --environment tutorme-env \
  --image your-registry.azurecr.io/tutorme-api:latest \
  --target-port 3000 \
  --ingress external \
  --env-vars \
    NODE_ENV=production \
    MONGODB_URL="mongodb://admin:password@tutorme-mongo:27017/tutorme?authSource=admin" \
    JWT_SECRET="your-jwt-secret"
```

## 🔧 Local Development with Docker

### Quick Start

```bash
# Copy environment file
cp .env.production .env

# Edit environment variables
nano .env

# Start services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

### Environment Variables

Create `.env` file:

```env
# Production Environment Variables
NODE_ENV=production
PORT=3000

# MongoDB Configuration
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your-secure-password-here
MONGO_DATABASE=tutorme

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_ACCESS_EXPIRATION_MINUTES=30
JWT_REFRESH_EXPIRATION_DAYS=30
JWT_RESET_PASSWORD_EXPIRATION_MINUTES=10
JWT_VERIFY_EMAIL_EXPIRATION_MINUTES=10

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@tutorme.com
```

## 🚀 CI/CD Pipeline with Docker

### GitHub Actions

Create `.github/workflows/docker-deploy.yml`:

```yaml
name: Build and Deploy Docker

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v2

    - name: Login to Azure
      uses: azure/login@v1
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}

    - name: Login to ACR
      run: az acr login --name your-registry

    - name: Build and push image
      run: |
        docker build -t your-registry.azurecr.io/tutorme-api:${{ github.sha }} .
        docker push your-registry.azurecr.io/tutorme-api:${{ github.sha }}

    - name: Deploy to AKS
      run: |
        az aks get-credentials --resource-group tutorme-rg --name tutorme-aks
        kubectl set image deployment/tutorme-api tutorme-api=your-registry.azurecr.io/tutorme-api:${{ github.sha }} -n tutorme
```

## 📊 Monitoring and Logging

### Application Insights

```bash
# Create Application Insights
az monitor app-insights component create \
  --app tutorme-insights \
  --location "East US" \
  --resource-group tutorme-rg

# Get instrumentation key
az monitor app-insights component show \
  --app tutorme-insights \
  --resource-group tutorme-rg \
  --query instrumentationKey
```

### Container Logs

```bash
# AKS logs
kubectl logs -f deployment/tutorme-api -n tutorme
kubectl logs -f deployment/mongo -n tutorme

# Container Instances logs
az container logs --name tutorme-stack --resource-group tutorme-rg
```

## 🔒 Security Best Practices

### 1. Secrets Management

```bash
# Create Kubernetes secrets
kubectl create secret generic tutorme-secrets \
  --from-literal=mongodb-url="mongodb://admin:password@mongo-service:27017/tutorme?authSource=admin" \
  --from-literal=jwt-secret="your-jwt-secret" \
  --namespace tutorme
```

### 2. Network Security

```yaml
# Network Policy for MongoDB
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: mongo-network-policy
  namespace: tutorme
spec:
  podSelector:
    matchLabels:
      app: mongo
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: tutorme-api
    ports:
    - protocol: TCP
      port: 27017
```

### 3. Resource Limits

The Kubernetes deployment includes resource limits:

```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

## 💰 Cost Comparison

| Option | Monthly Cost (Est.) | Pros | Cons |
|--------|-------------------|------|------|
| Container Instances | $50-100 | Simple, pay-per-use | Limited scaling |
| AKS | $100-200 | Full Kubernetes features | More complex |
| Container Apps | $30-80 | Serverless, auto-scaling | Newer service |

## 🔧 Troubleshooting

### Common Issues

1. **MongoDB Connection Issues**
   ```bash
   # Check MongoDB logs
   kubectl logs -f deployment/mongo -n tutorme

   # Test connection
   kubectl exec -it deployment/mongo -n tutorme -- mongosh
   ```

2. **API Not Starting**
   ```bash
   # Check API logs
   kubectl logs -f deployment/tutorme-api -n tutorme

   # Check environment variables
   kubectl describe pod -l app=tutorme-api -n tutorme
   ```

3. **Storage Issues**
   ```bash
   # Check persistent volumes
   kubectl get pv
   kubectl get pvc -n tutorme
   ```

### Health Checks

```bash
# Check API health
curl http://your-external-ip/healthz

# Check MongoDB
kubectl exec -it deployment/mongo -n tutorme -- mongosh --eval "db.adminCommand('ping')"
```

## 🎯 Recommended Approach

For production, I recommend **Azure Kubernetes Service (AKS)** because:

1. **Scalability**: Easy horizontal scaling
2. **Reliability**: Built-in health checks and restarts
3. **Security**: Network policies and secrets management
4. **Monitoring**: Integrated with Azure Monitor
5. **Cost**: Efficient resource utilization

## 📝 Next Steps

1. Choose your deployment option
2. Set up Azure Container Registry
3. Configure environment variables
4. Deploy using the provided scripts
5. Set up monitoring and alerts
6. Configure backup for MongoDB data

This Docker-based approach gives you a complete, self-contained solution without needing external database services!
