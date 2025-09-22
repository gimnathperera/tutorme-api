# Azure Deployment Guide for TutorMe API

This guide will walk you through deploying your Node.js Express API to Azure using multiple deployment options.

## Prerequisites

- Azure account with active subscription
- Azure CLI installed locally
- Git repository (GitHub, Azure DevOps, or Bitbucket)
- Node.js 20+ installed locally

## Deployment Options

### Option 1: Azure App Service (Recommended for beginners)

#### 1.1 Create Azure App Service

```bash
# Login to Azure
az login

# Create resource group
az group create --name tutorme-rg --location "East US"

# Create App Service plan
az appservice plan create --name tutorme-plan --resource-group tutorme-rg --sku B1 --is-linux

# Create web app
az webapp create --resource-group tutorme-rg --plan tutorme-plan --name tutorme-api --runtime "NODE|20-lts" --deployment-local-git
```

#### 1.2 Configure Environment Variables

```bash
# Set environment variables
az webapp config appsettings set --resource-group tutorme-rg --name tutorme-api --settings \
  NODE_ENV=production \
  PORT=8080 \
  MONGODB_URL="your-mongodb-connection-string" \
  JWT_SECRET="your-super-secret-jwt-key" \
  JWT_ACCESS_EXPIRATION_MINUTES=30 \
  JWT_REFRESH_EXPIRATION_DAYS=30 \
  JWT_RESET_PASSWORD_EXPIRATION_MINUTES=10 \
  JWT_VERIFY_EMAIL_EXPIRATION_MINUTES=10 \
  SMTP_HOST="your-smtp-host" \
  SMTP_PORT=587 \
  SMTP_USERNAME="your-email" \
  SMTP_PASSWORD="your-email-password" \
  EMAIL_FROM="noreply@tutorme.com"
```

#### 1.3 Deploy from Git

```bash
# Add Azure remote
git remote add azure https://tutorme-api.scm.azurewebsites.net/tutorme-api.git

# Deploy
git push azure main
```

### Option 2: Azure Container Instances (Docker)

#### 2.1 Build and Push Docker Image

```bash
# Login to Azure Container Registry
az acr login --name your-registry-name

# Build and tag image
docker build -t your-registry-name.azurecr.io/tutorme-api:latest .

# Push to registry
docker push your-registry-name.azurecr.io/tutorme-api:latest
```

#### 2.2 Deploy Container Instance

```bash
az container create \
  --resource-group tutorme-rg \
  --name tutorme-api \
  --image your-registry-name.azurecr.io/tutorme-api:latest \
  --cpu 1 \
  --memory 1 \
  --ports 3000 \
  --environment-variables \
    NODE_ENV=production \
    MONGODB_URL="your-mongodb-connection-string" \
    JWT_SECRET="your-jwt-secret"
```

### Option 3: Azure Kubernetes Service (AKS)

#### 3.1 Create AKS Cluster

```bash
# Create AKS cluster
az aks create --resource-group tutorme-rg --name tutorme-aks --node-count 1 --enable-addons monitoring --generate-ssh-keys

# Get credentials
az aks get-credentials --resource-group tutorme-rg --name tutorme-aks
```

#### 3.2 Create Kubernetes Manifests

Create `k8s-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tutorme-api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: tutorme-api
  template:
    metadata:
      labels:
        app: tutorme-api
    spec:
      containers:
      - name: tutorme-api
        image: your-registry-name.azurecr.io/tutorme-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: MONGODB_URL
          valueFrom:
            secretKeyRef:
              name: tutorme-secrets
              key: mongodb-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: tutorme-secrets
              key: jwt-secret
---
apiVersion: v1
kind: Service
metadata:
  name: tutorme-api-service
spec:
  selector:
    app: tutorme-api
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

#### 3.3 Deploy to AKS

```bash
# Create secrets
kubectl create secret generic tutorme-secrets \
  --from-literal=mongodb-url="your-mongodb-connection-string" \
  --from-literal=jwt-secret="your-jwt-secret"

# Deploy
kubectl apply -f k8s-deployment.yaml
```

## Database Setup Options

### Option 1: Docker-based MongoDB (Recommended - No External Services)

**Using Docker Compose (Local Development):**
```bash
# Start both API and MongoDB with Docker
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

**Using Azure Container Instances:**
```bash
# Deploy both services together
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
    JWT_SECRET="your-jwt-secret"
```

