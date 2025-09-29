# 🚀 Eudaura Deployment Guide

## Quick Start

**To set up AWS infrastructure and deploy your Eudaura platform:**

### 1. Prerequisites

- AWS CLI installed and configured with credentials
- AWS account with permissions to create DynamoDB tables, S3 buckets, and IAM roles
- Git repository already pushed to GitHub

### 2. Run the Setup Script

```bash
cd /Users/alexsiegel/Eudaurasite/eudaura-site
./scripts/setup-aws-infrastructure.sh
```

This script will automatically create:
- ✅ DynamoDB tables (tele_users, tele_clinician_apps, tele_audit)
- ✅ S3 bucket (eudaura-documents) with encryption and versioning
- ✅ IAM policies and roles for Amplify access
- ✅ .env.local file for local development

### 3. Configure AWS Amplify

After running the script, set these environment variables in your **AWS Amplify Console**:

**Go to:** https://console.aws.amazon.com/amplify/home?region=us-east-1#/d28ow29ha3x2t5

**Navigate to:** `Environment variables` section

**Add these variables:**

| Variable Name | Value | Example |
|---------------|-------|---------|
| `AWS_REGION` | us-east-1 | us-east-1 |
| `S3_BUCKET_NAME` | eudaura-documents | eudaura-documents |
| `AWS_ACCESS_KEY_ID` | Your AWS Access Key | AKIAIOSFODNN7EXAMPLE |
| `AWS_SECRET_ACCESS_KEY` | Your AWS Secret Key | wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY |
| `SEED_ADMIN_EMAIL` | admin@eudaura.com | admin@eudaura.com |
| `NODE_ENV` | production | production |

**⚠️ Important:** Get `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` from IAM user with permissions for DynamoDB and S3.

### 4. Deploy

Once environment variables are set:

1. **Trigger a deployment** in Amplify Console, or
2. **Push to GitHub** - Amplify will auto-deploy:
   ```bash
   git push origin main
   ```

### 5. Verify Deployment

After deployment completes (~5-10 minutes):

**Test these URLs:**
- ✅ Main site: `https://main.d28ow29ha3x2t5.amplifyapp.com`
- ✅ Patient signup: `https://main.d28ow29ha3x2t5.amplifyapp.com/signup/patient`
- ✅ Clinician signup: `https://main.d28ow29ha3x2t5.amplifyapp.com/signup/clinician`
- ✅ Admin panel: `https://main.d28ow29ha3x2t5.amplifyapp.com/admin`
- ✅ Approvals: `https://main.d28ow29ha3x2t5.amplifyapp.com/admin/approvals`

---

## Troubleshooting

### DynamoDB Access Denied
**Problem:** API returns 403 errors when trying to access DynamoDB

**Solution:**
1. Verify IAM user has DynamoDB permissions
2. Check environment variables are set correctly in Amplify
3. Ensure IAM role is attached to Amplify app

### S3 Upload Failures
**Problem:** Document uploads fail

**Solution:**
1. Verify S3 bucket exists and is accessible
2. Check S3_BUCKET_NAME environment variable matches actual bucket name
3. Ensure IAM user has s3:PutObject permission

### Build Failures
**Problem:** Amplify build fails

**Solution:**
1. Check build logs in Amplify Console
2. Verify all dependencies are in package.json
3. Ensure environment variables are set before build

---

## Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
```bash
# Copy the generated .env.local file
cp .env.local.example .env.local

# Edit .env.local and add your AWS credentials
```

### 3. Run Development Server
```bash
npm run dev
```

Your site will be available at: `http://localhost:3000`

---

## Manual AWS Setup (Alternative)

If you prefer to set up AWS resources manually:

### 1. Create DynamoDB Tables

**Go to:** https://console.aws.amazon.com/dynamodb/home

**Create 3 tables** with these settings:

#### Table: tele_users
- Partition key: `pk` (String)
- Sort key: `sk` (String)
- Billing mode: On-demand
- Tags: Project=Eudaura, Environment=Production

#### Table: tele_clinician_apps
- Partition key: `pk` (String)
- Sort key: `sk` (String)
- Billing mode: On-demand
- Tags: Project=Eudaura, Environment=Production

#### Table: tele_audit
- Partition key: `pk` (String)
- Sort key: `sk` (String)
- Billing mode: On-demand
- Tags: Project=Eudaura, Environment=Production

### 2. Create S3 Bucket

**Go to:** https://s3.console.aws.amazon.com

**Create bucket:**
- Name: `eudaura-documents`
- Region: `us-east-1`
- Block all public access: ✅ Enabled
- Bucket versioning: ✅ Enabled
- Encryption: ✅ AES-256

### 3. Create IAM User

**Go to:** https://console.aws.amazon.com/iam/

**Create user:**
- Username: `eudaura-amplify`
- Access type: Programmatic access
- Permissions: Create custom policy (see script for policy JSON)

**Save the Access Key ID and Secret Access Key!**

### 4. Configure Amplify

Add the environment variables listed in section 3 above.

---

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `AWS_REGION` | AWS region for all services | us-east-1 |
| `AWS_ACCESS_KEY_ID` | IAM user access key | AKIAIOSFODNN7EXAMPLE |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key | wJalrXUtnFEMI/... |
| `S3_BUCKET_NAME` | S3 bucket for documents | eudaura-documents |
| `SEED_ADMIN_EMAIL` | Admin user email | admin@eudaura.com |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | production |
| `NEXT_PUBLIC_APP_ENV` | App environment | production |

---

## Post-Deployment Checklist

After successful deployment:

- [ ] Test patient signup flow
- [ ] Test clinician application flow
- [ ] Verify OTP codes are generated (check CloudWatch logs)
- [ ] Test document uploads to S3
- [ ] Access admin panel and review applications
- [ ] Test approve/deny workflows
- [ ] Verify audit logs are being written to DynamoDB
- [ ] Test middleware guards for unauthorized access

---

## Support

If you encounter issues:

1. **Check CloudWatch Logs**: AWS Lambda logs from Amplify
2. **DynamoDB Console**: Verify data is being written
3. **S3 Console**: Check document uploads are successful
4. **Amplify Console**: Review build and deployment logs

---

## Security Notes

### Production Deployment

Before going live:

1. **Rotate AWS credentials** regularly
2. **Enable AWS CloudTrail** for audit logging
3. **Set up AWS Backup** for DynamoDB tables
4. **Configure SES** for production email sending
5. **Enable AWS WAF** on Amplify for DDoS protection
6. **Add custom domain** with SSL certificate
7. **Set up monitoring** with CloudWatch alarms

### HIPAA Compliance

If handling PHI (Protected Health Information):

1. Sign AWS Business Associate Agreement (BAA)
2. Enable encryption at rest for all DynamoDB tables
3. Enable S3 bucket encryption with KMS
4. Enable CloudTrail logging for all API calls
5. Implement data retention policies
6. Set up automated backups
7. Configure access logging for S3

---

## Next Steps

Your Eudaura platform is now ready for production! 🎉

**Immediate Actions:**
1. Run the setup script: `./scripts/setup-aws-infrastructure.sh`
2. Add AWS credentials to Amplify Console
3. Deploy and test

**Future Enhancements:**
- Implement SES email templates for OTP and notifications
- Add Cognito for authentication (currently using simple cookie-based auth)
- Set up monitoring and alerting
- Implement data backup and disaster recovery
- Add analytics and usage tracking

---

**Questions?** Check the troubleshooting section or review AWS CloudWatch logs for errors.
