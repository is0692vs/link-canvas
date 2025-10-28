import { Calculator } from './calculator';
import { Logger } from '../components/logger';

const calc = new Calculator();
const logger = new Logger('main');

logger.log('Application started');

const result1 = calc.add(5, 3);
logger.log(`5 + 3 = ${result1}`);

const result2 = calc.multiply(4, 7);
logger.log(`4 * 7 = ${result2}`);

export function main() {
    return {
        result1,
        result2,
    };
}
