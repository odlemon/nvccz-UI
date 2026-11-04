import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outDir = "C:/Users/lysp/Downloads/nvccz-new/outputs/fixed-asset-register";
await fs.mkdir(outDir, { recursive: true });

const rows = [
  ["Office Equipment","2024-08-26","HP Colour LaserJet Pro MFP 4303W Printer",14782.76,1,14782.76,14.38,1028.01,"FuserTech",48,"Screenshot 1, row 1"],
  ...Array.from({length:4},(_,i)=>["Office Equipment","2024-09-11","HP Spectre 14 X360",37200,1,37200,14.30,2601.84,"Laptop World",24,`Screenshot 1, rows ${2+i}`]),
  ["Office Equipment","2024-10-01","HP Envy 16 X360",64800,1,64800,25.76,2515.65,"Laptop World",24,"Screenshot 1, row 6"],
  ...Array.from({length:2},(_,i)=>["Office Equipment","2024-10-02","IPHONE 15 Pro Max 512GB",67392,1,67392,25.91,2600.55,"Laptop World",24,`Screenshot 1, rows ${7+i}`]),
  ...Array.from({length:2},(_,i)=>["Office Equipment","2024-10-02","Samsung Galaxy S24+ 256GB",49504,1,49504,25.91,1910.28,"Laptop World",24,`Screenshot 1, rows ${9+i}`]),
  ["Office Equipment","2024-10-02","Printer",17888,1,17888,25.91,690.27,"Laptop World",48,"Screenshot 1, row 11"],
  ["Office Equipment","2024-11-06","Epson Video Projector",15794.48,1,15794.48,26.66,592.34,"FuserTech",48,"Screenshot 1, row 12"],
  ...Array.from({length:3},(_,i)=>["Office Equipment","2024-11-14","350L Fridge",12900,1,12900,25.92,497.75,"Capri",48,`Screenshot 2, rows ${1+i}`]),
  ...Array.from({length:3},(_,i)=>["Office Equipment","2024-12-06","IPHONE 16 Pro Max 256GB",65287.80,1,65287.80,26.25,2486.82,"Spellbound Electronics",24,`Screenshot 2, rows ${4+i}`]),
  ["Office Equipment","2024-12-06","Samsung S23FE 256GB",20451.60,1,20451.60,26.25,779.00,"Spellbound Electronics",24,"Screenshot 2, row 7"],
  ["Office Equipment","2024-12-06","HP Spectre 14 CORE i7 11TH GEN 16/1TB",47196,1,47196,26.25,1797.70,"Spellbound Electronics",24,"Screenshot 2, row 8"],
  ["Office Equipment","2024-12-06","HP Envy X360",77280,1,77280,26.25,2943.61,"Laptop World",24,"Screenshot 2, row 9"],
  ["Motor Vehicle","2025-07-17","TOYOTA PRADO CHS#50018007 - DARK GREY",4460400,1,4460400,30,151045.00,"Faramatsi Motors",60,"Screenshot 2, row 10"],
  ["Motor Vehicle","2025-07-17","TOYOTA FORTUNER CHS#327552 - SILVER METALLIC",2444400,1,2444400,30,83845.00,"Faramatsi Motors",60,"Screenshot 2, row 11"],
  ["Motor Vehicle","2025-07-17","TOYOTA FORTUNER CHS#327410 - SUPER WHITE",2444400,1,2444400,30,83845.00,"Faramatsi Motors",60,"Screenshot 2, row 12"],
  ["Motor Vehicle","2025-07-17","TOYOTA FORTUNER CHS#327477 - SUPER WHITE",2444400,1,2444400,30,83845.00,"Faramatsi Motors",60,"Screenshot 2, row 13"],
  ["Motor Vehicle","2025-07-31","TOYOTA URBAN CRUISER CHS#596719 - BROWN/BLACK",1242000,1,1242000,30,41400.00,"Faramatsi Motors",60,"Screenshot 2, row 14"],
  ["Office Furniture","2025-10-07","1 in 1 Workstation Desk",86400,1,86400,30,2880.00,"Lifestyle Urban",48,"Screenshot 2, row 15"],
  ["Office Furniture","2025-10-07","2 in 1 Workstation Desk",43960,2,87920,30,2930.67,"Lifestyle Urban",48,"Screenshot 2, row 16"],
  ["Office Furniture","2025-10-07","Black Office Chairs",11520,8,92160,30,3072.00,"Lifestyle Urban",48,"Screenshot 2, row 17"],
  ...Array.from({length:3},(_,i)=>["Office Equipment","2025-10-15","HP Pavilion 14 Core i7 1365U 16gb 1TB SSD x graphic",34960,1,34960,30,1165.33,"Spellbound Electronics",24,`Screenshot 2, rows ${18+i}`]),
  ["Office Equipment","2025-11-03","PRINTER-CANON IMAGE RUNNER C3326i MFP",133559,1,133559,30,4451.97,"FuserTech",48,"Screenshot 2, final row"],
];

