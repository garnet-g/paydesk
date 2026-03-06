import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailProps {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
}

export async function sendEmail({ to, subject, html, from }: SendEmailProps) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY is not set. Email not sent.');
        return { error: 'RESEND_API_KEY not set' };
    }

    try {
        const data = await resend.emails.send({
            from: from || 'PayDesk <noreply@paydesk.live>',
            to,
            subject,
            html,
        });

        return { data };
    } catch (error) {
        console.error('Failed to send email:', error);
        return { error };
    }
}
