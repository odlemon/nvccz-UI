const BASE = process.env.API_BASE || "http://31.220.82.129:3009/api"
const FPA = BASE + "/v1/fpa"
const DRAFT = "cmriumdwu250b3836adf652d4"
const PUB = "cmriumdfwef94e1434fe0d35b"

async function login() {
  const j = await (
    await fetch(BASE + "/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@nts.com", password: "admin123" }),
    })
  ).json()
  const token = j?.data?.accessToken || j?.data?.token || j?.token
  if (!token) throw new Error("login fail " + JSON.stringify(j).slice(0, 200))
  return token
}

async function api(token, method, path, body) {
  const r = await fetch(FPA + path, {
    method,
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  let data = null
  try {
    data = await r.json()
  } catch {
    /* ignore */
  }
  return {
    status: r.status,
    ok: r.ok,
    success: data?.success,
    data: data?.data,
    message: data?.message,
    code: data?.code || data?.errorCode,
  }
}

function line(ok, label, extra) {
  console.log((ok ? "OK " : "!! ") + label + (extra ? " | " + extra : ""))
}

;(async () => {
  const token = await login()
  console.log("LOGIN_OK\n=== DRAFT", DRAFT, "===")
  const model = await api(token, "GET", "/models/" + DRAFT)
  line(
    model.status === 200,
    "GET model",
    "status=" + model.data?.status + " versions=" + (model.data?.versions?.length || 0),
  )
  const ver = model.data?.defaultVersionId || model.data?.versions?.[0]?.id
  const scen = model.data?.defaultScenarioId || model.data?.scenarios?.[0]?.id
  console.log("ver=" + ver + " scen=" + scen)

  const vers = await api(token, "GET", "/models/" + DRAFT + "/versions")
  line(
    vers.status === 200,
    "GET nested versions",
    "n=" + (Array.isArray(vers.data) ? vers.data.length : "?"),
  )
  const scens = await api(token, "GET", "/models/" + DRAFT + "/scenarios")
  line(
    scens.status === 200,
    "GET nested scenarios",
    "n=" + (Array.isArray(scens.data) ? scens.data.length : "?"),
  )

  const mods = await api(token, "GET", "/models/" + DRAFT + "/modules")
  const moduleId = mods.data?.[0]?.id
  line(
    mods.status === 200,
    "GET modules",
    "n=" + (mods.data?.length || 0) + " first=" + mods.data?.[0]?.name,
  )
  const lis = await api(
    token,
    "GET",
    "/models/" + DRAFT + "/line-items" + (moduleId ? "?moduleId=" + moduleId : ""),
  )
  line(lis.status === 200, "GET line-items", "n=" + (lis.data?.length || 0))
  const li = lis.data?.[0]

  const seedDef = await api(token, "POST", "/models/" + DRAFT + "/seed-defaults", {})
  line(
    seedDef.status < 300,
    "POST seed-defaults",
    JSON.stringify({
      formulasCreated:
        seedDef.data?.formulasCreated ?? seedDef.data?.formulas?.formulasCreated,
      scope: seedDef.data?.scopeCoa?.seededScope,
      coa: seedDef.data?.scopeCoa?.seededCoa,
      entityN: seedDef.data?.scopeCoa?.entityIds?.length,
      acctN: seedDef.data?.scopeCoa?.accountIds?.length,
    }).slice(0, 220),
  )

  const seedCells = await api(token, "POST", "/versions/" + ver + "/seed-cells", {
    scenarioId: scen,
    fillMissing: true,
  })
  line(
    seedCells.status < 300,
    "POST seed-cells",
    JSON.stringify(seedCells.data || seedCells.message).slice(0, 200),
  )

  const grid = await api(
    token,
    "GET",
    "/models/" +
      DRAFT +
      "/grid?versionId=" +
      ver +
      "&scenarioId=" +
      scen +
      "&moduleId=" +
      moduleId +
      "&grain=monthly&pageSize=500",
  )
  const g = grid.data
  line(
    grid.status === 200,
    "GET grid monthly",
    "li=" +
      (g?.lineItems?.length || 0) +
      " cells=" +
      (g?.cells?.length || 0) +
      " periods=" +
      (g?.periods?.length || 0) +
      " fyTotals=" +
      Object.keys(g?.fyTotals || {}).length +
      " grain=" +
      g?.grain,
  )
  const nullVals = (g?.cells || []).filter((c) => c.value == null || c.value === "").length
  const withVal = (g?.cells || []).filter((c) => c.value != null && c.value !== "").length
  console.log(
    "  cells with value=" +
      withVal +
      " null/empty=" +
      nullVals +
      " sample LI=" +
      JSON.stringify(
        (g?.lineItems || []).slice(0, 3).map((x) => ({
          code: x.code,
          type: x.lineItemType,
          fx: (x.formulas || [])[0]?.expression || null,
          summaryMethod: x.summaryMethod,
        })),
      ),
  )

  const gq = await api(
    token,
    "GET",
    "/models/" +
      DRAFT +
      "/grid?versionId=" +
      ver +
      "&scenarioId=" +
      scen +
      "&moduleId=" +
      moduleId +
      "&grain=quarterly",
  )
  line(
    gq.status === 200,
    "GET grid quarterly",
    "periods=" +
      (gq.data?.periods?.length || 0) +
      " readOnly=" +
      (gq.data?.periods || []).filter((p) => p.readOnly).length,
  )

  if (li && g?.periods?.[0]) {
    const pd = g.periods[0].periodDate
    const put = await api(token, "PUT", "/models/" + DRAFT + "/grid/cells", {
      versionId: ver,
      scenarioId: scen,
      updates: [{ lineItemId: li.id, periodDate: pd, value: 12345 }],
    })
    line(
      put.status === 200,
      "PUT grid/cells INPUT",
      "updated=" + put.data?.updated + " msg=" + (put.message || ""),
    )
  }

  // try edit CALCULATED if any
  const calcDraft = (lis.data || []).find(
    (x) => (x.formulas || []).length || String(x.lineItemType || "").toUpperCase().includes("CALC"),
  )
  if (calcDraft && g?.periods?.[0]) {
    const putCalc = await api(token, "PUT", "/models/" + DRAFT + "/grid/cells", {
      versionId: ver,
      scenarioId: scen,
      updates: [
        {
          lineItemId: calcDraft.id,
          periodDate: g.periods[0].periodDate,
          value: 999,
        },
      ],
    })
    line(
      putCalc.status === 409,
      "PUT grid/cells CALCULATED expect 409",
      "status=" + putCalc.status + " msg=" + (putCalc.message || "") + " code=" + (putCalc.code || ""),
    )
  } else {
    console.log("-- SKIP calc cell edit (no calc LI on draft module)")
  }

  const vc = await api(token, "GET", "/models/" + DRAFT + "/validation-checks")
  line(
    vc.status === 200,
    "GET validation-checks",
    JSON.stringify(vc.data?.summary) +
      " failing=" +
      JSON.stringify(
        (vc.data?.checks || [])
          .filter((c) => c.status !== "PASSED")
          .map((c) => c.key + ":" + c.status),
      ),
  )
  const vs = await api(token, "GET", "/models/" + DRAFT + "/validation-summary")
  line(vs.status === 200, "GET validation-summary", JSON.stringify(vs.data))
  const val = await api(token, "POST", "/models/" + DRAFT + "/validate", {})
  line(
    val.status === 200,
    "POST validate",
    "passed=" +
      val.data?.passed +
      " err=" +
      (val.data?.errors || []).length +
      " warn=" +
      (val.data?.warnings || []).length,
  )
  console.log(
    "  err=",
    (val.data?.errors || []).map((e) => e.code || e.severity).slice(0, 8),
  )
  console.log(
    "  warn=",
    (val.data?.warnings || []).map((e) => e.code || e.severity).slice(0, 8),
  )

  const ex = await api(
    token,
    "GET",
    "/models/" +
      DRAFT +
      "/exceptions?versionId=" +
      ver +
      "&scenarioId=" +
      scen +
      (moduleId ? "&moduleId=" + moduleId : ""),
  )
  line(
    ex.status === 200,
    "GET exceptions",
    JSON.stringify(ex.data?.counts) + " items=" + (ex.data?.items || []).length,
  )
  console.log(
    "  sample=",
    JSON.stringify(
      (ex.data?.items || []).slice(0, 4).map((i) => ({
        sev: i.severity,
        impact: i.impact,
        code: i.code || i.issueCode,
        type: i.type,
        hasLI: !!i.lineItemId,
        msg: (i.message || "").slice(0, 70),
      })),
    ),
  )

  const maps = await api(token, "GET", "/models/" + DRAFT + "/data-mappings?limit=50")
  line(
    maps.status === 200,
    "GET data-mappings",
    JSON.stringify(maps.data?.summary) + " entries=" + (maps.data?.entries || []).length,
  )
  const field = "GL_FE_GAP_" + Date.now().toString().slice(-6)
  let mapId = null
  if (li) {
    const cr = await api(token, "POST", "/models/" + DRAFT + "/data-mappings", {
      sourceSystem: "NetSuite GL",
      sourceField: field,
      targetLineItemId: li.id,
      status: "MAPPED",
      notes: "gap-doc",
      moduleId,
    })
    mapId = cr.data?.id
    line(cr.status < 300, "POST data-mappings", "id=" + mapId + " status=" + cr.status)
    if (mapId) {
      const up = await api(token, "PUT", "/models/" + DRAFT + "/data-mappings/" + mapId, {
        notes: "gap-updated",
        status: "MAPPED",
      })
      line(up.status === 200, "PUT data-mappings", "notes=" + up.data?.notes)
    }
  }
  const seedCat = await api(token, "POST", "/models/" + DRAFT + "/data-mappings/seed-catalog", {
    replaceExisting: false,
  })
  line(seedCat.status === 200, "POST seed-catalog", JSON.stringify(seedCat.data).slice(0, 180))
  const ref = await api(token, "POST", "/models/" + DRAFT + "/data-mappings/refresh", {
    replaceExisting: false,
  })
  line(
    ref.status === 200,
    "POST refresh",
    JSON.stringify(ref.data?.summary || ref.data).slice(0, 140),
  )
  if (mapId) {
    const del = await api(token, "DELETE", "/models/" + DRAFT + "/data-mappings/" + mapId)
    line(del.status === 200, "DELETE data-mappings", "ok")
  }

  const audit = await api(token, "GET", "/models/" + DRAFT + "/audit?limit=20&format=fe")
  const entries = audit.data?.entries || audit.data || []
  line(audit.status === 200, "GET audit", "n=" + entries.length)
  const a0 = entries[0]
  console.log(
    "  latest=",
    JSON.stringify({
      action: a0?.action,
      entityType: a0?.entityType,
      lineItemId: a0?.lineItemId,
      moduleId: a0?.moduleId,
      summary: (a0?.summary || "").slice(0, 100),
    }),
  )
  const writeish = entries.filter((e) =>
    /CELL|MAPPING|FORMULA|LINE/i.test((e.action || "") + (e.entityType || "")),
  )
  const missingLI = writeish.filter((e) => !e.lineItemId).length
  console.log(
    "  write-ish missing lineItemId=" + missingLI + "/" + writeish.length,
  )

  const draftSens = await api(token, "POST", "/models/" + DRAFT + "/sensitivity-analysis", {
    versionId: ver,
    scenarioId: scen,
    driverLineItemId: li?.id,
    shock: { type: "PERCENT", value: 5 },
  })
  line(
    draftSens.status === 200,
    "POST sensitivity DRAFT",
    "impacts=" +
      (draftSens.data?.impacts || []).length +
      " msg=" +
      (draftSens.data?.message || "") +
      " periods=" +
      (draftSens.data?.series?.periods || []).length,
  )

  const tc = await api(token, "POST", "/versions/" + ver + "/test-calculation", {
    scenarioId: scen,
    moduleId,
    pageSize: 100,
  })
  line(
    tc.status === 200,
    "POST test-calculation",
    "hasGrid=" + !!tc.data?.grid + " msg=" + (tc.data?.message || ""),
  )

  const dep = await api(
    token,
    "GET",
    "/models/" +
      DRAFT +
      "/dependency-graph?view=module" +
      (moduleId ? "&moduleId=" + moduleId : ""),
  )
  line(
    dep.status === 200,
    "GET dependency-graph",
    "nodes=" +
      (dep.data?.nodes?.length || 0) +
      " edges=" +
      (dep.data?.edges?.length || 0),
  )

  const pubTry = await api(token, "POST", "/versions/" + ver + "/publish", {
    notes: "gap smoke",
  })
  line(
    true,
    "POST publish DRAFT version",
    "status=" +
      pubTry.status +
      " msg=" +
      (pubTry.message || "") +
      " code=" +
      (pubTry.code || ""),
  )

  const cell = (g?.cells || []).find((c) => c.id)
  if (cell?.id) {
    const tr = await api(token, "GET", "/models/" + DRAFT + "/cells/" + cell.id + "/trace")
    line(
      tr.status === 200,
      "GET cell trace DRAFT",
      "nodes=" +
        (tr.data?.nodes?.length || 0) +
        " edges=" +
        (tr.data?.edges?.length || 0) +
        " rootExpr=" +
        (tr.data?.root?.expression ?? "null") +
        " rootVal=" +
        (tr.data?.root?.value ?? "null"),
    )
    const det = await api(token, "GET", "/models/" + DRAFT + "/cells/" + cell.id + "/detail")
    line(
      det.status === 200,
      "GET cell detail DRAFT",
      JSON.stringify({
        lastCalculatedAt: det.data?.lastCalculatedAt,
        formulaUpdatedAt: det.data?.formulaUpdatedAt,
        formulaUpdatedByName: det.data?.formulaUpdatedByName,
        validationStatus: det.data?.validationStatus,
        hasFormula: !!det.data?.formula,
      }),
    )
  }

  console.log("\n=== PUBLISHED", PUB, "===")
  const pm = await api(token, "GET", "/models/" + PUB)
  const pver = pm.data?.defaultVersionId || pm.data?.versions?.[0]?.id
  const pscen = pm.data?.defaultScenarioId || pm.data?.scenarios?.[0]?.id
  const plis = await api(token, "GET", "/models/" + PUB + "/line-items")
  line(plis.status === 200, "GET pub line-items", "n=" + (plis.data?.length || 0))

  const pgrid = await api(
    token,
    "GET",
    "/models/" + PUB + "/grid?versionId=" + pver + "&scenarioId=" + pscen + "&pageSize=500",
  )
  line(
    pgrid.status === 200,
    "GET pub grid",
    "li=" +
      (pgrid.data?.lineItems?.length || 0) +
      " cells=" +
      (pgrid.data?.cells || []).length +
      " fy=" +
      Object.keys(pgrid.data?.fyTotals || {}).length,
  )
  const pwith = (pgrid.data?.cells || []).filter((c) => c.value != null && c.value !== "").length
  console.log("  cells with value=" + pwith)

  let best = null
  for (const item of plis.data || []) {
    if (!(item.formulas || []).length) continue
    const c = (pgrid.data?.cells || []).find((x) => x.lineItemId === item.id && x.id)
    if (c) {
      best = { item, c }
      if (c.value != null && c.value !== "") break
    }
  }

  // Prefer EBITDA-like with dependents
  for (const item of plis.data || []) {
    const blob = (item.code || "") + " " + (item.name || "")
    if (!/EBITDA|GROSS|NET_INCOME|OPERATING/i.test(blob)) continue
    if (!(item.formulas || []).length) continue
    const c = (pgrid.data?.cells || []).find((x) => x.lineItemId === item.id && x.id)
    if (c) {
      best = { item, c }
      break
    }
  }

  if (best) {
    console.log(
      "trace target",
      best.item.code,
      best.item.name,
      "cell",
      best.c.id,
      "value",
      best.c.value,
      "expr",
      best.item.formulas?.[0]?.expression,
    )
    // run test calc on published version? may be locked
    const ptc = await api(token, "POST", "/versions/" + pver + "/test-calculation", {
      scenarioId: pscen,
      pageSize: 50,
    })
    line(
      true,
      "POST test-calc on PUB version",
      "status=" + ptc.status + " msg=" + (ptc.message || ""),
    )

    const tr = await api(token, "GET", "/models/" + PUB + "/cells/" + best.c.id + "/trace")
    line(
      tr.status === 200,
      "GET cell TRACE pub CALC",
      "nodes=" + (tr.data?.nodes?.length || 0) + " edges=" + (tr.data?.edges?.length || 0),
    )
    console.log("  root", JSON.stringify(tr.data?.root))
    console.log(
      "  nodes",
      JSON.stringify(
        (tr.data?.nodes || []).map((n) => ({
          id: n.id,
          label: n.label,
          kind: n.kind,
          value: n.value,
          expression: n.expression,
        })),
      ).slice(0, 1200),
    )
    console.log("  edges", JSON.stringify(tr.data?.edges || []).slice(0, 500))

    const det = await api(token, "GET", "/models/" + PUB + "/cells/" + best.c.id + "/detail")
    line(
      det.status === 200,
      "GET cell DETAIL pub CALC",
      JSON.stringify({
        lastCalculatedAt: det.data?.lastCalculatedAt,
        formulaUpdatedAt: det.data?.formulaUpdatedAt,
        formulaUpdatedByName: det.data?.formulaUpdatedByName,
        validationStatus: det.data?.validationStatus,
        formula:
          typeof det.data?.formula === "string"
            ? det.data.formula
            : det.data?.formula?.expression || null,
        value: det.data?.value ?? det.data?.cell?.value,
      }).slice(0, 450),
    )

    const fxId = best.item.formulas?.[0]?.id
    if (fxId) {
      const im = await api(token, "GET", "/formulas/" + fxId + "/impact-map")
      line(
        im.status === 200,
        "GET impact-map",
        "prec=" +
          (im.data?.precedents || []).length +
          " dep=" +
          (im.data?.dependents || []).length,
      )
      console.log(
        "  precedents",
        JSON.stringify(
          (im.data?.precedents || []).slice(0, 8).map((p) => ({
            code: p.code,
            name: p.name,
          })),
        ),
      )
      console.log(
        "  dependents",
        JSON.stringify(
          (im.data?.dependents || []).slice(0, 8).map((p) => ({
            code: p.code,
            name: p.name,
          })),
        ),
      )
    }
  } else {
    console.log("!! no calculated cell found for trace")
  }

  const driver =
    (plis.data || []).find((x) =>
      /UNIT|PRICE|ARR|BOOKING|REV/i.test((x.code || "") + " " + (x.name || "")),
    ) || (plis.data || [])[0]
  const sens = await api(token, "POST", "/models/" + PUB + "/sensitivity-analysis", {
    versionId: pver,
    scenarioId: pscen,
    driverLineItemId: driver?.id,
    shock: { type: "PERCENT", value: 5 },
  })
  line(
    sens.status === 200,
    "POST sensitivity PUB",
    "driver=" +
      driver?.code +
      " impacts=" +
      (sens.data?.impacts || []).length +
      " shockLabel=" +
      (sens.data?.driver?.shockLabel || "") +
      " msg=" +
      (sens.data?.message || "") +
      " periods=" +
      (sens.data?.series?.periods || []).length,
  )
  console.log(
    "  impacts",
    JSON.stringify(
      (sens.data?.impacts || []).slice(0, 5).map((i) => ({
        name: i.name,
        delta: i.deltaTotal,
        pct: i.deltaPct,
      })),
    ),
  )

  const pmaps = await api(token, "GET", "/models/" + PUB + "/data-mappings?limit=20")
  line(pmaps.status === 200, "GET pub mappings", JSON.stringify(pmaps.data?.summary))
  const pvc = await api(token, "GET", "/models/" + PUB + "/validation-checks")
  line(
    pvc.status === 200,
    "GET pub validation-checks",
    JSON.stringify(pvc.data?.summary) +
      " fail=" +
      JSON.stringify(
        (pvc.data?.checks || [])
          .filter((c) => c.status !== "PASSED")
          .map((c) => c.key + ":" + c.status),
      ),
  )
  const pdep = await api(token, "GET", "/models/" + PUB + "/dependency-graph?view=module")
  line(
    pdep.status === 200,
    "GET pub dependency-graph",
    "nodes=" +
      (pdep.data?.nodes?.length || 0) +
      " edges=" +
      (pdep.data?.edges?.length || 0),
  )

  // formula-level fallback candidate
  if (best?.item?.formulas?.[0]?.id) {
    for (const path of [
      "/formulas/" + best.item.formulas[0].id + "/trace-graph",
      "/formulas/" + best.item.formulas[0].id + "/chain",
      "/formulas/" + best.item.formulas[0].id + "/trace",
    ]) {
      const r = await api(token, "GET", path)
      line(true, "PROBE " + path, "status=" + r.status + " msg=" + (r.message || ""))
    }
  }

  const gv = await api(
    token,
    "GET",
    "/models/" + DRAFT + "/grid/validations?versionId=" + ver + "&scenarioId=" + scen,
  )
  const gvN = Array.isArray(gv.data)
    ? gv.data.length
    : (gv.data?.items || gv.data?.errors || []).length
  line(gv.status === 200, "GET grid/validations", "n=" + gvN)

  // audit filter
  const auditMod = await api(
    token,
    "GET",
    "/models/" + DRAFT + "/audit?limit=5&format=fe&entityType=mapping",
  )
  line(
    auditMod.status === 200,
    "GET audit entityType=mapping",
    "n=" + (auditMod.data?.entries || auditMod.data || []).length,
  )

  console.log("\nDONE")
})().catch((e) => {
  console.error("FATAL", e)
  process.exit(1)
})
