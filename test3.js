import { chromium } from 'playwright';
import {convertArabicToPersian, convertEnglishNumbersToPersian, getYearObject, occasionTypes} from "./helpers.js";
import {writeFileSync} from 'fs';

// تابع برای پردازش هر صفحه
async function processPage(date) {
    const {MDate,PDate}=date
    const url = "https://www.time.ir/fa/event/list/0/"+date.PDate
    const browser = await chromium.launch();
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
        await page.goto(url, {
            waitUntil: 'domcontentloaded',
        });
    } catch (error) {
        console.error('Error loading page:', error);
        await browser.close();
        return [];
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

    const processedOccasions = occasions.map((occasion) => {
        let processedOccasion = convertArabicToPersian(occasion);
        processedOccasion = convertEnglishNumbersToPersian(processedOccasion);
        processedOccasion = processedOccasion.replace(/^([^\s]*\s[^\s]*\s)/, "")
        let type = occasionTypes.Shamsi;
        if (processedOccasion.toLowerCase().match(/\[.*?(january|february|march|april|may|june|july|august|september|october|november|december).*?\]/i)) {
            type = occasionTypes.Miladi;
        } else if (processedOccasion.match(/\[.*?(محرم|صفر|رجب|شعبان|رمضان|شوال|ذی‌القعده|ذی‌الحجه).*?\]/i)) {
            type = occasionTypes.Ghamari;
        }

        return { Occasion: processedOccasion, Type:type };
    });

    await browser.close();
    return { Occasions: processedOccasions, MDate, Id:PDate.replaceAll('/','')};
}

const YEAR = 1403;
const dates = getYearObject(YEAR);

(async () => {
    let results=[];
    try {
        results[1] = await Promise.all(dates['01'].map(date => processPage(date)));
        results[2] = await Promise.all(dates['02'].map(date => processPage(date)));
        results[3] = await Promise.all(dates['03'].map(date => processPage(date)));
        results[4] = await Promise.all(dates['04'].map(date => processPage(date)));
        results[5] = await Promise.all(dates['05'].map(date => processPage(date)));
        results[6] = await Promise.all(dates['06'].map(date => processPage(date)));
        results[7] = await Promise.all(dates['07'].map(date => processPage(date)));
        results[8] = await Promise.all(dates['08'].map(date => processPage(date)));
        results[9] = await Promise.all(dates['09'].map(date => processPage(date)));
        results[10] = await Promise.all(dates['10'].map(date => processPage(date)));
        results[11] = await Promise.all(dates['11'].map(date => processPage(date)));
        results[12] = await Promise.all(dates['12'].map(date => processPage(date)));


        results = results.flat();

        const csvName = `occasion_data_${YEAR}.csv`;
        let csvContent = 'Id,MDate,Occasions\n';
        results.forEach((value,index,array)=>{
            const eventsJson = JSON.stringify(value.Occasions);
            csvContent += `${value.Id},'${value.MDate}','${eventsJson}'\n`;
            array[index]=null; // free space
        })
        results.length = 0; // total free array
        writeFileSync(csvName, csvContent);

        console.log('end scraping');
    } catch (error) {
        console.error('Error during processing:', error);
    }
})();
