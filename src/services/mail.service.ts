import nodemailer from 'nodemailer';
import {config as loadEnv} from 'dotenv';

// get default environment variables from .env file
loadEnv();

class MailService {

    private transporter;

    constructor() {

        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD
            }
        });
    }


    async sendActivationMail(email:string, activationLink:string): Promise<boolean> {
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

const instance = new MailService();

export {instance as MailService};
