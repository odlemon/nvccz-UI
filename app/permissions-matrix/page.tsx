'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Save, Download, Trash2, Search, Check, X, Shield, Lock, FileJson, Info, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Layers } from 'lucide-react';

const ROLES = [
    'FIN_MGR', 'CFO', 'FIN_OFF', 'ACCOUNTANT', 'FIN_ASST', 'FIN_MEM',
    'SALES_MGR', 'SALES_OFF', 'SALES_REP', 'SALES_COORD', 'SALES_MEM',
    'OPS_MGR', 'OPS_OFF', 'OPS_COORD', 'OPS_ANALYST', 'OPS_MEM',
    'PROC_MGR', 'PROC_OFF', 'BUYER', 'PROC_COORD', 'PROC_MEM',
    'HR_MGR', 'HR_OFF', 'RECRUITER', 'HR_COORD', 'HR_MEM',
    'MKT_MGR', 'MKT_OFF', 'CONTENT_CREATOR', 'SOCIAL_MEDIA_MGR', 'MKT_MEM',
    'LEGAL_MGR', 'LEGAL_OFF', 'COMPLIANCE_OFF', 'LEGAL_ADVISOR', 'LEGAL_MEM',
    'IT_MGR', 'SYSADMIN', 'DEVELOPER', 'IT_SUPPORT', 'IT_MEM',
    'CEO', 'CIO', 'BOARD_CHAIR', 'INV_ANALYST', 'BOARD_MEMBER', 'INV_COMM_MEM',
    'COMPLIANCE_OFF_INV', 'FUND_MGR', 'PORTFOLIO_MGR', 'LIMITED_PARTNER', 'EXT_AUDITOR'
];