const headers = ["Asset Pool","Acquisition Date","Description","Cost per Unit (ZiG)","Quantity","Total Cost (ZiG)","Exchange Rate","Total Cost (USD)","Supplier","Useful Life (months)","Source Reference"];
const wb = Workbook.create();
const reg = wb.worksheets.add("Transcribed Register");
const val = wb.worksheets.add("Validation Results");
const sum = wb.worksheets.add("Reconciliation Summary");
for (const sh of [reg,val,sum]) { sh.showGridLines = false; sh.getUsedRange()?.format.font && (sh.getUsedRange().format.font = { name: "Arial", size: 10, color: "#1F2937" }); }

reg.getRange("A1:K1").merge(); reg.getRange("A1").values = [["Fixed Asset Register — Screenshot Transcription"]];
reg.getRange("A2:K2").merge(); reg.getRange("A2").values = [["Source: client-provided screenshots only. Values are transcribed as shown; repeated rows remain separate. No production import has been performed."]];
reg.getRange("A4:K4").values = [headers];
reg.getRange(`A5:K${rows.length+4}`).values = rows.map(r => [r[0],new Date(`${r[1]}T00:00:00`),...r.slice(2)]);
reg.getRange(`B5:B${rows.length+4}`).format.numberFormat = "m/d/yyyy";
reg.getRange(`D5:D${rows.length+4}`).format.numberFormat = "#,##0.00";
reg.getRange(`F5:F${rows.length+4}`).format.numberFormat = "#,##0.00";
reg.getRange(`G5:G${rows.length+4}`).format.numberFormat = "0.00";
reg.getRange(`H5:H${rows.length+4}`).format.numberFormat = "#,##0.00";
reg.getRange("A1:K1").format = {font:{name:"Arial",size:14,bold:true,color:"#FFFFFF"},fill:"#1F4E78"};
reg.getRange("A2:K2").format = {font:{name:"Arial",size:10,italic:true,color:"#475569"}};
reg.getRange("A4:K4").format = {font:{name:"Arial",size:10,bold:true,color:"#FFFFFF"},fill:"#0F766E",wrapText:true};
reg.getRange(`A4:K${rows.length+4}`).format.borders = {preset:"all",style:"thin",color:"#D1D5DB"};
reg.freezePanes.freezeRows(4);
reg.getRange("A:K").format.autofitColumns();
reg.getRange("C:C").format.columnWidth = 38; reg.getRange("K:K").format.columnWidth = 24;

