const puppeteer = require('puppeteer');
const fs = require('fs');

const minimal_args = [
    '--autoplay-policy=user-gesture-required',
    '--disable-background-networking',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-breakpad',
    '--disable-client-side-phishing-detection',
    '--disable-component-update',
    '--disable-default-apps',
    '--disable-dev-shm-usage',
    '--disable-domain-reliability',
    '--disable-extensions',
    '--disable-features=AudioServiceOutOfProcess',
    '--disable-hang-monitor',
    '--disable-ipc-flooding-protection',
    '--disable-notifications',
    '--disable-offer-store-unmasked-wallet-cards',
    '--disable-popup-blocking',
    '--disable-print-preview',
    '--disable-prompt-on-repost',
    '--disable-renderer-backgrounding',
    '--disable-setuid-sandbox',
    '--disable-speech-api',
    '--disable-sync',
    '--hide-scrollbars',
    '--ignore-gpu-blacklist',
    '--metrics-recording-only',
    '--mute-audio',
    '--no-default-browser-check',
    '--no-first-run',
    '--no-pings',
    '--no-sandbox',
    '--no-zygote',
    '--password-store=basic',
    '--use-gl=swiftshader',
    '--use-mock-keychain',
];

var prices = [];

async function scrapeAmazon(id) {
    const browser = await puppeteer.launch({"headless": true, args: minimal_args});
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        if (req.resourceType() === 'image' || req.resourceType() === 'stylesheet' || req.resourceType() === 'font') {
            req.abort();
        }
        else {
            req.continue();
        }
    });
    try {
        await page.goto('https://www.amazon.co.uk/s?k=LEGO+' + id,{ waitUntil: 'domcontentloaded' });
        let item = await page.evaluate((id) => {
            try {
                let results = Array.from(document.querySelectorAll('.a-section.a-spacing-small.s-padding-left-small.s-padding-right-small'));
                for (let i = 0; i < results.length; i++) {
                    let x = results[i];
                    let price, finalPrice, url, voucher;
                    let description = x.querySelector('.a-size-base-plus.a-color-base.a-text-normal').textContent.toUpperCase().split(' ');
                    let banned = ['LED', 'BLOCKS', 'BLOCK', 'CASE', 'BAGGED', 'UPGRADE', 'ACRYLIC', 'MINIFIGURE', 'LAKA', 'LIGHT', 'STAND']
                    let intersection = description.filter(x => banned.includes(x));
                    if (description.includes(id) && intersection.length == 0) {
                        price = parseFloat(x.querySelector('.a-offscreen').textContent.slice(1));
                        try {
                            voucher = parseFloat(x.querySelector('.s-coupon-clipped.aok-hidden').textContent.split(' ')[0].slice(1));
                        }
                        catch {
                            voucher = 0.00;
                        }
                        finalPrice = '£' + (price - voucher).toFixed(2).toString();
                        url = 'https://www.amazon.co.uk' + x.querySelector('.a-size-base.a-link-normal.a-text-normal').getAttribute('href');
                        return({retailer: 'Amazon', price: finalPrice, url: url,});
                    }
                }
                price = url = "Not available from this retailer";
            }
            catch(err) {
                price = url = "Not available from this retailer";
            }
            return({retailer: 'Amazon', price: price, url: url,});
        }, id);
        prices.push(item);
    }
    catch {
        prices.push({retailer: 'Smyths', price: "Not available from this retailer", url: "Not available from this retailer"})
    }
    await browser.close();
}

async function scrapeJohnLewis(id) {
    const browser = await puppeteer.launch({"headless": true, args: minimal_args});
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36');
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        if (req.resourceType() === 'image' || req.resourceType() === 'stylesheet' || req.resourceType() === 'font') {
            req.abort();
        }
        else {
            req.continue();
        }
    });
    try {
      await page.goto('https://www.johnlewis.com/search?search-term=LEGO%20' + id, { waitUntil: 'domcontentloaded' });
      let item = await page.evaluate((id) => {
        let price, url;
        let description = document.querySelector('[data-test=product-title]').textContent;
        if (description.includes(id)) {
           price = document.querySelector('.price_c-product-card__price__blXuB').textContent.slice(1);
           url = 'https://www.johnlewis.com' + document.querySelector('.product-card_c-product-card__link__QeVVQ').getAttribute('href');
        }
        else {
           price = url = "Not available from this retailer";
        }
        return({retailer: 'John Lewis', price: price, url: url,});
      }, id);
      prices.push(item);
      }
    catch {
      prices.push({retailer: 'John Lewis', price: "Not available from this retailer", url: "Not available from this retailer",})
    }
    await browser.close();
}