const INITIAL_ROWS = [
    // Portfolio Module
    { module: 'Portfolio', page: 'Dashboard', action: 'View' },
    { module: 'Portfolio', page: 'Applications', action: 'View' },
    { module: 'Portfolio', page: 'Applications', action: 'Initiate Due Diligence' },
    { module: 'Portfolio', page: 'Applications', action: 'Create/Update Due Diligence' },
    { module: 'Portfolio', page: 'Applications', action: 'Create DueDiligence Task' },
    { module: 'Portfolio', page: 'Applications', action: 'Complete Due Diligence' },
    { module: 'Portfolio', page: 'Applications', action: 'Create/Update Termsheet' },
    { module: 'Portfolio', page: 'Applications', action: 'Sign Termsheet' },
    { module: 'Portfolio', page: 'Applications', action: 'Finalize Termsheet' },
    { module: 'Portfolio', page: 'Applications', action: 'Initiate Fund Disbursement' },
    { module: 'Portfolio', page: 'Applications', action: 'Create Disbursement' },
    { module: 'Portfolio', page: 'Applications', action: 'Update Checklist' },
    { module: 'Portfolio', page: 'Applications', action: 'Create Fund Disbursement' },
    { module: 'Portfolio', page: 'Applications', action: 'Board Review: Cast Vote' },
    { module: 'Portfolio', page: 'Applications', action: 'Board Review: Create/Update' },
    { module: 'Portfolio', page: 'Applications', action: 'Board Review: Complete' },
    { module: 'Portfolio', page: 'Applications', action: 'Disburse Funds' },
    { module: 'Portfolio', page: 'Funds', action: 'Create' },
    { module: 'Portfolio', page: 'Funds', action: 'Read' },
    { module: 'Portfolio', page: 'Funds', action: 'Update' },
    { module: 'Portfolio', page: 'Funds', action: 'Delete' },
    { module: 'Portfolio', page: 'Companies', action: 'View' },
    // Procurement Module
    { module: 'Procurement', page: 'Dashboard', action: 'View' },
    { module: 'Procurement', page: 'Purchase Requisitions', action: 'Create' },
    { module: 'Procurement', page: 'Purchase Requisitions', action: 'Read' },
    { module: 'Procurement', page: 'Purchase Requisitions', action: 'Update' },
    { module: 'Procurement', page: 'Purchase Requisitions', action: 'Delete' },
    { module: 'Procurement', page: 'Purchase Requisitions', action: 'Submit Approval' },
    { module: 'Procurement', page: 'Purchase Requisitions', action: 'Approve' },
    { module: 'Procurement', page: 'Purchase Requisitions', action: 'Convert to Purchase Order' },
    { module: 'Procurement', page: 'RFQ', action: 'Create' },
    { module: 'Procurement', page: 'RFQ', action: 'Read' },
    { module: 'Procurement', page: 'RFQ', action: 'Update' },
    { module: 'Procurement', page: 'RFQ', action: 'Delete' },
    { module: 'Procurement', page: 'RFQ', action: 'Send RFQ' },
    { module: 'Procurement', page: 'Quotations', action: 'Create' },
    { module: 'Procurement', page: 'Quotations', action: 'Read' },
    { module: 'Procurement', page: 'Quotations', action: 'Update' },
    { module: 'Procurement', page: 'Quotations', action: 'Delete' },
    { module: 'Procurement', page: 'Quotations', action: 'Accept Quote' },
    { module: 'Procurement', page: 'Purchase Orders', action: 'View' },
    { module: 'Procurement', page: 'Purchase Orders', action: 'Create' },
    { module: 'Procurement', page: 'Purchase Orders', action: 'Read' },
    { module: 'Procurement', page: 'Purchase Orders', action: 'Update' },
    { module: 'Procurement', page: 'Purchase Orders', action: 'Delete' },
    { module: 'Procurement', page: 'Invoices', action: 'View' },
    { module: 'Procurement', page: 'Invoices', action: 'Create' },
    { module: 'Procurement', page: 'Invoices', action: 'Update' },
    { module: 'Procurement', page: 'Invoices', action: 'Delete' },
    { module: 'Procurement', page: 'Goods Received Notes', action: 'View' },
    { module: 'Procurement', page: 'Goods Received Notes', action: 'Create' },
    { module: 'Procurement', page: 'Goods Received Notes', action: 'Update' },
    { module: 'Procurement', page: 'Goods Received Notes', action: 'Delete' },
    { module: 'Procurement', page: 'Payments', action: 'View' },
    { module: 'Procurement', page: 'Approval Configurations', action: 'Create' },
    { module: 'Procurement', page: 'Approval Configurations', action: 'Read' },
    { module: 'Procurement', page: 'Approval Configurations', action: 'Update' },
    { module: 'Procurement', page: 'Approval Configurations', action: 'Delete' },
    // Performance Module
    { module: 'Performance', page: 'Dashboard', action: 'View' },
    { module: 'Performance', page: 'Departments', action: 'View' },
    { module: 'Performance', page: 'KPIs', action: 'View' },
    { module: 'Performance', page: 'Goals', action: 'View' },
    { module: 'Performance', page: 'Goals', action: 'Create' },
    { module: 'Performance', page: 'Goals', action: 'Update' },
    { module: 'Performance', page: 'Goals', action: 'All Goals' },
    { module: 'Performance', page: 'Goals', action: 'Company Goals' },
    { module: 'Performance', page: 'Goals', action: 'Department Goals Views' },
    { module: 'Performance', page: 'Goals', action: 'Assign Goals' },
    { module: 'Performance', page: 'Goals', action: 'Roll-Up Data Calculator' },
    { module: 'Performance', page: 'Tasks', action: 'Department Task' },
    { module: 'Performance', page: 'Scorecards', action: 'Department Scorecards View' },
    { module: 'Performance', page: 'Scorecards', action: 'User Scorecards View' },
    // Accounting Module
    { module: 'Accounting', page: 'Dashboard', action: 'View' },
    { module: 'Accounting', page: 'General Ledger', action: 'Create Journal Entry' },
    { module: 'Accounting', page: 'Cash Book', action: 'View' },
    { module: 'Accounting', page: 'Cash Book', action: 'Process Cashbook' },
    { module: 'Accounting', page: 'Accounts Receivable: Invoices', action: 'View' },
    { module: 'Accounting', page: 'Accounts Receivable: Invoices', action: 'Create' },
    { module: 'Accounting', page: 'Accounts Receivable: Invoices', action: 'Read' },
    { module: 'Accounting', page: 'Accounts Receivable: Invoices', action: 'Update' },
    { module: 'Accounting', page: 'Accounts Receivable: Invoices', action: 'Delete' },
    { module: 'Accounting', page: 'Accounts Receivable: Invoices', action: 'Mark as Paid' },
    { module: 'Accounting', page: 'Accounts Receivable: Credit Notes', action: 'View' },
    { module: 'Accounting', page: 'Accounts Receivable: Credit Notes', action: 'Create' },
    { module: 'Accounting', page: 'Accounts Receivable: Credit Notes', action: 'Read' },
    { module: 'Accounting', page: 'Accounts Receivable: Credit Notes', action: 'Update' },
    { module: 'Accounting', page: 'Accounts Receivable: Credit Notes', action: 'Delete' },
    { module: 'Accounting', page: 'Accounts Payable', action: 'Purchase Order Create' },
    { module: 'Accounting', page: 'Accounts Payable', action: 'Purchase Order View' },
    { module: 'Accounting', page: 'Bank Reconciliation', action: 'View' },
    { module: 'Accounting', page: 'Bank Reconciliation', action: 'Upload Statement' },
    { module: 'Accounting', page: 'Expenses', action: 'View' },
    { module: 'Accounting', page: 'Expenses', action: 'Create' },
    { module: 'Accounting', page: 'Expenses', action: 'Read' },
    { module: 'Accounting', page: 'Expenses', action: 'Update' },
    { module: 'Accounting', page: 'Expenses', action: 'Delete' },
    { module: 'Accounting', page: 'Inventory', action: 'View' },
    { module: 'Accounting', page: 'Inventory', action: 'Create' },
    { module: 'Accounting', page: 'Inventory', action: 'Read' },
    { module: 'Accounting', page: 'Inventory', action: 'Update' },
    { module: 'Accounting', page: 'Inventory', action: 'Delete' },
    { module: 'Accounting', page: 'Asset Management', action: 'View' },
    { module: 'Accounting', page: 'Asset Management', action: 'Create' },
    { module: 'Accounting', page: 'Asset Management', action: 'Read' },
    { module: 'Accounting', page: 'Asset Management', action: 'Update' },
    { module: 'Accounting', page: 'Asset Management', action: 'Delete' },
    { module: 'Accounting', page: 'Asset Management', action: 'Dispose' },
    { module: 'Accounting', page: 'Asset Management', action: 'Revalue' },
    { module: 'Accounting', page: 'Asset Management', action: 'Calc Depreciation' },
    { module: 'Accounting', page: 'Financial Reports', action: 'Income Statement' },
    { module: 'Accounting', page: 'Financial Reports', action: 'Balance Sheet' },
    { module: 'Accounting', page: 'Financial Reports', action: 'Cashflow' },
    { module: 'Accounting', page: 'Settings: Currencies', action: 'Create' },
    { module: 'Accounting', page: 'Settings: Currencies', action: 'Read' },
    { module: 'Accounting', page: 'Settings: Currencies', action: 'Update' },
    { module: 'Accounting', page: 'Settings: Currencies', action: 'Delete' },
    { module: 'Accounting', page: 'Settings: Exchange Rates', action: 'Create' },
    { module: 'Accounting', page: 'Settings: Exchange Rates', action: 'Read' },
    { module: 'Accounting', page: 'Settings: Exchange Rates', action: 'Update' },
    { module: 'Accounting', page: 'Settings: Exchange Rates', action: 'Delete' },
    { module: 'Accounting', page: 'Settings: Chart of Accounts', action: 'Create' },
    { module: 'Accounting', page: 'Settings: Chart of Accounts', action: 'Read' },
    { module: 'Accounting', page: 'Settings: Chart of Accounts', action: 'Update' },
    { module: 'Accounting', page: 'Settings: Chart of Accounts', action: 'Delete' },
    { module: 'Accounting', page: 'Settings: Customers', action: 'Create' },
    { module: 'Accounting', page: 'Settings: Customers', action: 'Read' },
    { module: 'Accounting', page: 'Settings: Customers', action: 'Update' },
    { module: 'Accounting', page: 'Settings: Customers', action: 'Delete' },
    { module: 'Accounting', page: 'Settings: Vendors', action: 'Create' },
    { module: 'Accounting', page: 'Settings: Vendors', action: 'Read' },
    { module: 'Accounting', page: 'Settings: Vendors', action: 'Update' },
    { module: 'Accounting', page: 'Settings: Vendors', action: 'Delete' },
    { module: 'Accounting', page: 'Settings: Expense Categories', action: 'Create' },
    { module: 'Accounting', page: 'Settings: Expense Categories', action: 'Read' },
    { module: 'Accounting', page: 'Settings: Expense Categories', action: 'Update' },
    { module: 'Accounting', page: 'Settings: Expense Categories', action: 'Delete' },
];

