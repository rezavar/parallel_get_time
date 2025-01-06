import { chromium } from 'playwright';
import {convertArabicToPersian, convertEnglishNumbersToPersian, occasionTypes} from "./helpers.js";

(async () => {
    const browser = await chromium.launch();
    // const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    await page.route('**/*', (route, request) => {
        const type = request.resourceType();
        if (type === 'stylesheet' || type === 'script' || type === 'image' || type === 'font') {
            route.abort();
        } else {
            route.continue();
        }
    });

    try {
        await page.goto('https://www.time.ir/fa/event/list/0/1403/10/15', {
            waitUntil: 'domcontentloaded',
        });
    } catch (error) {
        console.error('Error loading page:', error);
    }

    const occasions = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('ul.list-unstyled > li'));

        return elements.map((el) => {
            return el.textContent
                .trim()
                .replace(/[\n\r\t\v\f\b\0]/g, '')
                .replace(/\s+/g, ' ');
        });
    });

    for(const index in occasions) {
        let occasion = occasions[index]
        occasion = convertArabicToPersian(occasion);
        occasion = convertEnglishNumbersToPersian(occasion);
        let type = occasionTypes.Shamsi;
        if (occasion.toLowerCase().match(/\[.*?(january|february|march|april|may|june|july|august|september|october|november|december).*?\]/i)) {
            type = occasionTypes.Miladi;
        }
        else if (occasion.match(/\[.*?(محرم|صفر|رجب|شعبان|رمضان|شوال|ذی‌القعده|ذی‌الحجه).*?\]/i)) {
            type = occasionTypes.Ghamari;
        }
        occasions[index] = {
            occasion, type
        }

    }

    console.log(occasions);

    await browser.close();
})();
