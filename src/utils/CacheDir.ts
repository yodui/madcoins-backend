import fs from 'fs';
import { mkdir } from 'node:fs/promises';
import path from 'path';

async function getCacheDir(): Promise<string> {

    return new Promise(async (resolve, reject) => {

        const __dirname = path.resolve();
        const cacheFolder = path.join(__dirname, 'node_modules', '.cache');

        fs.stat(cacheFolder, async (err, stat) => {
            if (err) {
                if(err.code === 'ENOENT') {
                    const createDir = await mkdir(cacheFolder, {recursive: true});
                    console.log(`Cache directory was created ${createDir}`);
                } else {
                    reject(cacheFolder);
                }
            }
            resolve(cacheFolder);
        });
    });

}

export default getCacheDir;
