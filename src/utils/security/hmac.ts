import crypto from 'crypto';

const DEFAULT_TOLERANCE_MS = 5 * 60 * 1000; // 5 minutes

export function createHmacSignature(payload: string, timestamp: string, secret?: string) {
    const key = secret ?? process.env.RESUME_PIPELINE_HMAC_SECRET;

    if (!key) {
        throw new Error('Environment variable RESUME_PIPELINE_HMAC_SECRET is not set.');
    }

    return crypto
        .createHmac('sha256', key)
        .update(`${timestamp}.${payload}`)
        .digest('hex');
}

export function verifyHmacSignature(
    payload: string,
    timestamp: string | null,
    incomingSignature: string | null,
    toleranceMs = DEFAULT_TOLERANCE_MS,
) {
    if (!timestamp || !incomingSignature) {
        return false;
    }

    const now = Date.now();
    const provided = Date.parse(timestamp);

    if (Number.isNaN(provided)) {
        return false;
    }

    if (Math.abs(now - provided) > toleranceMs) {
        return false;
    }

    try {
        const computed = createHmacSignature(payload, timestamp);
        if (computed.length !== incomingSignature.length) {
            return false;
        }
        return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(incomingSignature));
    } catch (error) {
        console.error('Failed to verify HMAC signature:', error);
        return false;
    }
}
