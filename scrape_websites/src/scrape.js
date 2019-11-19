const puppeteer = require('puppeteer')

const blockedResourceTypes = [
  'image',
  'media',
  'font',
  'texttrack',
  'object',
  'beacon',
  'csp_report',
  'imageset',
  'stylesheet',
  'script',
];

const skippedResources = [
  'quantserve',
  'adzerk',
  'doubleclick',
  'adition',
  'exelator',
  'sharethrough',
  'cdn.api.twitter',
  'google-analytics',
  'googletagmanager',
  'google',
  'fontawesome',
  'facebook',
  'analytics',
  'optimizely',
  'clicktale',
  'mixpanel',
  'zedo',
  'clicksor',
  'tiqcdn',
];

const browserPromise = puppeteer.launch({
  ignoreHTTPSErrors: true,
  args: [
  // '--proxy-server=' + proxy,
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-accelerated-2d-canvas',
  '--disable-gpu',
  '--window-size=1920x1080',
  ],
});

const scrape = async (url, parsePage) => {
  const browser = await browserPromise
  const page = await browser.newPage();

  let payload
  try {
    await page.setRequestInterception(true);
    // await page.setUserAgent(userAgent);
    page.on('request', request => {
      const requestUrl = request._url.split('?')[0].split('#')[0];
      if (
        blockedResourceTypes.indexOf(request.resourceType()) !== -1 ||
        skippedResources.some(resource => requestUrl.indexOf(resource) !== -1)
      ) {
        request.abort();
      } else {
        request.continue();
      }
    });
    const response = await page.goto(url, {
      timeout: 10000,
      waitUntil: 'networkidle2',
    });
    if (response._status < 400) {
      payload = await parsePage(page)
    }
  } catch(e) {
    // console.log('Failed to scrape')
    // console.log(e)
  }

  page.close()
  return payload
}

module.exports = scrape
