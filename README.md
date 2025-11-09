# Trading App

A scalable trading application built with Next.js that enables users to connect their Angel One trading accounts and receive automated trading signals.

<!-- CI/CD Pipeline Test - 2025-11-09 -->

## Getting Started

First, install dependencies:

```bash
npm install
```

Set up the database:

```bash
npx prisma generate
npx prisma db push
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database Setup

1. Install PostgreSQL and create a database.
2. Update `.env` with your `DATABASE_URL`.
3. Run `npx prisma db push` to create tables.

## Features

- Admin panel for broadcasting trade signals
- User accounts for managing trading accounts
- Modular broker integrations
- Database persistence with Prisma
- Error handling and scalability

---

# 📋 User Onboarding Guide

This guide will walk you through the complete process of registering for the trading app and integrating your Angel One trading account.

## Step 1: User Registration

### 1.1 Access the Registration Page
- Navigate to the application URL (provided by your administrator)
- Click on the **"Register"** link or button

### 1.2 Fill Registration Form
Enter the following information:
- **Email**: Your valid email address (used for login and notifications)
- **Password**: Choose a strong password (minimum 8 characters)
- **Name**: Your full name (optional but recommended)

### 1.3 Email Verification
- Check your email for a verification link
- Click the verification link to activate your account
- You will be redirected to the login page

### 1.4 Login
- Use your registered email and password to log in
- You will be redirected to your user dashboard

---

## Step 2: Angel One Account Setup

### 2.1 Create Angel One Account
If you don't have an Angel One account:

1. Visit [Angel One website](https://www.angelone.in/)
2. Click **"Open Account"**
3. Choose your account type (Individual/Proprietorship/Company)
4. Complete KYC verification with:
   - PAN Card
   - Aadhaar Card
   - Bank account details
   - Photograph
5. Fund your account with the minimum required amount

### 2.2 Enable API Trading
Angel One provides API access for automated trading. Here's how to enable it:

#### Option A: Through Angel One App
1. Open Angel One mobile app
2. Go to **Menu → More → Developer API**
3. Enable API trading
4. Generate API credentials

#### Option B: Through Angel One Web Portal
1. Login to [Angel One web portal](https://www.angelone.in/)
2. Go to **Profile → API Trading**
3. Enable API access
4. Generate API Key and Secret

---

## Step 3: Getting API Credentials from Angel One

### 3.1 Required Credentials
You need the following information from your Angel One account:

1. **Client Code** (also called Client ID)
2. **API Key** (also called App Key)
3. **API Secret** (also called App Secret)
4. **PIN** (your Angel One login PIN)

### 3.2 How to Find Your Client Code
- **Mobile App**: Menu → Profile → Client Code
- **Web Portal**: Dashboard → Account Details → Client ID
- **Format**: Usually 6-8 characters (e.g., ABC12345)

### 3.3 How to Generate API Key and Secret

#### Method 1: Angel One Web Portal
1. Login to [Angel One web trading](https://trade.angelone.in/)
2. Go to **Profile → API Trading**
3. Click **"Generate API Key"**
4. Fill the form:
   - **App Name**: Give a descriptive name (e.g., "Trading App Integration")
   - **Redirect URL**: Can leave blank or use `http://localhost:3000` for testing
   - **Postback URL**: Leave blank
5. Submit and note down:
   - **API Key**: 20-30 character alphanumeric string
   - **API Secret**: 30-40 character alphanumeric string

#### Method 2: Angel One Mobile App
1. Open Angel One app
2. Go to **Menu → More → Developer API**
3. Tap **"Generate API Key"**
4. Follow the same steps as above

#### Method 3: Contact Angel One Support
If you're having trouble generating API keys:
- Call Angel One customer care: **1800-266-00-99**
- Email: **smartapi@angelone.in**
- Provide your Client Code and request API credentials

### 3.4 Important Notes
- **Security**: Never share your API credentials with anyone
- **Rate Limits**: Angel One has API rate limits (typically 100 requests/minute)
- **Trading Hours**: API works only during market hours (9:15 AM - 3:30 PM IST)
- **Permissions**: Ensure your account has trading permissions enabled

---

## Step 4: Integrating Trading Account in the App

### 4.1 Access Account Integration
1. Login to the trading app
2. Navigate to your **User Dashboard**
3. Click **"Add Trading Account"** or **"Connect Broker"**

### 4.2 Enter Angel One Credentials
Fill in the following fields:

| Field | Description | Example |
|-------|-------------|---------|
| **Account Name** | Give your account a memorable name | "My Angel One Account" |
| **Broker** | Select "Angel One" from dropdown | Angel One |
| **Client Code** | Your Angel One Client ID | ABC12345 |
| **API Key** | Your generated API Key | abcdef1234567890... |
| **API Secret** | Your generated API Secret | xyz789456123... |
| **PIN** | Your Angel One login PIN | 123456 |

### 4.3 Test Connection
- Click **"Test Connection"** to verify credentials
- The app will attempt to connect to Angel One API
- If successful, you'll see a confirmation message

### 4.4 Save Account
- Click **"Save Account"** to store your credentials securely
- Your account will appear in the **"My Accounts"** section
- The app will automatically refresh tokens as needed

### 4.5 Account Status
- **Active**: Account is connected and ready for trading
- **Inactive**: Account needs attention (check credentials or contact support)

---

## Step 5: Using the Application

### 5.1 Receiving Trading Signals
- Once your account is connected, you'll receive automated trading signals
- Signals appear in your dashboard with:
  - Stock symbol and quantity
  - Buy/Sell recommendation
  - Order type (Market/Limit)
  - Target price (if applicable)

### 5.2 Signal Execution
- Signals are automatically executed if you have:
  - Sufficient account balance
  - Valid API credentials
  - Account marked as "Active"

### 5.3 Monitoring Orders
- View your order history in the **"Orders"** section
- Check order status: Pending, Executed, Failed
- Review executed trades with profit/loss details

### 5.4 Account Management
- Update credentials if they change
- Enable/disable automatic trading
- View account balance and positions

---

## Troubleshooting

### Common Issues

#### 1. "Invalid Credentials" Error
- Double-check your Client Code, API Key, and API Secret
- Ensure API trading is enabled in Angel One
- Try regenerating API credentials

#### 2. "Account Not Active" Error
- Verify your Angel One account is funded
- Check if trading is enabled for your account type
- Contact Angel One support if needed

#### 3. "Token Expired" Error
- The app automatically refreshes tokens
- If persistent, re-enter your credentials
- Check your internet connection

#### 4. "Symbol Not Found" Error
- Ensure you're using correct symbol format
- Check if the symbol is available on the selected exchange
- Try searching with different exchange (NSE/BSE)

### Getting Help
- Check the app's help section
- Contact your administrator
- Email support: [support email]
- Phone: [support phone]

---

## Security Best Practices

1. **Never share credentials** with anyone
2. **Use strong passwords** for your trading app account
3. **Enable two-factor authentication** on Angel One account
4. **Regularly monitor** your account activity
5. **Keep API credentials secure** and rotate them periodically
6. **Use HTTPS** when accessing the application
7. **Logout** when not using the application

---

## API Rate Limits & Best Practices

- **Requests per minute**: 100 (Angel One limit)
- **Trading hours**: 9:15 AM - 3:30 PM IST (Monday-Friday)
- **Order types supported**: Market, Limit orders
- **Exchanges supported**: NSE, BSE, MCX, NFO, BFO
- **Product types**: Intraday, Delivery

---

*Last updated: October 30, 2025*