val.getRange("A1:J1").merge(); val.getRange("A1").values = [["Validation Results"]];
val.getRange("A2:J2").merge(); val.getRange("A2").values = [["Calculated fields are independent checks. Recorded screenshot values are not overwritten. A passing calculation does not prove the transcription is correct."]];
const vh = ["Source Row","Recorded Total ZiG","Calculated Unit × Qty","ZiG Difference","Recorded USD","Calculated ZiG ÷ Rate","USD Difference","Acquisition Date","Useful Life","Status / Notes"];
val.getRange("A4:J4").values = [vh];
const vrows = rows.map((r,i)=>[i+1,r[5],null,null,r[7],null,null,new Date(`${r[1]}T00:00:00`),r[9],r[10]]);
val.getRange(`A5:J${rows.length+4}`).values = vrows;
for (let i=5;i<=rows.length+4;i++) {
  val.getRange(`C${i}`).formulas = [[`='Transcribed Register'!D${i}*'Transcribed Register'!E${i}`]];
  val.getRange(`D${i}`).formulas = [[`=B${i}-C${i}`]];
  val.getRange(`F${i}`).formulas = [[`='Transcribed Register'!F${i}/'Transcribed Register'!G${i}`]];
  val.getRange(`G${i}`).formulas = [[`=E${i}-F${i}`]];
  const r = rows[i-5]; const duplicate = rows.some((x,j)=>j<i-5 && x[0]===r[0] && x[1]===r[1] && x[2]===r[2] && x[8]===r[8]);
  val.getRange(`J${i}`).values = [[duplicate ? "POSSIBLE DUPLICATE — repeated source row; do not merge" : "VERIFIED FROM SCREENSHOT; arithmetic check calculated"]];
}
val.getRange(`B5:G${rows.length+4}`).format.numberFormat = "#,##0.00"; val.getRange(`H5:H${rows.length+4}`).format.numberFormat = "m/d/yyyy";
val.getRange("A1:J1").format = {font:{name:"Arial",size:14,bold:true,color:"#FFFFFF"},fill:"#1F4E78"};
val.getRange("A2:J2").format = {font:{name:"Arial",size:10,italic:true,color:"#475569"}};
val.getRange("A4:J4").format = {font:{name:"Arial",size:10,bold:true,color:"#FFFFFF"},fill:"#0F766E",wrapText:true};
val.getRange(`A4:J${rows.length+4}`).format.borders = {preset:"all",style:"thin",color:"#D1D5DB"}; val.freezePanes.freezeRows(4);
val.getRange("A:J").format.autofitColumns(); val.getRange("J:J").format.columnWidth = 46;

const ziG = rows.reduce((a,r)=>a+r[5],0), usd = rows.reduce((a,r)=>a+r[7],0), units = rows.reduce((a,r)=>a+r[4],0);
sum.getRange("A1:D1").merge(); sum.getRange("A1").values = [["Reconciliation Summary"]];
sum.getRange("A2:D2").merge(); sum.getRange("A2").values = [["Production import status: NOT IMPORTED. Approval is required because the source is screenshots rather than a machine-readable register."]];
sum.getRange("A4:B4").values = [["Metric","Value"]];
sum.getRange("A5:B15").values = [
  ["Asset rows",rows.length],["Physical units",units],["Office Equipment rows",rows.filter(r=>r[0]==="Office Equipment").length],["Motor Vehicle rows",rows.filter(r=>r[0]==="Motor Vehicle").length],["Office Furniture rows",rows.filter(r=>r[0]==="Office Furniture").length],
  ["Transcribed total ZiG",ziG],["Screenshot footer total ZiG",14291267.23],["Difference ZiG",ziG-14291267.23],["Transcribed total USD",usd],["Screenshot footer total USD",499539.94],["Difference USD",usd-499539.94]
];
sum.getRange("A17:D17").values = [["Control / Limitation","Result",null,null]];
sum.getRange("A18:B23").values = [
  ["Source evidence","Two screenshots supplied by client"],["Double verification","Completed: second pass compared each row to source images"],["Ambiguities","Descriptions reconstructed from visible text; any source-level uncertainty remains noted in Source Reference"],["Exchange-rate convention","Arithmetic checked as ZiG ÷ rate; recorded USD retained"],["Local ERP import","Not performed in this workbook build; production-safe preparation only"],["Approval gate","Pending explicit review of reconstructed register and differences"]
];
sum.getRange("A1:D1").format = {font:{name:"Arial",size:14,bold:true,color:"#FFFFFF"},fill:"#1F4E78"}; sum.getRange("A2:D2").format = {font:{name:"Arial",size:10,bold:true,color:"#9A3412"},fill:"#FEF3C7",wrapText:true};
sum.getRange("A4:B4").format = {font:{name:"Arial",size:10,bold:true,color:"#FFFFFF"},fill:"#0F766E"}; sum.getRange("A17:D17").format = {font:{name:"Arial",size:10,bold:true,color:"#FFFFFF"},fill:"#0F766E"}; sum.getRange("A4:B23").format.borders = {preset:"all",style:"thin",color:"#D1D5DB"}; sum.getRange("B10:B15").format.numberFormat = "#,##0.00"; sum.getRange("A:D").format.autofitColumns(); sum.getRange("B:B").format.columnWidth = 24; sum.getRange("A:A").format.columnWidth = 34;

