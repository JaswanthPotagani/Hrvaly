/**
 * Centralized monitoring and error logging with Sentry
 * 
 * This module provides a unified interface for logging errors, warnings, and info messages
 * to Sentry for production monitoring and debugging.
 */

import * as Sentry from "@sentry/nextjs";

// Initialize Sentry only if DSN is provided
const SENTRY_DSN = process.env.SENTRY_DSN;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

if (SENTRY_DSN && IS_PRODUCTION) {
    Sentry.init({
        dsn: SENTRY_DSN,
        environment: process.env.NODE_ENV,
        tracesSampleRate: 0.1, // Sample 10% of transactions
        // Add additional configuration as needed
    });
}

/**
 * Log an error to Sentry with context
 * @param {Error} error - The error object
 * @param {Object} context - Additional context (userId, plan, request details, etc.)
 */
export function logError(error, context = {}) {
    if (!SENTRY_DSN || !IS_PRODUCTION) {
        console.error("[Error]", error, context);
        return;
    }

    Sentry.withScope((scope) => {
        // Add context to the scope
        if (context.userId) scope.setUser({ id: context.userId });
        if (context.plan) scope.setTag("plan", context.plan);
        if (context.event) scope.setTag("event", context.event);
        
        // Add all context as extra data
        Object.entries(context).forEach(([key, value]) => {
            scope.setExtra(key, value);
        });

        Sentry.captureException(error);
    });
}

/**
 * Log a warning to Sentry
 * @param {string} message - Warning message
 * @param {Object} context - Additional context
 */
export function logWarning(message, context = {}) {
    if (!SENTRY_DSN || !IS_PRODUCTION) {
        console.warn("[Warning]", message, context);
        return;
    }

    Sentry.withScope((scope) => {
        scope.setLevel("warning");
        
        if (context.userId) scope.setUser({ id: context.userId });
        if (context.plan) scope.setTag("plan", context.plan);
        
        Object.entries(context).forEach(([key, value]) => {
            scope.setExtra(key, value);
        });

        Sentry.captureMessage(message);
    });
}

/**
 * Log an info message to Sentry
 * @param {string} message - Info message
 * @param {Object} context - Additional context
 */
export function logInfo(message, context = {}) {
    if (!SENTRY_DSN || !IS_PRODUCTION) {
        console.info("[Info]", message, context);
        return;
    }

    Sentry.withScope((scope) => {
        scope.setLevel("info");
        
        if (context.userId) scope.setUser({ id: context.userId });
        
        Object.entries(context).forEach(([key, value]) => {
            scope.setExtra(key, value);
        });

        Sentry.captureMessage(message);
    });
}

/**
 * Log unhandled webhook events
 * @param {string} eventType - The webhook event type
 * @param {Object} payload - The webhook payload
 */
export function logUnhandledWebhookEvent(eventType, payload) {
    logWarning(`Unhandled webhook event: ${eventType}`, {
        event: eventType,
        payload: JSON.stringify(payload),
        source: "razorpay_webhook"
    });
}

/**
 * Send an immediate critical alert to external channels (e.g. Discord)
 * @param {string} message - The alert message
 * @param {Object} context - Additional context
 */
export async function sendAlert(message, context = {}) {
    // Always log to console/Sentry first
    logError(new Error(`ALERT: ${message}`), context);

    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return;

    try {
        const level = context.level || 'error';
        let title = "🚨 **ERROR ALERT** 🚨";
        let color = 0xFF0000; // Red

        if (level === 'critical') {
            title = "🔥 **CRITICAL ALERT** 🔥 @everyone";
            color = 0x8B0000; // Dark Red
        } else if (level === 'info') {
            title = "ℹ️ **INFO ALERT**";
            color = 0x00FF00; // Green
        } else if (level === 'warning') {
            title = "⚠️ **WARNING ALERT**";
            color = 0xFFA500; // Orange
        }

        const payload = {
            embeds: [{
                title: title,
                description: `**Message:** ${message}\n**Environment:** ${process.env.NODE_ENV}`,
                color: color,
                fields: [
                    {
                        name: "Context",
                        value: `\`\`\`json\n${JSON.stringify(context, null, 2).substring(0, 1000)}\n\`\`\``
                    }
                ]
            }]
        };

        // Fallback for simple content if embeds fail or preferred
        // const payload = {
        //     content: `${title}\n**Message:** ${message}\n**Environment:** ${process.env.NODE_ENV}\n\`\`\`json\n${JSON.stringify(context, null, 2)}\n\`\`\``
        // };

        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (err) {
        console.error("Failed to send alert to Discord", err);
    }
}
