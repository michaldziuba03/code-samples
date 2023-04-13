import { createTransport } from 'nodemailer';

const transport = createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    }
});

const URL = process.env.URL || 'http://localhost:3000';

export async function sendResetEmail(email: string, token: string) {
    const link = `${URL}/reset/${token}`;

    await transport.sendMail({
        subject: 'Reset password - Sample',
        to: email,
        html: `Reset password link: <a href="${link}"> ${link} </a>`,
        text: `Reset password link: ${link}`,
    });
}