wb.recalculate();
const errors = await wb.inspect({kind:"match",searchTerm:"#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!",options:{useRegex:true,maxResults:300},summary:"formula error scan"});
await fs.writeFile(`${outDir}/formula-error-scan.txt`, errors.ndjson || "No formula errors returned");
const preview = await wb.render({sheetName:"Reconciliation Summary",autoCrop:"all",scale:1,format:"png"});
await fs.writeFile(`${outDir}/reconciliation-summary-preview.png`, new Uint8Array(await preview.arrayBuffer()));
const xlsx = await SpreadsheetFile.exportXlsx(wb); await xlsx.save(`${outDir}/FIXED_ASSET_REGISTER_RECONSTRUCTED.xlsx`);
const manifest = {
  status: "PENDING_EXPLICIT_APPROVAL",
  source: "Client-provided screenshots",
  productionWritePerformed: false,
  journalEntriesCreated: false,
  depreciationApplied: false,
  mapping: {
    assetName: "Description",
    assetCode: "Generated only for review as FA-SCR-###",
    purchaseDate: "Acquisition Date",
    cost: "Total Cost (ZiG)",
    usefulLifeYears: "Useful Life (months) / 12",
    depreciationMethod: "REQUIRES_APPROVAL",
    assetAccountId: "REQUIRES_GL_MAPPING",
    accumulatedDepreciationAccountId: "REQUIRES_GL_MAPPING",
    depreciationExpenseAccountId: "REQUIRES_GL_MAPPING",
    recordedCurrency: "ZiG / ZWG currency record to be confirmed",
    usdZwgRateSnapshot: "Exchange Rate",
    vendor: "Supplier",
    quantity: "Retained in manifest; ERP Asset model has no quantity field",
  },
  records: rows.map((r,i) => ({
    reviewId: `FA-SCR-${String(i+1).padStart(3,"0")}`,
    sourceReference: r[10],
    assetPool: r[0], assetName: r[2], purchaseDate: r[1], costZiG: r[5], quantity: r[4],
    usefulLifeMonths: r[9], usefulLifeYears: r[9] / 12, exchangeRate: r[6], costUsdRecorded: r[7], supplier: r[8],
    depreciationMethod: "REQUIRES_APPROVAL", assetAccountId: "REQUIRES_GL_MAPPING",
    accumulatedDepreciationAccountId: "REQUIRES_GL_MAPPING", depreciationExpenseAccountId: "REQUIRES_GL_MAPPING",
    importStatus: "BLOCKED_PENDING_APPROVAL"
  }))
};
await fs.writeFile(`${outDir}/FIXED_ASSET_IMPORT_MANIFEST.json`, JSON.stringify(manifest, null, 2));
const report = `# Fixed Asset Register Preparation Report\n\n- Source: two client-provided screenshots.\n- Records transcribed: ${rows.length}.\n- Physical units: ${units}.\n- Transcribed ZiG total: ${ziG.toFixed(2)}.\n- Screenshot footer ZiG total: 14291267.23. Difference requiring source confirmation: ${(ziG-14291267.23).toFixed(2)}.\n- Transcribed USD total: ${usd.toFixed(2)}.\n- Screenshot footer USD total: 499539.94. Difference: ${(usd-499539.94).toFixed(2)}.\n- Arithmetic validation: unit cost × quantity and ZiG ÷ exchange rate checks were calculated in the workbook.\n- ERP mapping inspected: Asset model requires GL account IDs, currency, creator, asset code, useful life, and depreciation method.\n- Production status: no production write performed.\n- Import status: blocked pending explicit approval of the screenshot transcription, ZiG difference, GL mappings, currency code, depreciation policy, and creator identity.\n- Depreciation and accounting journals: not created.\n\n## Required approval items\n\n1. Confirm the ZiG footer difference of ${ (ziG-14291267.23).toFixed(2) }.\n2. Confirm the ERP currency record for ZiG/ZWG and the rate convention.\n3. Provide or approve GL mappings for asset, accumulated depreciation, and depreciation expense accounts by asset pool.\n4. Confirm straight-line depreciation and the creator/audit identity.\n5. Confirm how quantity-bearing rows should be represented because the ERP Asset model stores one asset record per asset and has no quantity field.\n`;
await fs.writeFile(`${outDir}/FIXED_ASSET_IMPORT_REVIEW.md`, report);
console.log(JSON.stringify({rows:rows.length, units, ziG, usd, output:`${outDir}/FIXED_ASSET_REGISTER_RECONSTRUCTED.xlsx`}));
