export async function getMpesaAccessToken() {
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const mpesaEnv = process.env.MPESA_ENV || 'sandbox';

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    const baseUrl = mpesaEnv === 'production'
        ? "https://api.safaricom.co.ke"
        : "https://sandbox.safaricom.co.ke";

    const url = `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`;

    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Basic ${auth}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.errorMessage || "Failed to get M-Pesa access token");
        }

        const data = await response.json();
        return data.access_token;
    } catch (error) {
        console.error("M-Pesa Access Token Error:", error);
        throw error;
    }
}

export function generateMpesaTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hour}${minute}${second}`;
}

export function generateMpesaPassword(shortCode: string, passKey: string, timestamp: string) {
    return Buffer.from(`${shortCode}${passKey}${timestamp}`).toString('base64');
}