export default function PermissionsMatrix() {
    const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoaded, setIsLoaded] = useState(false);
    const [scrollPos, setScrollPos] = useState({ current: 1, total: 1 });
    const [collapsedModules, setCollapsedModules] = useState<Set<string>>(new Set());
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Load from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('permissions_matrix');
        if (saved) {
            try {
                setMatrix(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse saved matrix', e);
            }
        }
        setIsLoaded(true);
    }, []);

    // Update scroll info
    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            // Calculate 'pages' based on clientWidth (roughly how many roles fit in view)
            const pageCount = Math.ceil(scrollWidth / clientWidth) || 1;
            const currentPage = Math.round(scrollLeft / clientWidth) + 1;
            setScrollPos({ current: currentPage, total: pageCount });
        }
    };

    useEffect(() => {
        handleScroll(); // Initialize
    }, [isLoaded]);

    // Save to localStorage
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('permissions_matrix', JSON.stringify(matrix));
        }
    }, [matrix, isLoaded]);

    const togglePermission = (rowId: string, role: string) => {
        setMatrix(prev => ({
            ...prev,
            [rowId]: {
                ...(prev[rowId] || {}),
                [role]: !prev[rowId]?.[role]
            }
        }));
    };

    const toggleModule = (module: string) => {
        setCollapsedModules(prev => {
            const next = new Set(prev);
            if (next.has(module)) next.delete(module);
            else next.add(module);
            return next;
        });
    };

    const expandAll = () => setCollapsedModules(new Set());
    const collapseAll = () => setCollapsedModules(new Set([...new Set(INITIAL_ROWS.map(r => r.module))]));

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 400;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const exportJson = () => {
        const data = INITIAL_ROWS.map((row) => {
            const rowId = `${row.module}-${row.page}-${row.action}`;
            const rowPermissions = matrix[rowId] || {};
            const roles = ROLES.filter(role => rowPermissions[role]);
            return {
                ...row,
                roles
            };
        });

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `permissions-matrix-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const clearMatrix = () => {
        if (confirm('Are you sure you want to clear all permissions? This cannot be undone.')) {
            setMatrix({});
        }
    };

    const groupedRows = useMemo(() => {
        const filtered = INITIAL_ROWS.filter(row =>
            row.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
            row.page.toLowerCase().includes(searchTerm.toLowerCase()) ||
            row.action.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const groups: Record<string, typeof INITIAL_ROWS> = {};
        filtered.forEach(row => {
            if (!groups[row.module]) groups[row.module] = [];
            groups[row.module].push(row);
        });
        return groups;
    }, [searchTerm]);

    if (!isLoaded) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-900">Loading...</div>;

    const modules = Object.keys(groupedRows);

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 flex flex-col">
            {/* Subtle Pattern Background */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
                style={{ backgroundImage: `radial-gradient(#4f46e5 0.5px, transparent 0.5px)`, backgroundSize: '24px 24px' }} />

            <div className="relative z-10 p-4 md:p-6 lg:p-8 flex-1 flex flex-col overflow-hidden">
                {/* Compressed Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all duration-300">
                    <div className="flex items-center gap-4">
                        <div className="p-1.5 bg-indigo-600 rounded-lg">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">
                                Permissions Matrix
                            </h1>
                            <p className="text-slate-500 text-xs font-medium mt-1">
                                Configure roles. Auto-saved to browser.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative w-full md:w-64 mr-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-xs font-medium"
                            />
                        </div>

                        <div className="flex items-center bg-slate-100 p-1 rounded-lg mr-2">
                            <button
                                onClick={expandAll}
                                className="px-2 py-1 text-[10px] font-bold text-slate-600 hover:text-indigo-600 transition-colors uppercase"
                            >
                                Expand All
                            </button>
                            <span className="text-slate-300 mx-1">|</span>
                            <button
                                onClick={collapseAll}
                                className="px-2 py-1 text-[10px] font-bold text-slate-600 hover:text-indigo-600 transition-colors uppercase"
                            >
                                Collapse All
                            </button>
                        </div>

                        <button
                            onClick={clearMatrix}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all font-bold text-xs"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Clear
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="px-3 py-1.5 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all font-bold text-xs shadow-sm"
                        >
                            Print
                        </button>
                        <button
                            onClick={exportJson}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-600/10 transition-all font-bold text-xs active:scale-95 group"
                        >
                            <FileJson className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                            Export JSON
                        </button>
                    </div>
                </header>

                {/* Table Container Section - Maximized */}
                <div className="relative flex-1 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl shadow-slate-200/50 flex flex-col">
                    {/* Legend Toolbar */}
                    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-white z-20">
                        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500">
                            <div className="flex items-center gap-1.5">
                                <div className="w-4 h-4 rounded bg-emerald-100 flex items-center justify-center border border-emerald-200">
                                    <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[3px]" />
                                </div>
                                ALLOWED
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-400">
                                <div className="w-4 h-4 rounded bg-slate-50 border border-slate-200 flex items-center justify-center">
                                    <X className="w-2.5 h-2.5 text-slate-300" />
                                </div>
                                DENIED
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => scroll('left')}
                                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                                    title="Scroll Roles Left"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <div className="flex flex-col items-center min-w-[80px]">
                                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-tighter">Navigate Roles</span>
                                    <span className="text-[10px] font-black text-indigo-600 tabular-nums">Page {scrollPos.current} of {scrollPos.total}</span>
                                </div>
                                <button
                                    onClick={() => scroll('right')}
                                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                                    title="Scroll Roles Right"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div
                        ref={scrollContainerRef}
                        onScroll={handleScroll}
                        className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar scroll-smooth"
                    >
                        <table className="w-full border-collapse text-[11px] text-left">
                            <thead className="sticky top-0 z-40">
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="sticky left-0 z-50 bg-slate-50 px-4 py-3 font-bold text-slate-900 min-w-[120px] shadow-[2px_0_10px_rgba(0,0,0,0.02)] border-r border-slate-200">Module / Page</th>
                                    <th className="sticky left-[120px] z-50 bg-slate-50 px-4 py-3 font-bold text-slate-900 min-w-[160px] shadow-[2px_0_10px_rgba(0,0,0,0.02)] border-r border-slate-200">
                                        <div className="flex items-center justify-between gap-2">
                                            <span>Action</span>
                                        </div>
                                    </th>
                                    {ROLES.map(role => (
                                        <th key={role} className="px-3 py-3 font-mono font-bold text-indigo-700 text-center min-w-[100px] hover:bg-slate-100 transition-colors tracking-tighter border-r border-slate-200">
                                            {role}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {modules.map((moduleName) => {
                                    const items = groupedRows[moduleName];
                                    const isCollapsed = collapsedModules.has(moduleName);
                                    return (
                                        <React.Fragment key={moduleName}>
                                            {/* Module Header Row */}
                                            <tr className="sticky top-[37px] z-30 group">
                                                <td colSpan={ROLES.length + 2} className="p-0 border-b border-slate-200 bg-slate-100/90 backdrop-blur-sm">
                                                    <button
                                                        onClick={() => toggleModule(moduleName)}
                                                        className="w-full text-left px-4 py-2 flex items-center gap-3 hover:bg-indigo-50 transition-colors"
                                                    >
                                                        {isCollapsed ? <ChevronRight className="w-4 h-4 text-indigo-600" /> : <ChevronDown className="w-4 h-4 text-indigo-600" />}
                                                        <span className="font-black text-slate-900 uppercase tracking-widest text-[10px]">{moduleName}</span>
                                                        <span className="text-[9px] font-bold text-slate-400 ml-1">({items.length} ACTIONS)</span>
                                                    </button>
                                                </td>
                                            </tr>
                                            {/* Action Rows */}
                                            {!isCollapsed && items.map((row) => {
                                                const rowId = `${row.module}-${row.page}-${row.action}`;
                                                return (
                                                    <tr key={rowId} className="hover:bg-slate-50/80 transition-colors group border-b border-slate-100">
                                                        <td className="sticky left-0 z-10 bg-white px-4 py-2 font-bold text-slate-500 group-hover:bg-slate-50 transition-colors whitespace-nowrap border-r border-slate-100">{row.page}</td>
                                                        <td className="sticky left-[120px] z-10 bg-white px-4 py-2 border-r border-slate-200 group-hover:bg-slate-50 transition-colors shadow-[2px_0_10px_rgba(0,0,0,0.02)]">
                                                            <div className="font-extrabold text-slate-900 group-hover:text-indigo-900 truncate leading-tight uppercase text-[9px] tracking-wide">{row.action}</div>
                                                        </td>
                                                        {ROLES.map(role => {
                                                            const isGranted = matrix[rowId]?.[role];
                                                            return (
                                                                <td
                                                                    key={role}
                                                                    className="p-1 cursor-pointer transition-all hover:bg-indigo-50/30 border-r border-slate-200"
                                                                    onClick={() => togglePermission(rowId, role)}
                                                                >
                                                                    <div className={`mx-auto w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ${isGranted
                                                                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 scale-100 font-bold border border-emerald-600'
                                                                        : 'bg-white text-slate-200 hover:text-slate-400 scale-90 group-hover:scale-100 border border-slate-100 group-hover:border-slate-300'
                                                                        }`}>
                                                                        {isGranted ? <Check className="w-4 h-4 stroke-[4px]" /> : <X className="w-3 h-3 opacity-30" />}
                                                                    </div>
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                );
                                            })}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="mt-4 flex items-center justify-between px-2">
                    <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold">
                        <Info className="w-3.5 h-3.5 text-indigo-500" />
                        <p className="uppercase tracking-wider">Configuring {ROLES.length} roles across {modules.length} modules</p>
                    </div>
                    <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                        v1.2 Grouped View
                    </div>
                </div>
            </div>

            <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f8fafc;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 20px;
          border: 2px solid #f8fafc;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
        @media print {
          .no-print { display: none; }
        }
      `}</style>
        </div>
    );
}
