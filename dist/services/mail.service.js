import nodemailer from 'nodemailer';
export default class MailService {
    static transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: process.env.SMTP_PORT,
        secure: false,
        auth: {
            user: 'freevasya@gmail.com',
            pass: 'gitzqvqdvhgueybu'
        }
    });
    static async sendActivationMail(email, activationLink) {
        try {
            const isEnabled = parseInt(process.env.SMTP_SENDING);
            if (!isEnabled) {
                console.log('SMTP sending disabled. Drop sending activation mail.');
                return false;
            }
            await this.transporter.sendMail({
                from: process.env.SMTP_USER,
                to: email,
                subject: 'Account activation - ' + process.env.PROJECT_NAME,
                test: '',
                html: `<div>Visit a link for account activation:<br /><a href="${activationLink}">${activationLink}</a></div>`
            });
            return true;
        }
        catch (err) {
            console.log(err);
        }
    }
}
//# sourceMappingURL=mail.service.js.map