**Using Azure Kubernetes Service (AKS):**
```bash
# Deploy with persistent storage
kubectl apply -f k8s-deployment.yaml

# Check status
kubectl get pods -n tutorme
kubectl get services -n tutorme
```

### Option 2: Azure Cosmos DB (MongoDB API)

```bash
# Create Cosmos DB account
az cosmosdb create --name tutorme-cosmos --resource-group tutorme-rg --kind MongoDB

# Get connection string
az cosmosdb keys list --name tutorme-cosmos --resource-group tutorme-rg --type connection-strings
```

### Option 3: MongoDB Atlas (Cloud)

1. Sign up at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a cluster
3. Get connection string
4. Update `MONGODB_URL` environment variable

### Option 4: Self-hosted MongoDB on Azure VM

```bash
# Create VM
az vm create --resource-group tutorme-rg --name tutorme-mongo --image UbuntuLTS --admin-username azureuser --generate-ssh-keys

# Install MongoDB (SSH into VM)
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 9DA31620334BD75D9DCB49F368818C72E52529D4
echo "deb [ arch=amd64 ] https://repo.mongodb.org/apt/ubuntu bionic/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

## Environment Variables

Create a `.env` file for local development:

```env
NODE_ENV=production
PORT=3000
MONGODB_URL=mongodb://localhost:27017/tutorme
JWT_SECRET=your-super-secret-jwt-key-here
JWT_ACCESS_EXPIRATION_MINUTES=30
JWT_REFRESH_EXPIRATION_DAYS=30
JWT_RESET_PASSWORD_EXPIRATION_MINUTES=10
JWT_VERIFY_EMAIL_EXPIRATION_MINUTES=10
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@tutorme.com
```

## CI/CD Pipeline Setup

### GitHub Actions

Create `.github/workflows/azure-deploy.yml`:

```yaml
name: Deploy to Azure

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2

    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '20'

    - name: Install dependencies
      run: npm install

    - name: Run tests
      run: npm test

    - name: Deploy to Azure
      uses: azure/webapps-deploy@v2
      with:
        app-name: 'tutorme-api'
        publish-profile: ${{ secrets.AZUREAPPSERVICE_PUBLISHPROFILE }}
        package: .
```

### Azure DevOps Pipeline

The `azure-pipelines.yml` file is already created in your project root.

## Monitoring and Logging

### Application Insights

```bash
# Create Application Insights
az monitor app-insights component create --app tutorme-insights --location "East US" --resource-group tutorme-rg

# Get instrumentation key
az monitor app-insights component show --app tutorme-insights --resource-group tutorme-rg --query instrumentationKey
```

Add to your app:

```javascript
const appInsights = require('applicationinsights');
appInsights.setup('your-instrumentation-key').start();
```

## Security Considerations

1. **Environment Variables**: Never commit secrets to version control
2. **HTTPS**: Always use HTTPS in production
3. **CORS**: Configure CORS properly for your frontend domain
4. **Rate Limiting**: Already implemented in your app
5. **Input Validation**: Joi validation is already set up
6. **Security Headers**: Helmet.js is configured

## Troubleshooting

### Common Issues

1. **Port Issues**: Azure App Service uses port 8080, not 3000
2. **Environment Variables**: Make sure all required variables are set
3. **Database Connection**: Verify MongoDB connection string
4. **Build Failures**: Check Node.js version compatibility

### Logs

```bash
# View application logs
az webapp log tail --name tutorme-api --resource-group tutorme-rg

# Download logs
az webapp log download --name tutorme-api --resource-group tutorme-rg
```

## Cost Optimization

1. **App Service**: Use B1 tier for development, P1V2 for production
2. **Database**: Start with Cosmos DB free tier
3. **Monitoring**: Use Application Insights free tier
4. **Storage**: Use Standard storage for logs

## Next Steps

1. Set up custom domain
2. Configure SSL certificate
3. Set up staging environment
4. Implement blue-green deployment
5. Add monitoring and alerting

## Support

- [Azure App Service Documentation](https://docs.microsoft.com/en-us/azure/app-service/)
- [Node.js on Azure](https://docs.microsoft.com/en-us/azure/app-service/quickstart-nodejs)
- [Azure CLI Reference](https://docs.microsoft.com/en-us/cli/azure/)
