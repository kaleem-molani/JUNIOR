# 🔐 GitHub Actions Secrets Setup

This document explains how to securely configure GitHub Actions secrets for your CI/CD pipeline.

## Required Secrets

### Database Secrets
```
DATABASE_URL_PRODUCTION = postgresql://username:password@host:port/database_name
```
- **Format**: `postgresql://username:password@host:port/database_name`
- **Example**: `postgresql://trading_user:securePass123@db.example.com:5432/trading_app`
- **Security**: Never commit this to your repository

### Authentication Secrets
```
NEXTAUTH_SECRET = your-secure-random-string-here
```
- **Purpose**: Used for NextAuth.js session encryption
- **Generation**: Use `openssl rand -base64 32` or similar
- **Example**: `super-secret-nextauth-key-123456789`

### SSH Access Secrets
```
LIGHTSAIL_HOST = 123.45.67.89
LIGHTSAIL_USER = ubuntu
LIGHTSAIL_SSH_KEY = -----BEGIN OPENSSH PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END OPENSSH PRIVATE KEY-----
LIGHTSAIL_PORT = 22
```
- **LIGHTSAIL_HOST**: Your AWS Lightsail instance IP address
- **LIGHTSAIL_USER**: SSH username (usually `ubuntu` for Ubuntu instances)
- **LIGHTSAIL_SSH_KEY**: Private SSH key for accessing your server
- **LIGHTSAIL_PORT**: SSH port (usually `22`)

### Notification Secrets (Optional)
```
SLACK_WEBHOOK = https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK/URL
```
- **Purpose**: Send deployment notifications to Slack
- **Setup**: Create a webhook in your Slack workspace

## How to Add Secrets

1. **Go to your GitHub repository**
2. **Navigate to**: Settings → Secrets and variables → Actions
3. **Click**: "New repository secret"
4. **Enter**:
   - **Name**: The secret name (e.g., `DATABASE_URL_PRODUCTION`)
   - **Value**: The actual secret value
5. **Click**: "Add secret"

## Security Best Practices

### 🔒 Database Security
- Use **strong, unique passwords** for database users
- **Restrict database access** to specific IP ranges
- Use **SSL/TLS encryption** for database connections
- **Rotate passwords regularly**

### 🔑 SSH Key Security
- Use **ED25519 keys** instead of RSA when possible
- **Never share private keys**
- **Restrict SSH access** to specific users/IPs on your server
- **Use key-based authentication only** (disable password auth)

### 🚀 Deployment Security
- **Test deployments** on staging before production
- **Use environment protection rules** in GitHub
- **Limit secret access** to specific branches
- **Monitor deployment logs** for security issues

## Environment Variables in Code

Your application will automatically use these secrets during deployment:

```bash
# .env.production (created automatically)
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://yourdomain.com
NODE_ENV=production
```

## Testing Secrets

To verify your secrets are working:

1. **Push a commit** to trigger the CI/CD pipeline
2. **Check the deployment logs** for:
   - ✅ "Database configuration loaded securely"
   - ✅ "Deployment successful!"
3. **Verify your application** is running on your Lightsail instance

## Troubleshooting

### Common Issues

**"DATABASE_URL not set!"**
- Check that `DATABASE_URL_PRODUCTION` secret is correctly set
- Verify the PostgreSQL connection string format

**"SSH connection failed"**
- Verify `LIGHTSAIL_HOST`, `LIGHTSAIL_USER`, and `LIGHTSAIL_SSH_KEY`
- Ensure the SSH key is properly formatted (no extra spaces/newlines)

**"Deployment failed"**
- Check server logs: `pm2 logs trading-app`
- Verify all required secrets are set
- Ensure your Lightsail instance has sufficient resources

## Additional Resources

- [GitHub Actions Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [AWS Lightsail Documentation](https://aws.amazon.com/lightsail/)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)