const { INSPECT_MAX_BYTES } = require('buffer');
const puppeteer = require('puppeteer');
const { MongoClient } = require('mongodb');
const uri = "";

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
var sets = [];
var lowest;

async function scrapeRetailers(id) {
    const browser = await puppeteer.launch({"headless": true, args: minimal_args});
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);
    try {
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (req.resourceType() === 'image' || req.resourceType() === 'stylesheet' || req.resourceType() === 'font') {
                req.abort();
            }
            else {
                req.continue();
            }
        });
        await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36');
        await page.goto('https://www.amazon.co.uk/s?k=LEGO+' + id,{ waitUntil: 'domcontentloaded' });
        let item = await page.evaluate((id) => {
            let price, finalPrice, url, voucher;
            try {
                let results = Array.from(document.querySelectorAll('.a-section.a-spacing-small.s-padding-left-small.s-padding-right-small'));
                for (let i = 0; i < results.length; i++) {
                    let x = results[i];
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
        prices.push({retailer: 'Amazon', price: "Not available from this retailer", url: "Not available from this retailer",})
    }
    // JOHN LEWIS

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
    catch{
        prices.push({retailer: 'John Lewis', price: "Not available from this retailer", url: "Not available from this retailer",})
    }

    // ARGOS

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
        prices.push({retailer: 'Argos', price: "Not available from this retailer", url: "Not available from this retailer",})
    }
    // IWOOT
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
        prices.push({retailer: 'IWOOT', price: "Not available from this retailer", url: "Not available from this retailer",})
    }
    // ZAVVI

    try {
        await page.goto('https://www.zavvi.com/elysium.search?search=LEGO+' + id, { waitUntil: 'domcontentloaded' });
        let item = await page.evaluate((id) => {
            let price, url;
            try {
              let description = document.querySelector('[data-track=product-title]').textContent;
              if (description.includes(id)) {
                  price = document.querySelector('.productBlock_priceValue').textContent;
                  url = 'https://www.zavvi.com' + document.querySelector('.productBlock_link').getAttribute('href');
              }
              else {
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
        prices.push({retailer: 'Zavvi', price: "Not available from this retailer", url: "Not available from this retailer",})
    }

    // HAMLEYS
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
        prices.push({retailer: 'Hamleys', price: "Not available from this retailer", url: "Not available from this retailer",})
    }

    // LEGO
    try {
        await page.goto('https://www.lego.com/en-gb/product/' + id, { waitUntil: 'domcontentloaded' });
        try {
            let price;
            let item = await page.evaluate(() => {
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
            price = url = "Not available from this retailer";
            prices.push({retailer: 'LEGO', price: price, url: url});
        }
    }
    catch {
        prices.push({retailer: 'LEGO', price: "Not available from this retailer", url: "Not available from this retailer",})
    }

    // SMYTHS
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
    catch{
        prices.push({retailer: 'Smyths', price: "Not available from this retailer", url: "Not available from this retailer",})
    }
    await browser.close();
}

async function main(id, collection) {
    try {
        await scrapeRetailers(id).then(() => {
            let Smyths = findIndex('Smyths')
            let Amazon = findIndex('Amazon')
            let JohnLewis = findIndex('John Lewis')
            let Argos = findIndex('Argos')
            let IWOOT = findIndex('IWOOT')
            let Zavvi = findIndex('Zavvi')
            let Hamleys = findIndex('Hamleys')
            let LEGO = findIndex('LEGO')
            if (lowest == null) {
                collection.collection("lowest").insertOne({id: id, Smyths: prices[Smyths]['price'], Amazon: prices[Amazon]['price'], JohnLewis: prices[JohnLewis]['price'], Argos: prices[Argos]['price'], IWOOT: prices[IWOOT]['price'], Zavvi: prices[Zavvi]['price'], Hamleys: prices[Hamleys]['price'], LEGO: prices[LEGO]['price']})
                console.log("added")
            }
            else {
                if (prices[Smyths]['price'] != "Not available from this retailer") {
                    if (lowest['Smyths'] == "Not available from this retailer" || parseInt(lowest['Smyths'].slice(1)) > parseInt(prices[Smyths]['price'].slice(1))) {
                        lowest['Smyths'] = prices[Smyths]['price']
                    }
                }

                if (prices[Amazon]['price'] != "Not available from this retailer") {
                    if (lowest['Amazon'] == "Not available from this retailer" || parseInt(lowest['Amazon'].slice(1)) > parseInt(prices[Amazon]['price'].slice(1))) {
                        lowest['Amazon'] = prices[Amazon]['price']
                    }
                }

                if (prices[JohnLewis]['price'] != "Not available from this retailer") {
                    if (lowest['JohnLewis'] == "Not available from this retailer" || parseInt(lowest['JohnLewis'].slice(1)) > parseInt(prices[JohnLewis]['price'].slice(1))) {
                        lowest['JohnLewis'] = prices[JohnLewis]['price']
                    }
                }

                if (prices[Argos]['price'] != "Not available from this retailer") {
                    if (lowest['Argos'] == "Not available from this retailer" || parseInt(lowest['Argos'].slice(1)) > parseInt(prices[Argos]['price'].slice(1))) {
                        lowest['Argos'] = prices[Argos]['price']
                    }
                }

                if (prices[IWOOT]['price'] != "Not available from this retailer") {
                    if (lowest['IWOOT'] == "Not available from this retailer" || parseInt(lowest['IWOOT'].slice(1)) > parseInt(prices[IWOOT]['price'].slice(1))) {
                        lowest['IWOOT'] = prices[IWOOT]['price']
                    }
                }

                if (prices[Zavvi]['price'] != "Not available from this retailer") {
                    if (lowest['Zavvi'] == "Not available from this retailer" || parseInt(lowest['Zavvi'].slice(1)) > parseInt(prices[Zavvi]['price'].slice(1))) {
                        lowest['Zavvi'] = prices[Zavvi]['price']
                    }
                }

                if (prices[Hamleys]['price'] != "Not available from this retailer") {
                    if (lowest['Hamleys'] == "Not available from this retailer" || parseInt(lowest['Hamleys'].slice(1)) > parseInt(prices[Hamleys]['price'].slice(1))) {
                        lowest['Hamleys'] = prices[Hamleys]['price']
                    }
                }

                if (prices[LEGO]['price'] != "Not available from this retailer") {
                    if (lowest['LEGO'] == "Not available from this retailer" || parseInt(lowest['LEGO'].slice(1)) > parseInt(prices[LEGO]['price'].slice(1))) {
                        lowest['LEGO'] = prices[LEGO]['price']
                    }
                }
                collection.collection("lowest").updateOne({id: id}, {$set: {Smyths: lowest['Smyths'], Amazon: lowest['Amazon'], JohnLewis: lowest['JohnLewis'], Argos: lowest['Argos'], IWOOT: lowest['IWOOT'], Zavvi: lowest['Zavvi'], Hamleys: lowest['Hamleys'], LEGO: lowest['LEGO']}})
                console.log("updated")
            }
            var currentdate = new Date();
            var datetime = currentdate.getDate() + "/" + (parseInt(currentdate.getMonth())+1) + "/" + currentdate.getFullYear() + " " + currentdate.getHours() + ":" + currentdate.getMinutes() + ":" + currentdate.getSeconds();
            prices = {id: id, date: datetime, prices: prices};
            collection.collection("pricesC").insertOne(prices);
            console.log(prices)
        });
    }
    catch {}
}

async function scrape() {
    const browser = await puppeteer.launch({"headless": true, "defaultViewport": null});
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);
    await page.goto('https://www.lego.com/en-gb/categories/all-sets', { waitUntil: 'domcontentloaded' });
    let tmp = await page.evaluate(() => {
        let limit = document.querySelectorAll('.Paginationstyles__PageLink-npbsev-7');
        limit = limit[limit.length-1].textContent;
        let results = Array.from(document.querySelectorAll('.dwJQhm'));
        let info = [];
        for (let i = 0; i < results.length; i++) {
            if (results[i].href.split('-').pop().length == 5) {
                info.push(results[i].href.split('-').pop());
            }
        }
        return [limit, info]
    });
    //console.log(tmp)
    let limit = parseInt(tmp[0]);
    console.log('1' + "/" + limit.toString() + " " + (1*100/limit).toString() + '%');
    sets = sets.concat(tmp[1]);
    console.log(sets)


    for (let i = 2; i <= limit; i++) {
        try {
            await page.goto('https://www.lego.com/en-gb/categories/all-sets?page='+i.toString(), { waitUntil: 'domcontentloaded' });
            let tmp = await page.evaluate(() => {
                let results = Array.from(document.querySelectorAll('.dwJQhm'));
                let info = [];
                for (let i = 0; i < results.length; i++) {
                    if (results[i].href.split('-').pop().length == 5) {
                        info.push(results[i].href.split('-').pop());
                    }
                }
                return info;
            });
            //console.log(tmp)
            sets = sets.concat(tmp);
        }
        catch {}
        console.log((i).toString() + "/" + limit.toString() + " " + (i*100/limit).toString() + '%');
    }
    await browser.close();
}


async function run() {
    console.log('connecting');
    const client = await new MongoClient(uri).connect();
    console.log('connected');
    const collection = client.db("pricesDB");
    while (true) {
        await scrape();
        for (let i = 0; i < sets.length; i++) {
            console.log(sets[i]);
            lowest = await collection.collection("lowest").findOne({id: sets[i]});
            await main(sets[i], collection);
            let min = Math.ceil(5000);
            let max = Math.floor(10000);
            await sleepNow(Math.floor(Math.random() * (max - min)) + min);
            prices = [];
            await sleepNow(1000);
        }
        sets = []
    }
}

const sleepNow = (delay) => new Promise((resolve) => setTimeout(resolve, delay))

function findIndex(retailer) {
    for (let i = 0; i < prices.length; i++) {
        if (prices[i]['retailer'] == retailer) {
            return i;
        }
    }
}

run()
