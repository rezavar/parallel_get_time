import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // جلوگیری از بارگذاری منابع غیرضروری
    await page.route('**/*', (route, request) => {
        const type = request.resourceType();
        // مسدود کردن منابع CSS، JS، تصاویر و فونت‌ها
        if (type === 'stylesheet' || type === 'script' || type === 'image' || type === 'font') {
            route.abort();  // مسدود کردن
        } else {
            route.continue();  // ادامه بارگذاری سایر منابع
        }
    });

    try {
        // صفحه را باز می‌کنیم
        await page.goto('https://www.time.ir/fa/event/list/0/1403/10/29', {
            waitUntil: 'domcontentloaded',
        });
    } catch (error) {
        console.error('Error loading page:', error);
    }

    // دریافت محتوای HTML صفحه
    const content = await page.content();
    console.log(content);

    await browser.close();
})();
