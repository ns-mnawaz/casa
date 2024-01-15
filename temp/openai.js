
import { get } from '../common/message.js';

(async () => {
    const res = await get('Degewo', '2', '500', 'Berlin', 'Nawaz', 'Softwareentwickler');
    console.log(res);
})();
// Hausfrau
// Softwareentwickler
