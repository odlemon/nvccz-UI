/**
 * Utility function to export data to CSV and trigger download
 */
export const downloadAsCSV = (data: any[], headers: string[], fileName: string, delimiter: string = ',') => {
    // Create CSV content
    const csvRows = [];

    // Add headers
    csvRows.push(headers.join(delimiter));

    // Add data rows
    data.forEach(row => {
        const values = headers.map(header => {
            const value = row[header] !== undefined ? row[header] : '';
            // Escape double quotes and wrap in double quotes if it contains delimiter or newline
            const escaped = ('' + value).replace(/"/g, '""');
            return (escaped.includes(delimiter) || escaped.includes('\n')) ? `"${escaped}"` : escaped;
        });
        csvRows.push(values.join(delimiter));
    });

    const csvString = csvRows.join('\n');

    // Create blob and download link
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
