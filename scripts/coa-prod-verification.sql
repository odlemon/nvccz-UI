SELECT accountNo, accountName, accountType, financialStatement, naturalBalance, parentId, isActive
FROM chart_of_accounts
WHERE isActive = 1
ORDER BY accountNo;

SELECT accountNo, accountName, accountType, financialStatement, naturalBalance, parentId, isActive
FROM chart_of_accounts
WHERE accountNo IN ('6000','6010','6020','6030','6040','6050','6060','1550','1010','1350','2000','2100','2200','3000','3100')
ORDER BY accountNo;

SELECT j.status, j.currencyId, COUNT(*) AS lineCount,
       CAST(SUM(l.debitAmount) AS CHAR) AS debit,
       CAST(SUM(l.creditAmount) AS CHAR) AS credit
FROM journal_entry_lines l
JOIN journal_entries j ON j.id = l.journalEntryId
GROUP BY j.status, j.currencyId
ORDER BY j.status, j.currencyId;

SELECT COUNT(*) AS orphanJournalLines
FROM journal_entry_lines l
LEFT JOIN chart_of_accounts a ON a.id = l.chartOfAccountId
LEFT JOIN journal_entries j ON j.id = l.journalEntryId
WHERE a.id IS NULL OR j.id IS NULL;
