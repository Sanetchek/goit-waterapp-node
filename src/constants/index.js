import * as path from 'node:path';

export const TEMPLATES_DIR = path.join(process.cwd(), 'src', 'templates');

export const TEMP_UPLOAD_DIR = path.resolve('temp');

export const SWAGGER_PATH = path.resolve('docs', 'swagger.json');
