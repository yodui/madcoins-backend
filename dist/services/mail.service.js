import nodemailer from 'nodemailer';
export default class MailService {
    static transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: process.env.SMTP_PORT,
        secure: false,
        auth: {
            user: 'freevasya@gmail.com',
            pass: '32614170337'
        }
    });
    static async sendActivationMail(email, activationLink) {
        console.log(process.env.SMTP_HOST, ' ', process.env.SMTP_PORT, ' ', process.env.SMTP_USER, ' ', process.env.SMTP_PASSWORD);
        console.log(this.transporter.sendMail);
        console.log('email: ', email);
        try {
            await this.transporter.sendMail({
                from: process.env.SMTP_USER,
                to: email,
                subject: 'Account activation - ' + process.env.PROJECT_NAME,
                test: '',
                html: `<div>Visit a link for account activation:<br /><a href="${activationLink}">${activationLink}</a></div>`
            });
        }
        catch (err) {
            console.log(err);
        }
    }
}
//# sourceMappingURL=mail.service.js.map