async function scrapeArgos(id) {
    const browser = await puppeteer.launch({"headless": true, args: minimal_args});
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36');
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        if (req.resourceType() === 'image' || req.resourceType() === 'stylesheet' || req.resourceType() === 'font') {
            req.abort();
        }
        else {
            req.continue();
        }
    });
    try {
        await page.goto('https://www.argos.co.uk/search/LEGO-' + id + '/?clickOrigin=searchbar:search:term:LEGO+' + id, { waitUntil: 'domcontentloaded' });
        let item = await page.evaluate((id) => {
            let price, url;
            let description = document.querySelector('.ProductCardstyles__Title-h52kot-12.PQnCV').textContent;
            if (description.includes(id)) {
                price = document.querySelector('.ProductCardstyles__PriceText-h52kot-14.glcjUO').textContent.slice(1);
                url = 'https://www.argos.co.uk' + document.querySelector('.ProductCardstyles__Title-h52kot-12.PQnCV').getAttribute('href').replace(/ /g, "%20");
            }
            else {
                price = url = "Not available from this retailer";
            }
            return({retailer: 'Argos', price: price, url: url,});
        }, id);
        prices.push(item);
    }
    catch {
        prices.push({retailer: 'Argos', price: "Not available from this retailer", url: "Not available from this retailer"})
    }
    await browser.close();
}

async function scrapeIWOOT(id) {
    const browser = await puppeteer.launch({"headless": true, args: minimal_args});
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        if (req.resourceType() === 'image' || req.resourceType() === 'stylesheet' || req.resourceType() === 'font') {
            req.abort();
        }
        else {
            req.continue();
        }
    });
    try {
        await page.goto('https://www.iwantoneofthose.com/elysium.search?search=LEGO+' + id, { waitUntil: 'domcontentloaded' });
        let item = await page.evaluate((id) => {
            let price, url;
            try {
                let description = document.querySelector('[data-track=product-title]').textContent;
                if (description.includes(id)) {
                    price = document.querySelector('.productBlock_priceValue').textContent;
                    url = 'https://www.iwantoneofthose.com' + document.querySelector('.productBlock_link').getAttribute('href');
                }
                else {
                    price = url = "Not available from this retailer"; 
                }
            }
            catch(err) {
                price = url = "Not available from this retailer";
            }
            return {retailer: 'IWOOT', price: price, url: url};
        }, id);
        prices.push(item);
    }
    catch {
        prices.push({retailer: 'IWOOT', price: "Not available from this retailer", url: "Not available from this retailer"})
    }
    await browser.close();
}

async function scrapeZavvi(id) {
    const browser = await puppeteer.launch({"headless": true, args: minimal_args});
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        if (req.resourceType() === 'image' || req.resourceType() === 'stylesheet' || req.resourceType() === 'font') {
            req.abort();
        }
        else {
            req.continue();
        }
    });
    try {
        await page.goto('https://www.zavvi.com/elysium.search?search=LEGO+' + id, { waitUntil: 'domcontentloaded' });
        let item = await page.evaluate((id) => {
            let price, url;
            try {
                let description = document.querySelector('[data-track=product-title]').textContent;
                if (description.includes(id)) {
                    console.log("x")
                    price = document.querySelector('.productBlock_priceValue').textContent;
                    url = 'https://www.zavvi.com' + document.querySelector('.productBlock_link').getAttribute('href');
                }
                else {
                    console.log("y")
                    price = url = "Not available from this retailer";
                }
            }
            catch(err) {
                price = url = "Not available from this retailer";
            }
            return {retailer: 'Zavvi', price: price, url: url};
        }, id);
        prices.push(item);
    }
    catch {
        prices.push({retailer: 'Zavvi', price: "Not available from this retailer", url: "Not available from this retailer"})
    }
    await browser.close();
}

