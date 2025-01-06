import { chromium } from 'playwright';
import { convertArabicToPersian, convertEnglishNumbersToPersian, getYearObject, occasionTypes } from "./helpers.js";
import { writeFileSync } from 'fs';

async function processDayInTab(page, date) {
    const { MDate, PDate } = date;
    const url = "https://www.time.ir/fa/event/list/0/" + date.PDate;

    try {
        await page.route('**/*', (route, request) => {
            const type = request.resourceType();
            if (type === 'stylesheet' || type === 'script' || type === 'image' || type === 'font') {
                route.abort();
            } else {
                route.continue();
            }
        });

        await page.goto(url, { waitUntil: 'domcontentloaded' });

        const occasions = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('ul.list-unstyled > li'));
            return elements.map((el) => el.textContent.trim().replace(/[\n\r\t\v\f\b\0]/g, '').replace(/\s+/g, ' '));
        });

        const processedOccasions = occasions.map((occasion) => {
            let processedOccasion = convertArabicToPersian(occasion);
            processedOccasion = convertEnglishNumbersToPersian(processedOccasion);
            processedOccasion = processedOccasion.replace(/^([^\s]*\s[^\s]*\s)/, "");

            let type = occasionTypes.Shamsi;
            if (processedOccasion.toLowerCase().match(/\[.*?(january|february|march|april|may|june|july|august|september|october|november|december).*?\]/i)) {
                type = occasionTypes.Miladi;
            } else if (processedOccasion.match(/\[.*?(محرم|صفر|رجب|شعبان|رمضان|شوال|ذی‌القعده|ذی‌الحجه).*?\]/i)) {
                type = occasionTypes.Ghamari;
            }

            return { Occasion: processedOccasion, Type: type };
        });

        return { Occasions: processedOccasions, MDate, Id: PDate.replaceAll('/', '') };
    } catch (error) {
        console.error(`Error processing date ${PDate}:`, error);
        return null;
    }
}

async function processMonth(dates) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();

    const pages = await Promise.all(dates.map(() => context.newPage()));
    let lines = '';
    try {
        const results = await Promise.all(
            dates.map((date, index) => processDayInTab(pages[index], date))
        );

        results.forEach((result) => {
            if (result && result.Occasions && result.Occasions.length > 0) {
                const eventsJson = JSON.stringify(result.Occasions);
                lines += `${result.Id},'${result.MDate}','${eventsJson}'\n`;
            }
        });
    } catch (error) {
        console.error('Error during month processing:', error);
    } finally {
        await browser.close();
    }
    return lines;
}


const YEARS = [1405,1406,1407,1408,1409,1410];

(async () => {
    try {
        await Promise.all(
            YEARS.map(async (YEAR) => {
                const dates = getYearObject(YEAR);
                let yearLines = 'Id,MDate,Occasions\n';
                for (const month in dates) {
                    console.log(`Processing year:${YEAR}, month:${month} ...`);
                    yearLines += await processMonth(dates[month]);
                }
                writeFileSync(`occasion_data_${YEAR}.csv`, yearLines);
                console.log(`File saved: occasion_data_${YEAR}.csv`);
            })
        );

        console.log('End scraping');
    } catch (error) {
        console.error('Error during processing:', error);
    }
})();
