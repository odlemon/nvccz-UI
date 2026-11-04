const prisma = require(process.env.BACKEND_DATABASE_MODULE || '../../../nvccz/src/utils/database').default;

async function main() {
  const [source, assets, journals]: any[] = await Promise.all([
    prisma.$queryRawUnsafe('SELECT COUNT(*) count FROM asset_register_imports WHERE source_key LIKE ?', 'FIXED-ASSET-SCREENSHOT-2026-10-16-%'),
    prisma.$queryRawUnsafe('SELECT COUNT(*) count FROM assets WHERE assetCode LIKE ?', 'FAR-%'),
    prisma.$queryRawUnsafe("SELECT COUNT(*) count FROM journal_entries WHERE referenceNumber LIKE 'FAR-%'")
  ]);
  const result={database:'nvccz_prod',sourceRows:Number(source[0]?.count||0),assets:Number(assets[0]?.count||0),assetJournalRows:Number(journals[0]?.count||0)};
  console.log(JSON.stringify(result,null,2));
  if(result.sourceRows!==33||result.assets!==33||result.assetJournalRows!==0) process.exitCode=1;
}
main().finally(()=>prisma.$disconnect());
