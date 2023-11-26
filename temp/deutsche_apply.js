import puppeteer from 'puppeteer';

async function main(_page, request) {
    const {firstName, lastName, email, phoneNumber, message} = request;
    const currentEmployment = 'Angestellte(r)';
    const incomeType = '1';
    const incomeLevel = 'M_3';
    const delay = 100;
    
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(_page, { waitUntil: 'networkidle2' });
    await page.waitForSelector('#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll');
    await page.click('#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll');
    await page.waitForSelector('#first-name');
    await page.click('#first-name')
    await page.type('#first-name', firstName, {delay});
    await page.waitForSelector('#last-name');
    await page.click('#last-name')
    await page.type('#last-name', lastName, {delay});
    await page.waitForSelector('#email');
    await page.click('#email')
    await page.type('#email', email, {delay});
    await page.waitForSelector('#phone');
    await page.click('#phone')
    await page.type('#phone', phoneNumber, {delay});
    await page.waitForSelector('#currentEmployment');
    await page.select('#currentEmployment', currentEmployment);
    await page.waitForSelector('#incomeType');
    await page.select('#incomeType', incomeType);
    await page.waitForSelector('#incomeLevel');
    await page.select('#incomeLevel', incomeLevel);
    await page.waitForSelector('#message');
    await page.click('#message');
    await page.type('#message', message, {delay: delay/10});
    await page.waitForSelector('#form-requestEstate > div.form__submit-container.form-expose__submit-container > button');
    await page.click('#form-requestEstate > div.form__submit-container.form-expose__submit-container > button');
    const element = await page.waitForSelector('#page-header > div.page-content__hero.module.fade-in-early > div.article-head > div');
    const info = await page.evaluate(name => name.innerText, element);
    console.log(info);
    if(info === 'Thank you for your request.') {
        console.log('---- Deutsche applied success');
    } else {
        console.log('---- Deutsche applied error', _page, email);
    }
    await browser.close();
}
main('https://www.deutsche-wohnen.com/en/expose/object/89-1532510002', {
    message: `Hallo,

Wir sind schon eine Weile auf der Suche nach einem Haus, hatten aber bisher kein Glück. Ich habe eine wirklich harte Zeit, mein Baby in einer kleinen Wohnung zu erhöhen.
    
Wir haben ein wirklich stabiles Einkommen von 4200 pro Monat.

Bitte berücksichtigen Sie meine Familie für den Mietvertrag. Wir werden Ihnen sehr dankbar sein.

Mit freundlichen Grüßen`,
    email: 'hina94here@gmail.com',
    firstName: 'Hina',
    lastName: 'Khan',
    phoneNumber: '017646294899',
    salutation: 'MRS',
    salutation_1: 'ms',
    salutation_2: 'Frau',
    street: 'Gutschmidtstraße',
    houseNumber: '78',
    zipCode: '12359',
    city: 'Berlin',
    additionalAddressInformation: ''
});
