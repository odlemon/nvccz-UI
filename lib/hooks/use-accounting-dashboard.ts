import { useCallback, useMemo, useRef, useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'sonner'
import type { RootState, AppDispatch } from '@/lib/store/store'
import { accountingApi } from '@/lib/api/accounting-api'

export function useAccountingDashboard() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [creditNotes, setCreditNotes] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const hasInitialized = useRef(false)

  // Load all data directly from API
  const loadDashboardData = useCallback(async () => {
    if (hasInitialized.current) return

    try {
      setLoading(true)
      console.log('Loading dashboard data directly from API...')

      const [invoicesRes, creditNotesRes, customersRes, expensesRes] = await Promise.all([
        accountingApi.getInvoices(),
        accountingApi.getCreditNotes(),
        accountingApi.getCustomers(),
        accountingApi.getExpenses()
      ])

      if (invoicesRes.success) {
        const invoiceData = (invoicesRes.data?.invoices || invoicesRes.data || []) as any[]
        setInvoices(invoiceData)
        console.log('Loaded invoices:', invoiceData.length)
      }

      if (creditNotesRes.success) {
        const creditData = (creditNotesRes.data?.creditNotes || creditNotesRes.data || []) as any[]
        setCreditNotes(creditData)
        console.log('Loaded credit notes:', creditData.length)
      }

      if (customersRes.success) {
        const customerData = (customersRes.data?.customers || customersRes.data || []) as any[]
        setCustomers(customerData)
        console.log('Loaded customers:', customerData.length)
      }

      if (expensesRes.success) {
        const expenseData = (expensesRes.data?.expenses || expensesRes.data || []) as any[]
        // Filter to only show POSTED expenses
        const postedExpenses = expenseData.filter((expense: any) => expense.status === 'POSTED')
        setExpenses(postedExpenses)
        console.log('Loaded expenses (POSTED only):', postedExpenses.length)
      }

      hasInitialized.current = true
    } catch (error: any) {
      console.error('Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [])

  // Load data on mount
  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // Calculate dashboard stats from loaded data
  const dashboardStats = useMemo(() => {
    if (!invoices.length && !creditNotes.length && !customers.length && !expenses.length) {
      return null
    }

    console.log('Calculating stats from loaded data:', {
      invoices: invoices.length,
      creditNotes: creditNotes.length,
      customers: customers.length,
      expenses: expenses.length
    })

    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

    // All invoices totals
    const totalInvoices = invoices.length
    const totalInvoiceAmount = invoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || 0), 0)

    // Current month invoices for comparison
    const currentMonthInvoices = invoices.filter(invoice => {
      const date = new Date(invoice.createdAt)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })
    const lastMonthInvoices = invoices.filter(invoice => {
      const date = new Date(invoice.createdAt)
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear
    })

    const currentInvoiceTotal = currentMonthInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || 0), 0)
    const lastInvoiceTotal = lastMonthInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || 0), 0)
    const invoiceChange = lastInvoiceTotal > 0 ? ((currentInvoiceTotal - lastInvoiceTotal) / lastInvoiceTotal) * 100 : 0

    // All credit notes totals
    const totalCreditNotes = creditNotes.length
    const totalCreditAmount = creditNotes.reduce((sum, note) => sum + parseFloat(note.totalAmount || 0), 0)

    const currentMonthCreditNotes = creditNotes.filter(note => {
      const date = new Date(note.createdAt)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })
    const lastMonthCreditNotes = creditNotes.filter(note => {
      const date = new Date(note.createdAt)
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear
    })

    const currentCreditTotal = currentMonthCreditNotes.reduce((sum, note) => sum + parseFloat(note.totalAmount || 0), 0)
    const lastCreditTotal = lastMonthCreditNotes.reduce((sum, note) => sum + parseFloat(note.totalAmount || 0), 0)
    const creditChange = lastCreditTotal > 0 ? ((currentCreditTotal - lastCreditTotal) / lastCreditTotal) * 100 : 0

    // All expenses totals (POSTED only)
    const totalExpenses = expenses.length
    const totalExpenseAmount = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0)

    const currentMonthExpenses = expenses.filter(expense => {
      const date = new Date(expense.createdAt)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })
    const lastMonthExpenses = expenses.filter(expense => {
      const date = new Date(expense.createdAt)
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear
    })

    const currentExpenseTotal = currentMonthExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0)
    const lastExpenseTotal = lastMonthExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0)
    const expenseChange = lastExpenseTotal > 0 ? ((currentExpenseTotal - lastExpenseTotal) / lastExpenseTotal) * 100 : 0

    // All customers with total value
    const customerTotalValue = customers.reduce((sum, customer) => {
      const customerInvoices = invoices.filter(inv => inv.customerId === customer.id)
      return sum + customerInvoices.reduce((invSum, inv) => invSum + parseFloat(inv.totalAmount || 0), 0)
    }, 0)

    const stats = {
      invoices: {
        count: totalInvoices,
        totalAmount: totalInvoiceAmount,
        change: invoiceChange
      },
      creditNotes: {
        count: totalCreditNotes,
        totalAmount: totalCreditAmount,
        change: creditChange
      },
      customers: {
        count: customers.length,
        totalValue: customerTotalValue,
        change: 0 // Since we're showing all customers
      },
      expenses: {
        count: totalExpenses,
        totalAmount: totalExpenseAmount,
        change: expenseChange
      }
    }

    console.log('Final calculated stats:', stats)
    return stats
  }, [invoices, creditNotes, customers, expenses])

  // Generate chart data for the entire year - match PayrollChart format but with daily granularity
  const chartData = useMemo(() => {
    if (!invoices.length && !creditNotes.length) return []

    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()

    // Create an array of daily points from Jan 1st to today
    const startDate = new Date(currentYear, 0, 1)
    const days: any[] = []

    for (let d = new Date(startDate); d <= currentDate; d.setDate(d.getDate() + 1)) {
      days.push({
        date: d.toISOString().split('T')[0], // YYYY-MM-DD
        sales: 0,
        credits: 0
      })
    }

    // Map dates to their index in the days array for faster lookup
    const dateToIndex = new Map(days.map((day, index) => [day.date, index]))

    // Add sales data
    invoices.forEach(invoice => {
      const invoiceDate = new Date(invoice.createdAt)
      if (invoiceDate.getFullYear() === currentYear) {
        const dateKey = invoiceDate.toISOString().split('T')[0]
        const index = dateToIndex.get(dateKey)
        if (index !== undefined) {
          days[index].sales += parseFloat(invoice.totalAmount || 0)
        }
      }
    })

    // Add credit notes data
    creditNotes.forEach(note => {
      const noteDate = new Date(note.createdAt)
      if (noteDate.getFullYear() === currentYear) {
        const dateKey = noteDate.toISOString().split('T')[0]
        const index = dateToIndex.get(dateKey)
        if (index !== undefined) {
          days[index].credits += parseFloat(note.totalAmount || 0)
        }
      }
    })

    return days
  }, [invoices, creditNotes])

  // Get recent expenses (last 5, POSTED only)
  const recentExpenses = useMemo(() => {
    if (!expenses.length) return []

    return [...expenses]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  }, [expenses])

  return {
    dashboardStats,
    chartData,
    recentExpenses,
    loading,
    loadDashboardData
  }
}