async function scrapeHamleys(id) {
    const browser = await puppeteer.launch({"headless": true, args: minimal_args});
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        if (req.resourceType() === 'image' || req.resourceType() === 'stylesheet' || req.resourceType() === 'font') {
            req.abort();
        }
        else {
            req.continue();
        }
    });
    try {
        await page.goto('https://www.hamleys.com/catalogsearch/result/?q=LEGO%20' + id, { waitUntil: 'domcontentloaded' });
        let item = await page.evaluate((id) => {
            let price, url;
            let description = document.querySelector('.product-item-link').textContent;
            if (description.includes(id)) {
                price = document.querySelector('.price').textContent;
                url = document.querySelector('.product-item-link').getAttribute('href');
            }
            else {
                price = url = "Not available from this retailer";
            }
            return {retailer: 'Hamleys', price: price, url: url};
        }, id);
        prices.push(item);
    }
    catch {
        prices.push({retailer: 'Hamleys', price: "Not available from this retailer", url: "Not available from this retailer"})
    }
    await browser.close();
}

async function scrapeLEGO(id) {
    const browser = await puppeteer.launch({"headless": true, args: minimal_args});
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        if (req.resourceType() === 'image' || req.resourceType() === 'stylesheet' || req.resourceType() === 'font') {
            req.abort();
        }
        else {
            req.continue();
        }
    });
    try {
        await page.goto('https://www.lego.com/en-gb/product/' + id, { waitUntil: 'domcontentloaded' });
        let item = await page.evaluate(() => {
            let price;
            try {
            price = document.querySelector('[data-test=product-price-sale]').textContent.slice(10);
            }
            catch(err) {
            price = document.querySelector('[data-test=product-price]').textContent.slice(5);
            }
            return {retailer: 'LEGO', price: price, url: ''};
        });
        item['url'] = page.url();
        prices.push(item);
    }
    catch {
        prices.push({retailer: 'LEGO', price: "Not available from this retailer", url: "Not available from this retailer"})
    }
    await browser.close();
}

async function scrapeSmyths(id) {
    const browser = await puppeteer.launch({"headless": true, args: minimal_args});
    const page = await browser.newPage();
    try {
        await page.goto('https://www.google.com/search?q=LEGO+' + id);
        let item = await page.evaluate((id) => {
            let price, url;
            let results = Array.from(document.querySelectorAll('.jtfYYd'));
            let i = 0;
            for (i = 0; i < results.length; i++) {
                let x = results[i];
                try {
                    url = x.querySelector('div > div > a').getAttribute('href');
                    if (url.includes('smythstoys')) {
                        price = x.querySelector('.fG8Fp.uo4vr').textContent.split(' ');
                        if (price.length == 11) {
                            price = price[7]
                        }
                        else {
                            price = price[0]
                        }
                        return {retailer: 'Smyths', price: price, url: url};
                    }
                }
                catch {}
            }
            price = url = "Not available from this retailer";
            return {retailer: 'Smyths', price: price, url: url};
        }, id);
        prices.push(item);
    }
    catch {
        prices.push({retailer: 'Smyths', price: "Not available from this retailer", url: "Not available from this retailer"})
    }
    await browser.close();
}

async function main(id) {
    await Promise.all([
        scrapeSmyths(id),
        scrapeAmazon(id),
        scrapeJohnLewis(id),
        scrapeArgos(id),
        scrapeIWOOT(id),
        scrapeZavvi(id),
        scrapeHamleys(id),
        scrapeLEGO(id),
    ])
}

async function run() {
    let sets = process.argv[2].split(",")
    let output = []
    for (let i = 0; i < sets.length; i++) {
        await main(sets[i]);
        output.push(prices)
        prices = [];
    }
    let data = JSON.stringify(output);
    fs.writeFileSync('output.json', data);
}

run()
