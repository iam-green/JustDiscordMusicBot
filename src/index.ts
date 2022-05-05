import dotenv from 'dotenv';
import loader from './loaders';
async function bootstrap() {
    dotenv.config();
    await loader();
};

try {
    bootstrap();
} catch(e) {
    console.error(e);
}