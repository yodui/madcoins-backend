import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({path: './.env'});

// Application parameters
interface IAppInstanceParams {
    db: IDBConfig,
    ws: IWSConfig
}

// Database connection configuration
interface IDBConfig {
    host: string,
    port: number,
    user?: string,
    password?: string,
    database?: string
}

interface IWSConfig {
    port: number
}

const env: IAppInstanceParams = {
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER || undefined,
        password: process.env.DB_PASS || undefined,
        database: process.env.DB_NAME || undefined
    },
    ws: {
        port: parseInt(process.env.WS_PORT) || 3037
    }
}

export { env };
