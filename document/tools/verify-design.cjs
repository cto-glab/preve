// Run with the bundled Node runtime and playwright dependency available.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({headless:true,channel:process.env.DESIGN_BROWSER_CHANNEL||'msedge'});
  const page = await browser.newPage({viewport:{width:1100,height:1000},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror', e=>errors.push(e.message));
  const root = path.resolve(__dirname,'..');
  await page.goto('file:///'+path.join(root,'design-preview.html').replaceAll('\\','/'));
  const frame=page.frameLocator('iframe');
  await frame.locator('#meeting-design .window-pick').first().waitFor();
  const stage=frame.locator('[data-variant="브리프"]');
  const out=path.resolve(root,'../tmp/pdfs');
  fs.mkdirSync(out,{recursive:true});
  for(const mode of ['wide','narrow','short']) {
    await stage.locator(`button[data-window="${mode}"]`).click();
    const car=stage.locator('.car');
    const dims=await car.evaluate(el=>({width:el.clientWidth,scroll:el.scrollWidth}));
    if(dims.scroll>dims.width+2)throw new Error(`Overflow in ${mode}: ${JSON.stringify(dims)}`);
    await car.screenshot({path:path.join(out,`design-${mode}.png`)});
  }
  await stage.locator('button[data-action="navigate"].short-nav').click();
  if(!await stage.locator('.car .message').textContent())throw new Error('Navigation feedback missing');
  await stage.locator('button[data-device="phone"]').click();
  await stage.locator('.phone [data-action="brief"]').click();
  if(!await stage.locator('.phone .message').textContent())throw new Error('Briefing feedback missing');
  await page.setViewportSize({width:360,height:1000});
  await stage.locator('button[data-device="car"]').click();
  await stage.locator('button[data-window="narrow"]').click();
  await stage.locator('.car').screenshot({path:path.join(out,'design-small.png')});
  if(errors.length)throw new Error(errors.join('\n'));
  console.log('PASS: wide/narrow/short, mobile actions, narrow viewport; no page errors');
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
