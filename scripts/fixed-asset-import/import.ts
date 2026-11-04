import fs from 'fs';
import path from 'path';
// csv-parser is present in the backend runtime; its package has no bundled typings.
const csv: any = require('csv-parser');
import { randomUUID } from 'crypto';
import { Decimal } from '@prisma/client/runtime/library';
const prisma = require(process.env.BACKEND_DATABASE_MODULE || '../../../nvccz/src/utils/database').default;

type Row = { source_row:string; asset_pool:string; acquisition_date:string; description:string; cost_per_unit_zig:string; quantity:string; total_cost_zig:string; rate:string; total_cost_usd:string; supplier:string; useful_life_months:string };
const manifest = path.resolve(__dirname, 'manifest.csv');
const readRows = (): Promise<Row[]> => new Promise((resolve, reject) => { const rows: Row[]=[]; fs.createReadStream(manifest).pipe(csv()).on('data', r=>rows.push(r)).on('end',()=>resolve(rows)).on('error',reject); });
const sql = (s:string) => ({ query: s });
async function main() {
  const rows=await readRows(); if(rows.length!==33) throw new Error(`Expected 33 rows, got ${rows.length}`);
  for (const statement of fs.readFileSync(path.resolve(__dirname,'migration.sql'),'utf8').split(';').map(s=>s.trim()).filter(Boolean)) await prisma.$executeRawUnsafe(statement);
  const [user, currency, assetAccount, accum, dep] = await Promise.all([
    prisma.user.findFirst({orderBy:{createdAt:'asc'},select:{id:true}}), prisma.currency.findFirst({where:{code:'ZIG',isActive:true},select:{id:true}}),
    prisma.chartOfAccounts.findFirst({where:{accountNo:'1510'},select:{id:true}}), prisma.chartOfAccounts.findFirst({where:{accountNo:'1550'},select:{id:true}}), prisma.chartOfAccounts.findFirst({where:{accountNo:'5130'},select:{id:true}})
  ]);
  if(!user||!currency||!assetAccount||!accum||!dep) throw new Error('Required user, ZIG currency, or accounting accounts are missing');
  const report:any={target:process.env.DATABASE_URL?.replace(/:\/\/[^@]+@/,'://[redacted]@')||'configured DATABASE_URL',processed:rows.length,inserted:0,skipped:0,failed:[],sourceRows:[]};
  for(const r of rows){ const sourceKey=`FIXED-ASSET-SCREENSHOT-2026-10-16-${r.source_row}`, code=`FAR-${r.source_row}`; try { const existing:any[]=await prisma.$queryRawUnsafe(`SELECT asset_id FROM asset_register_imports WHERE source_key=? LIMIT 1`,sourceKey); if(existing.length){report.skipped++;continue;} const id=randomUUID(); await prisma.$transaction(async tx=>{ await tx.$executeRawUnsafe(`INSERT INTO asset_register_imports (id,source_key,asset_id,asset_pool,acquisition_date,description,cost_per_unit_zig,quantity,total_cost_zig,historical_rate,total_cost_usd,supplier,useful_life_months) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,id,sourceKey,id,r.asset_pool,`${r.acquisition_date} 00:00:00`,r.description,r.cost_per_unit_zig,Number(r.quantity),r.total_cost_zig,r.rate,r.total_cost_usd,r.supplier,Number(r.useful_life_months)); await tx.asset.create({data:{assetName:r.description,assetCode:code,description:`Source row ${r.source_row}; pool=${r.asset_pool}; supplier=${r.supplier}; quantity=${r.quantity}; unit ZIG=${r.cost_per_unit_zig}; total ZIG=${r.total_cost_zig}; total USD=${r.total_cost_usd}; rate=${r.rate}; life months=${r.useful_life_months}`,purchaseDate:new Date(`${r.acquisition_date}T00:00:00Z`),cost:new Decimal(r.total_cost_zig),usefulLifeYears:Math.ceil(Number(r.useful_life_months)/12),depreciationMethod:'STRAIGHT_LINE',currentBookValue:new Decimal(r.total_cost_zig),salvageValue:new Decimal(0),assetAccountId:assetAccount.id,accumulatedDepreciationAccountId:accum.id,depreciationExpenseAccountId:dep.id,createdById:user.id,recordedCurrencyId:currency.id,usdZwgRateSnapshot:new Decimal(r.rate)}}); await tx.$executeRawUnsafe(`UPDATE asset_register_imports SET asset_id=? WHERE source_key=?`,id,sourceKey);}); report.inserted++; report.sourceRows.push(r.source_row); } catch(e:any){report.failed.push({source_row:r.source_row,error:e.message});} }
  console.log(JSON.stringify(report,null,2)); if(report.failed.length) process.exitCode=1;
}
main().finally(()=>prisma.$disconnect());
