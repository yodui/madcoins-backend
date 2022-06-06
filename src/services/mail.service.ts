import nodemailer from 'nodemailer';

export default class MailService {




    private static transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: process.env.SMTP_PORT,
        secure: false,
        auth: {
            user: 'freevasya@gmail.com',//process.env.SMTP_USER,
            pass: 'gitzqvqdvhgueybu'//process.env.SMTP_PASSWORD
        }
    });


    static async sendActivationMail(email:string, activationLink:string): Promise<boolean> {
        try {

            const isEnabled = parseInt(process.env.SMTP_SENDING);
            if(!isEnabled) {
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

        } catch (err) {
            console.log(err);
        }

    }

}
