import nodemailer from 'nodemailer';
import {WELCOME_EMAIL_TEMPLATE, NEWS_SUMMARY_EMAIL_TEMPLATE, STOCK_ALERT_UPPER_EMAIL_TEMPLATE, STOCK_ALERT_LOWER_EMAIL_TEMPLATE} from "@/lib/nodemailer/templates";

export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.NODEMAILER_EMAIL!,
        pass: process.env.NODEMAILER_PASSWORD!,
    }
})

export const sendWelcomeEmail = async ({ email, name, intro }: { email: string; name: string; intro: string }) => {
    const htmlTemplate = WELCOME_EMAIL_TEMPLATE
        .replace('{{name}}', name)
        .replace('{{intro}}', intro);

    const mailOptions = {
        from: `"Signalist" <signalist@jsmastery.pro>`,
        to: email,
        subject: `Welcome to Signalist - your stock market toolkit is ready!`,
        text: 'Thanks for joining Signalist',
        html: htmlTemplate,
    }

    await transporter.sendMail(mailOptions);
}

export const sendNewsSummaryEmail = async (
    { email, date, newsContent }: { email: string; date: string; newsContent: string }
): Promise<void> => {
    const htmlTemplate = NEWS_SUMMARY_EMAIL_TEMPLATE
        .replace('{{date}}', date)
        .replace('{{newsContent}}', newsContent);

    const mailOptions = {
        from: `"Signalist News" <signalist@jsmastery.pro>`,
        to: email,
        subject: `📈 Market News Summary Today - ${date}`,
        text: `Today's market news summary from Signalist`,
        html: htmlTemplate,
    };

    await transporter.sendMail(mailOptions);
};

export const sendStockAlertEmail = async (params: {
    email: string;
    condition: 'above' | 'below' | 'equal';
    symbol: string;
    company: string;
    targetPrice: number;
    currentPrice: number;
    timestamp: string;
}): Promise<void> => {
    const { email, condition, symbol, company, targetPrice, currentPrice, timestamp } = params;
    const isAbove = condition === 'above' || condition === 'equal';
    const template = isAbove ? STOCK_ALERT_UPPER_EMAIL_TEMPLATE : STOCK_ALERT_LOWER_EMAIL_TEMPLATE;
    const htmlTemplate = template
        .replace(/\{\{symbol}}/g, `${symbol}`)
        .replace(/\{\{company}}/g, `${company}`)
        .replace(/\{\{targetPrice}}/g, `$${targetPrice.toFixed(2)}`)
        .replace(/\{\{currentPrice}}/g, `$${currentPrice.toFixed(2)}`)
        .replace(/\{\{timestamp}}/g, timestamp);

    const subject = isAbove
        ? `🔔 ${symbol} price reached target ($${targetPrice.toFixed(2)})`
        : `🔔 ${symbol} price dropped to target ($${targetPrice.toFixed(2)})`;

    const mailOptions = {
        from: `"Signalist Alerts" <alerts@signalist.app>`,
        to: email,
        subject,
        text: `${symbol} ${isAbove ? 'at or above' : 'at or below'} ${targetPrice.toFixed(2)}. Current: ${currentPrice.toFixed(2)}`,
        html: htmlTemplate,
    };

    await transporter.sendMail(mailOptions);
}
