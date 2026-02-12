/**
 * Options for number formatting
 */
interface FormatCompactNumberOptions {
    /**
     * Style of formatting. Defaults to 'decimal'.
     * If 'currency' is selected, the currency symbol is added.
     */
    style?: 'currency' | 'decimal' | 'percent'
    /**
     * Currency code. Defaults to 'USD'.
     * Only used if style is 'currency'.
     */
    currency?: string
    /**
     * Maximum fraction digits. Defaults to 1.
     */
    maximumFractionDigits?: number
}

/**
 * Formats a number to a compact representation (e.g., 1.2M, 10K).
 * 
 * @param number The number to format
 * @param options Formatting options
 * @returns Formatted string
 */
export function formatCompactNumber(
    number: number | undefined | null,
    options: FormatCompactNumberOptions = {}
): string {
    if (number === undefined || number === null || isNaN(number)) {
        return options.style === 'currency' ? '$0' : '0'
    }

    const {
        style = 'decimal',
        currency = 'USD',
        maximumFractionDigits = 1
    } = options

    const formattedNumber = new Intl.NumberFormat('en-US', {
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: maximumFractionDigits,
    }).format(number)

    if (style === 'currency') {
        // Simple handling for USD, extend as needed
        const symbol = currency === 'USD' ? '$' : currency + ' '
        return `${symbol}${formattedNumber}`
    }

    if (style === 'percent') {
        return `${formattedNumber}%`
    }

    return formattedNumber
}
