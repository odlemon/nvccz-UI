/**
 * Host hooks for the department/board/CEO/employee scorecards — not a page.
 *
 * `__perfObject('boardScorecard')` / `__perfObject('ceoScorecard')` already work via the
 * existing generic reader (built-in `bridge-readers-2`). Two things it cannot do:
 *
 *   1. `deptScorecards` is an ARRAY (one entry per department), so finding "the one for
 *      Operations" needs a lookup, not a single object read.
 *   2. `employeeScorecards` lives OUTSIDE the ordinary scopes object entirely — it is a
 *      keyed cache the host fills on demand (see bridge.ts `fetchEmployeeScorecard`), not
 *      part of the static Promise.all payload. `__perfScope`/`__perfObject` only know how to
 *      read `window.__PERF_LIVE__.data[scope]`; this cache lives at
 *      `window.__PERF_LIVE__.data.employeeScorecards[employeeId]`.
 *
 * Anchored on the tail of the built-in `bridge-readers-2` block, same reasoning as
 * `_bridge-host-hooks.mjs`: these must exist before any page patch calls them, and the
 * filename sorts before ordinary page files.
 */
const ANCHOR =
  "window.__PERF_HELPERS__ = { __perfCount, __perfNum, __perfTally, __perfDate, __perfLabel, __perfEmptyRow, __perfNoSeries, __perfPct, __perfSum };"

const HOOKS = `
/* patched:scorecard-readers */
function __perfDeptScorecard(departmentName) {
  const rows = __perfScope('deptScorecards');
  if (rows === null) return null;
  return rows.find(function (r) { return r.department === departmentName; }) || null;
}
// The employee-scorecard cache is keyed by id and lives outside the ordinary scopes object
// (see bridge.ts). Absent = never fetched; this triggers the host to fetch it and returns
// null for this render, same "loading" contract as every other live scope on first paint.
function __perfEmployeeScorecard(employeeId) {
  var g = window.__PERF_LIVE__;
  if (!g || !g.ready) return null;
  g.data = g.data || {};
  var cache = g.data.employeeScorecards || {};
  var entry = cache[employeeId];
  if (entry) return entry.data || null;
  if (typeof window.__PERF_FETCH_EMPLOYEE_SCORECARD__ === 'function') {
    window.__PERF_FETCH_EMPLOYEE_SCORECARD__(employeeId);
  }
  return null;
}
// Resolve an employee's id from the display name the context picker shows (contexts.employees
// lists names, not ids - see scorecards-contexts). Returns null if no user matches.
function __perfUserIdByName(name) {
  var users = __perfScope('users') || [];
  var match = users.find(function (u) { return u.name === name; });
  return match ? match.id : null;
}
window.__PERF_DEPT_SCORECARD__ = __perfDeptScorecard;
window.__PERF_EMPLOYEE_SCORECARD__ = __perfEmployeeScorecard;
window.__PERF_USER_ID_BY_NAME__ = __perfUserIdByName;`

export default [
  {
    label: "scorecard-readers",
    find: ANCHOR,
    repl: ANCHOR + HOOKS,
  },
]
