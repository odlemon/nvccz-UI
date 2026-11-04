const {chromium}=require('playwright');
const fs=require('fs');
(async()=>{
 const b=await chromium.launch();
 try {
  const context=await b.newContext({viewport:{width:1440,height:1000}});
  const auth=await context.request.post('https://dev-api.matanho.com/api/auth/login',{data:{email:'admin@nts.com',password:'admin123',portal:'staff'}});
  const login=await auth.json();if(!login.success||!login.token)throw new Error('Development staff login failed');
  await context.addCookies([{name:'token',value:login.token,domain:'dev.matanho.com',path:'/',secure:true,sameSite:'Lax'}, {name:'user',value:encodeURIComponent(JSON.stringify(login.user)),domain:'dev.matanho.com',path:'/',secure:true,sameSite:'Lax'}]);
  const sample=JSON.parse(fs.readFileSync('.acc-dumps/dev-event-sample.json','utf8'));
  const p=await context.newPage();
  await p.goto('https://dev.matanho.com/events/'+sample.eventId,{waitUntil:'domcontentloaded',timeout:60000});
  await p.getByRole('button',{name:'Guests',exact:true}).click({timeout:30000});
  const card=p.locator('[data-slot="collapsible"]').filter({has:p.getByRole('button',{name:'View Details',exact:true})}).first();
  await card.getByText('Email delivered:',{exact:true}).waitFor({timeout:30000});
  if((await card.innerText()).includes('Accepted by mail server'))throw new Error('Old technical email text is still visible');
  await card.getByRole('button',{name:'View Details',exact:true}).click();
  await card.getByRole('heading',{name:'Uploaded video',exact:true}).waitFor({timeout:10000});
  const videos=await card.locator('video').count();
  console.log('Deployed guest details verified; video section visible; simplified email label; uploaded player count:',videos);
  await p.screenshot({path:'.acc-dumps/dev-guest-details-final.png',fullPage:true});
 } finally {await b.close()}
})().catch(e=>{console.error(e.message);process.exit(1)});
