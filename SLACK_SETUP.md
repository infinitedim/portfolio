# 📢 Slack Webhook Integration Guide

> **Complete guide to setting up Slack webhooks for your portfolio notifications**

This guide will help you set up Slack webhook integration to receive notifications from your portfolio (e.g., contact form submissions, admin alerts, security events).

---

## 📋 Table of Contents

- [What is a Slack Webhook?](#what-is-a-slack-webhook)
- [How to Find/Create Your Slack Webhook URL](#how-to-findcreate-your-slack-webhook-url)
- [Setting Up the Webhook in Your Portfolio](#setting-up-the-webhook-in-your-portfolio)
- [Testing Your Integration](#testing-your-integration)
- [Webhook Message Formats](#webhook-message-formats)
- [Troubleshooting](#troubleshooting)
- [Security Best Practices](#security-best-practices)

---

## 🤔 What is a Slack Webhook?

A Slack webhook is a simple way to post messages from external sources (like your portfolio) into Slack channels. It's a unique URL that acts as an endpoint for sending JSON-formatted messages directly to a specific Slack channel.

**Use Cases for this Portfolio:**
- 📧 Contact form submissions
- 🔐 Security alerts (failed login attempts, suspicious activity)
- 📊 Admin notifications (new blog comments, system events)
- 🐛 Error notifications
- 📈 Analytics summaries

---

## 🔍 How to Find/Create Your Slack Webhook URL

### Step 1: Access Slack App Directory

1. Go to your Slack workspace
2. Click on your workspace name in the top-left
3. Select **"Settings & administration"** → **"Manage apps"**
4. This will open the [Slack App Directory](https://slack.com/apps)

### Step 2: Create an Incoming Webhook

#### Option A: Using Incoming Webhooks App (Recommended for Simple Use)

1. In the App Directory, search for **"Incoming Webhooks"**
2. Click **"Add to Slack"** or **"Add Configuration"**
3. Choose the channel where you want notifications to appear
   - Example: `#portfolio-notifications` or `#alerts`
   - You can create a new channel specifically for portfolio notifications
4. Click **"Add Incoming Webhooks integration"**
5. **Your Webhook URL is now displayed!** It looks like:
   ```
   https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
   ```
6. Copy this URL - you'll need it for the `.env` file

#### Option B: Creating a Custom Slack App (Advanced)

For more control and features:

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click **"Create New App"** → **"From scratch"**
3. Name your app (e.g., "Portfolio Notifications")
4. Select your workspace
5. In the app settings:
   - Click **"Incoming Webhooks"** in the sidebar
   - Toggle **"Activate Incoming Webhooks"** to **ON**
   - Click **"Add New Webhook to Workspace"**
   - Select the channel for notifications
   - Click **"Allow"**
6. Copy the generated webhook URL

### Step 3: Customize Your Integration (Optional)

After creating the webhook, you can customize:

- **Label**: Give your integration a descriptive name
  - Example: "Portfolio Contact Form Alerts"
- **Customize Name**: The name that appears as the message sender
  - Example: "Portfolio Bot"
- **Customize Icon**: Upload a custom emoji or image
  - Use your portfolio logo or a 📬 emoji
- **Descriptive Label**: Note what this webhook is used for
  - Example: "Sends notifications from infinitedim.site portfolio"

---

## ⚙️ Setting Up the Webhook in Your Portfolio

### 1. Add Environment Variables

Open your `.env.local` or `.env` file and add:

```env
# ----------------------------------------------------------------------------
# Slack Integration (for notifications)
# ----------------------------------------------------------------------------
# Webhook URL for sending notifications to Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Optional: Customize notification settings
SLACK_CHANNEL_OVERRIDE=#specific-channel  # Override default channel
SLACK_USERNAME=Portfolio Bot              # Custom bot name
SLACK_ICON_EMOJI=:rocket:                 # Bot emoji (e.g., :robot_face:)

# Feature flags
ENABLE_SLACK_NOTIFICATIONS=true           # Master toggle for all Slack notifications
ENABLE_SLACK_CONTACT_ALERTS=true          # Contact form notifications
ENABLE_SLACK_SECURITY_ALERTS=true         # Security event notifications
ENABLE_SLACK_ERROR_ALERTS=false           # Error notifications (can be noisy)
```

### 2. Update Your Environment Configuration

If you're using environment validation (like Zod), add the Slack variables to your validation schema:

**Backend (`packages/backend/src/env.config.ts`):**
```typescript
SLACK_WEBHOOK_URL: z.string().url().optional(),
ENABLE_SLACK_NOTIFICATIONS: z
  .string()
  .transform((v) => v === 'true')
  .optional()
  .default('false'),
```

### 3. Implement Slack Service (Future Integration)

The webhook is configured! When implemented, the service will:

1. Send formatted messages to your Slack channel
2. Include rich formatting (colors, emojis, attachments)
3. Handle rate limiting and retries
4. Log notification events

**Example implementation location:**
- `packages/backend/src/notifications/slack.service.ts`

---

## 🧪 Testing Your Integration

### Quick Test with cURL

Test your webhook URL directly:

```bash
curl -X POST \
  -H 'Content-Type: application/json' \
  -d '{"text": "🎉 Hello from Terminal Portfolio!"}' \
  YOUR_WEBHOOK_URL
```

Replace `YOUR_WEBHOOK_URL` with your actual webhook URL.

If successful, you should see the message appear in your Slack channel!

### Advanced Test with Formatting

```bash
TIMESTAMP=$(date +%s)
curl -X POST \
  -H 'Content-Type: application/json' \
  -d "{
    \"text\": \"Portfolio Notification Test\",
    \"attachments\": [
      {
        \"color\": \"#36a64f\",
        \"title\": \"Test Notification\",
        \"text\": \"This is a test from your portfolio setup!\",
        \"footer\": \"Terminal Portfolio\",
        \"footer_icon\": \"https://platform.slack-edge.com/img/default_application_icon.png\",
        \"ts\": $TIMESTAMP
      }
    ]
  }" \
  YOUR_WEBHOOK_URL
```

---

## 📨 Webhook Message Formats

### Basic Text Message

```json
{
  "text": "Simple notification message"
}
```

### Rich Formatted Message

```json
{
  "text": "New Contact Form Submission! 📬",
  "attachments": [
    {
      "color": "#2eb886",
      "fields": [
        {
          "title": "Name",
          "value": "John Doe",
          "short": true
        },
        {
          "title": "Email",
          "value": "john@example.com",
          "short": true
        },
        {
          "title": "Message",
          "value": "I'd love to discuss a project...",
          "short": false
        }
      ],
      "footer": "Portfolio Contact Form",
      "ts": 1234567890
    }
  ]
}
```

### Security Alert Format

```json
{
  "text": "⚠️ Security Alert",
  "attachments": [
    {
      "color": "danger",
      "title": "Failed Login Attempt",
      "fields": [
        {
          "title": "IP Address",
          "value": "192.168.1.1",
          "short": true
        },
        {
          "title": "Timestamp",
          "value": "2024-12-13 18:00:00",
          "short": true
        }
      ],
      "footer": "Security Monitor",
      "ts": 1234567890
    }
  ]
}
```

---

## 🔧 Troubleshooting

### "invalid_payload" Error

**Cause:** Malformed JSON or invalid message structure

**Solution:**
- Validate your JSON structure
- Ensure proper Content-Type header: `application/json`
- Check that required fields are present

### "channel_not_found" Error

**Cause:** The webhook's channel was deleted or archived

**Solution:**
- Recreate the webhook with a new channel
- Verify the channel exists and is active

### Messages Not Appearing

**Checklist:**
1. ✅ Verify the webhook URL is correct (no typos)
2. ✅ Check the Slack channel - are you in it?
3. ✅ Confirm the webhook integration is active in Slack settings
4. ✅ Test with cURL to isolate the issue
5. ✅ Check application logs for errors

### Rate Limiting

Slack webhooks have a limit of **1 message per second**.

**Solution:**
- Implement message queuing
- Batch similar notifications
- Add exponential backoff retry logic

---

## 🔒 Security Best Practices

### ⚠️ CRITICAL: Protect Your Webhook URL

Your webhook URL is **sensitive** - treat it like a password!

**DO:**
- ✅ Store in environment variables (`.env.local`)
- ✅ Add `.env.local` to `.gitignore`
- ✅ Use secrets management in production (Vercel/AWS Secrets)
- ✅ Rotate webhooks periodically
- ✅ Limit webhook access to necessary services only

**DON'T:**
- ❌ Commit webhook URLs to version control
- ❌ Share webhooks publicly
- ❌ Use the same webhook across multiple projects
- ❌ Log webhook URLs in application logs

### If Your Webhook is Compromised

1. **Immediately disable** the webhook in Slack:
   - Go to App Directory → Manage → Your Integration
   - Click "Remove" or "Disable"
2. **Create a new webhook** with a fresh URL
3. **Update your environment variables**
4. **Audit** logs to see what was sent
5. **Review** access to your environment variables

### Monitoring

Set up monitoring for:
- Failed webhook delivery attempts
- Unusual message volumes (potential abuse)
- Response time from Slack API
- Error rates

---

## 🎯 Next Steps

Once your webhook is configured:

1. **Test** the integration thoroughly
2. **Monitor** the first few notifications
3. **Adjust** message formats for readability
4. **Set up** notification rules (when to alert)
5. **Document** custom notification types for your team
6. **Consider** setting up different webhooks for:
   - Development notifications (testing)
   - Production alerts (critical)
   - Analytics summaries (daily/weekly)

---

## 📚 Additional Resources

### Official Documentation
- [Slack Incoming Webhooks Guide](https://api.slack.com/messaging/webhooks)
- [Slack Message Formatting](https://api.slack.com/reference/surfaces/formatting)
- [Slack Block Kit Builder](https://api.slack.com/block-kit/building) - Visual message designer

### Useful Tools
- [Slack Block Kit Builder](https://app.slack.com/block-kit-builder) - Design rich messages
- [Webhook.site](https://webhook.site) - Test webhook payloads
- [Postman](https://www.postman.com) - API testing tool

---

## 🤝 Need Help?

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section above
2. Review [Slack API Status](https://status.slack.com)
3. Open an issue in the [GitHub repository](https://github.com/infinitedim/portfolio/issues)
4. Check existing issues for similar problems

---

## 📝 Example: Complete Setup Flow

Here's a complete example from start to finish:

### 1. Create Webhook in Slack
```
Workspace: My Awesome Team
Channel: #portfolio-alerts
Webhook URL: https://hooks.slack.com/services/T[WORKSPACE_ID]/B[CHANNEL_ID]/[TOKEN_STRING]
```

### 2. Add to `.env.local`
```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T[WORKSPACE_ID]/B[CHANNEL_ID]/[TOKEN_STRING]
ENABLE_SLACK_NOTIFICATIONS=true
SLACK_USERNAME=Portfolio Bot
SLACK_ICON_EMOJI=:rocket:
```

### 3. Test with cURL
```bash
curl -X POST \
  -H 'Content-Type: application/json' \
  -d '{"text": "✅ Slack integration is working!"}' \
  https://hooks.slack.com/services/T[WORKSPACE_ID]/B[CHANNEL_ID]/[TOKEN_STRING]
```

### 4. Verify in Slack
Check your `#portfolio-alerts` channel - you should see the test message!

### 5. Ready for Production
Your Slack integration is now ready. When the notification service is implemented, all configured alerts will automatically flow to your Slack channel.

---

**🎉 Congratulations!** You've successfully set up Slack webhook integration for your portfolio.

For questions or improvements to this guide, please contribute to the documentation!

---

*Last Updated: December 2024*
*Guide Version: 1.0*
