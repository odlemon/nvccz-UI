# Dashboard API Documentation

This document defines the 4 endpoints required to supply data to the various dashboards. Each endpoint should return a structured JSON response optimized for the frontend components.

---

## 1. Accounting Dashboard API
**Endpoint:** `GET /api/v1/accounting/dashboard`

### Request Parameters
| Parameter | Type | Description | Values |
| :--- | :--- | :--- | :--- |
| `period` | string | Time period calculation | `mtd`, `ytd` |
| `benchmark` | string | Comparison baseline | `lastYear`, `lastMonth` |
| `entity` | string | Company entity filter | `all`, `entity1`, `entity2` |
| `financialYear` | string | Selected year | e.g. `2024`, `2025`, `2026` |
| `months` | string | Month filter | `all`, `q1`, `q2`, `q3`, `q4` |

### Sample Response
```json
{
  "stats": {
    "revenue": { "value": 23150000, "percentChange": -8.2 },
    "cogs": { "value": 10450000, "percentChange": 12.5 },
    "grossProfit": { "value": 12700000, "percentChange": 4.1 },
    "netProfit": { "value": 2345432, "percentChange": -2.3 }
  },
  "operatingProfitChart": [
    { "month": "Jan", "value": 1800000, "percent": 45 },
    { "month": "Feb", "value": 2100000, "percent": 48 }
  ],
  "netProfitChart": [
    { "month": "Jan", "netProfit": 180000, "grossProfit": 320000, "netPercent": 12, "grossPercent": 22 }
  ],
  "assets": [
    { "name": "Current Assets", "value": 23450000, "displayValue": "$23.5M" }
  ],
  "expenses": [
    { "name": "Salaries & Benefit", "value": 504435, "totalBudget": 600000 }
  ]
}
```

---

## 2. Performance Dashboard API
**Endpoint:** `GET /api/v1/performance/dashboard`

### Request Parameters
| Parameter | Type | Description | Values |
| :--- | :--- | :--- | :--- |
| `week` | string | Selected week | `Week 1` to `Week 4` |
| `month` | string | Selected month | e.g. `January`, `February` |
| `year` | string | Selected year | e.g. `2026` |

### Sample Response
```json
{
  "summaryStats": {
    "pendingTasks": { "value": 15, "change": "+11%", "progress": 15, "total": 50 },
    "inProgress": { "value": 10, "change": "+9%", "progress": 10, "total": 50 },
    "completed": { "value": 25, "change": "-16%", "progress": 25, "total": 50 },
    "completionRate": { "value": "20%", "change": "+12%", "progress": 20, "total": 100 }
  },
  "productivityTrend": [
    { "month": "Jan", "tasks": 24, "isCurrent": true }
  ],
  "performanceDistribution": [
    { "name": "High Performers", "value": 25, "color": "#4c1d95" },
    { "name": "Average", "value": 45, "color": "#111827" }
  ],
  "workerInsights": [
    { "id": 1, "name": "Tendai Makoni", "type": "Full Time", "role": "IT Specialist", "progress": 75, "tasks": 42 }
  ],
  "budgetTracker": {
    "totalBudget": 120000,
    "totalSpend": 95000,
    "remaining": 25000
  },
  "employeeOfTheMonth": {
    "name": "Nomsa Sibanda",
    "role": "Senior UI/UX Designer",
    "activeTime": 80,
    "extraTime": 12,
    "pauseTime": 8
  }
}
```

---

## 3. Payroll Dashboard API
**Endpoint:** `GET /api/v1/payroll/dashboard`

### Request Parameters
| Parameter | Type | Description | Values |
| :--- | :--- | :--- | :--- |
| `month` | string | Month filter | `all` or `1`-`12` |
| `department` | string | Department filter | `all`, `it`, `engineering`, etc. |
| `status` | string | Payment status | `all`, `paid`, `pending`, `processing` |
| `dateFrom` | ISO Date | Start date range | e.g. `2025-01-01` |
| `dateTo` | ISO Date | End date range | e.g. `2025-01-31` |
| `trendTimeframe` | string | Chart history scope | `6months`, `12months` |

### Sample Response
```json
{
  "summary": {
    "totalPayroll": 295000,
    "totalEmployees": 45,
    "averageSalary": 6555,
    "percentChange": 8.2
  },
  "monthlyTrend": [
    { "month": "Jan", "value": 275000 },
    { "month": "Feb", "value": 285000 }
  ],
  "departmentDistribution": [
    { "department": "Marketing", "salary": 45000, "bonus": 5000 }
  ],
  "payrollList": [
    {
      "id": 1,
      "name": "Employee Name",
      "department": "IT",
      "payDate": "01/25/2026",
      "status": "Paid",
      "baseSalary": 4500,
      "bonuses": 500,
      "totalSalary": 5000,
      "avatar": null
    }
  ]
}
```

---

## 4. Portfolio Dashboard API
**Endpoint:** `GET /api/v1/portfolio/dashboard`

### Request Parameters
| Parameter | Type | Description | Values |
| :--- | :--- | :--- | :--- |
| `fund` | string | Selected fund identifier | `usd-fund-i`, `eur-fund-ii`, `global-growth` |
| `date` | ISO Date | Snapshot date | e.g. `2025-12-31` |
| `allocationType`| string | Grouping for chart | `sector`, `industry` |

### Sample Response
```json
{
  "summaryStats": [
    { "label": "Total invested", "value": "$125.4m" },
    { "label": "Realized Proceeds", "value": "$17.5m" },
    { "label": "Fair Market Value", "value": "$482.0m" },
    { "label": "Total Value", "value": "$499.5m" },
    { "label": "TVPI", "value": "3.98x" }
  ],
  "performanceOverview": [
    { "name": "Paid-in", "value": 350 },
    { "name": "Total investment", "value": -250 }
  ],
  "jCurve": [
    { "year": "2015", "contribution": -10, "distribution": 0, "cumulative": -10 }
  ],
  "allocation": [
    { "name": "Technology", "value": 35.5, "rawValue": 12.5, "color": "#4f77ff" }
  ],
  "irrByQuarter": [
    { "quarter": "2015 Q1", "investorNetIrr": 0, "fundNetIrr": 0, "fundGrossIrr": 0 }
  ],
  "portfolioSummary": [
    {
      "name": "Econet Wireless",
      "industry": "Telecoms",
      "invested": "$12.50",
      "realized": "$5.00",
      "fmv": "$45.20",
      "total": "$50.20",
      "multiple": "4.02x",
      "irr": "42.15%"
    }
  ]
}
```
