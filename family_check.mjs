import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGE_ERR: ' + e.message));

// Test direct family chat APIs
const apiBase = 'https://njsoft-stream.njcreative123.workers.dev';
const famStart = await fetch(apiBase + '/api/family-chat/start', { method: 'POST' }).then(r => r.json()).catch(e => ({ error: String(e) }));
console.log('Family start:', JSON.stringify(famStart).substring(0, 300));

const famGet = await fetch(apiBase + '/api/family-chat').then(r => r.json()).catch(e => ({ error: String(e) }));
console.log('Family get:', JSON.stringify(famGet).substring(0, 300));

// Check AI chat reply
const chat = await fetch(apiBase + '/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Hello' }) }).then(r => r.json()).catch(e => ({ error: String(e) }));
console.log('AI chat:', JSON.stringify(chat).substring(0, 300));
await browser.close();
