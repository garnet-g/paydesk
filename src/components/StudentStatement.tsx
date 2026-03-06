'use client'

import { useState, useEffect } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Download, Printer, Plus, X, History as HistoryIcon, Wallet } from 'lucide-react'
import { useSession } from 'next-auth/react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog'

interface StudentStatementProps {
    studentId: string
}

export default function StudentStatement({ studentId }: StudentStatementProps) {
    const { data: session } = useSession()
    const [statement, setStatement] = useState<any[]>([])
    const [student, setStudent] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [showFeeModal, setShowFeeModal] = useState(false)
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (studentId) fetchStatement()
    }, [studentId])

    const fetchStatement = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/students/${studentId}/statement`)
            if (res.ok) {
                const data = await res.json()
                setStatement(data.statement)
                setStudent(data.student)
            }
        } catch (error) {
            console.error('Failed to fetch statement', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddFee = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)

        const formData = new FormData(e.currentTarget)
        const data = {
            description: formData.get('description'),
            amount: formData.get('amount'),
            category: formData.get('category')
        }

        try {
            const res = await fetch(`/api/students/${studentId}/fees`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            if (res.ok) {
                setShowFeeModal(false)
                fetchStatement() // Refresh data
            } else {
                const err = await res.text()
                alert(`Failed to add fee: ${err}`)
            }
        } catch (error) {
            console.error('Error adding fee:', error)
            alert('An error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleRecordPayment = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)

        const formData = new FormData(e.currentTarget)
        const data = {
            studentId,
            amount: formData.get('amount'),
            method: formData.get('method'),
            description: formData.get('description'),
            transactionRef: formData.get('transactionRef'),
            date: formData.get('date')
        }

        try {
            const res = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            if (res.ok) {
                setShowPaymentModal(false)
                fetchStatement() // Refresh data
            } else {
                const err = await res.text()
                alert(`Failed to record payment: ${err}`)
            }
        } catch (error) {
            console.error('Error recording payment:', error)
            alert('An error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDownloadPDF = () => {
        if (!student || !statement) return

        const doc = new jsPDF()
        const primaryColor = student.school?.primaryColor || '#4f46e5'
        const hexToRgb = (hex: string) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
            return result ? [
                parseInt(result[1], 16),
                parseInt(result[2], 16),
                parseInt(result[3], 16)
            ] : [79, 70, 229]
        }
        const rgb = hexToRgb(primaryColor)

        // Header Rect
        doc.setFillColor(rgb[0], rgb[1], rgb[2])
        doc.rect(0, 0, 210, 40, 'F')

        // School Name & Contact
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(22)
        doc.setFont('helvetica', 'bold')
        doc.text(student.school?.name || student.schoolName || 'School Statement', 20, 25)

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        if (student.school?.tagline) {
            doc.text(student.school.tagline, 20, 32)
        }

        // Statement Title
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(18)
        doc.text('Financial Statement', 20, 55)

        // Student Info Box
        doc.setDrawColor(200, 200, 200)
        doc.line(20, 60, 190, 60)

        doc.setFontSize(10)
        doc.text(`Student: ${student.name}`, 20, 70)
        doc.text(`Admission No: ${student.admissionNumber}`, 20, 75)
        doc.text(`Class: ${student.class?.name || 'N/A'} ${student.class?.stream || ''}`, 20, 80)

        // Date generated
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 140, 70)
        const balance = statement[statement.length - 1]?.runningBalance || 0
        doc.setFont('helvetica', 'bold')
        doc.text(`Net Balance: KES ${balance.toLocaleString()}`, 140, 80)

        // Table
        const tableData = statement.map(tx => [
            formatDate(tx.date),
            tx.description + (tx.details ? ` - ${tx.details}` : ''),
            tx.type === 'INVOICE' ? formatCurrency(Math.abs(tx.amount)) : '-',
            tx.type === 'PAYMENT' ? formatCurrency(Math.abs(tx.amount)) : '-',
            formatCurrency(tx.runningBalance)
        ])

        autoTable(doc, {
            startY: 90,
            head: [['Date', 'Description', 'Debit (+)', 'Credit (-)', 'Balance']],
            body: tableData,
            headStyles: { fillColor: rgb as any },
            alternateRowStyles: { fillColor: [245, 247, 255] },
            margin: { left: 20, right: 20 }
        })

        // Footer
        const finalY = ((doc as any).lastAutoTable?.finalY || 220) + 15
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text('This is a computer-generated statement and does not require a signature.', 105, finalY, { align: 'center' })
        doc.text(`Generated by ${student.school?.name || student.schoolName || 'PayDesk'} on ${new Date().toLocaleDateString('en-KE')}`, 105, finalY + 5, { align: 'center' })

        doc.save(`${student.admissionNumber}_statement.pdf`)
    }

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    )

    if (!statement || statement.length === 0) {
        return (
            <div className="card rounded-[2.5rem] p-12 text-center flex flex-col items-center gap-6">
                <div className="h-20 w-20 bg-muted/5 rounded-full flex items-center justify-center">
                    <HistoryIcon size={40} className="text-muted-foreground opacity-20" />
                </div>
                <div className="space-y-2">
                    <p className="text-lg font-outfit font-semibold text-foreground">Zero Liquidity History</p>
                    <p className="text-muted-foreground text-sm max-w-xs">No financial audit records exist for this student profile yet.</p>
                </div>
                {(session?.user?.role === 'PRINCIPAL' || session?.user?.role === 'SUPER_ADMIN') && (
                    <button
                        className="h-12 px-8 bg-primary text-primary-foreground rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all"
                        onClick={() => setShowFeeModal(true)}
                    >
                        Initialize Ledger
                    </button>
                )}
            </div>
        )
    }

    const currentBalance = statement[statement.length - 1]?.runningBalance || 0

    return (
        <div className="flex flex-col gap-8 animate-in fade-in duration-700">
            {/* Header / Summary Card */}
            <div className="card rounded-[2.5rem] bg-primary text-primary-foreground p-10 flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl">
                <div className="flex items-center gap-6">
                    <div className="h-20 w-20 bg-white/10 rounded-[2rem] flex items-center justify-center backdrop-blur-md">
                        <Wallet size={36} className="text-white" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-3xl font-outfit font-bold tracking-tight">Audit Ledger</h2>
                        <p className="text-white/60 text-sm font-medium uppercase tracking-[0.2em]">{student.name} • ADM-{student.admissionNumber}</p>
                    </div>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 px-10 rounded-[2rem] text-center md:text-right min-w-[240px]">
                    <p className="text-[10px] uppercase font-black tracking-[0.3em] text-white/40 mb-1">Settlement Status</p>
                    <h3 className={`text-4xl font-outfit font-black tracking-tighter ${currentBalance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {formatCurrency(currentBalance)}
                    </h3>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-muted/5 p-4 rounded-[2rem] border border-border">
                <div className="flex gap-3">
                    {(session?.user?.role === 'PRINCIPAL' || session?.user?.role === 'SUPER_ADMIN') && (
                        <>
                            <button
                                className="h-12 px-6 bg-primary text-primary-foreground rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all active:scale-95"
                                onClick={() => setShowPaymentModal(true)}
                            >
                                <Plus size={16} className="mr-2 inline" /> Record Credit
                            </button>
                            <button
                                className="h-12 px-6 bg-background border border-border text-foreground rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-muted/50 transition-all active:scale-95"
                                onClick={() => setShowFeeModal(true)}
                            >
                                <Plus size={16} className="mr-2 inline" /> Add Debit
                            </button>
                        </>
                    )}
                </div>
                <div className="flex gap-3">
                    <button
                        className="h-12 px-5 bg-muted/10 border border-border text-foreground/70 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-muted/20 transition-all"
                        onClick={() => window.print()}
                    >
                        <Printer size={16} className="mr-2 inline" /> Print
                    </button>
                    <button
                        className="h-12 px-5 bg-muted/10 border border-border text-foreground/70 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-muted/20 transition-all"
                        onClick={handleDownloadPDF}
                    >
                        <Download size={16} className="mr-2 inline" /> Export PDF
                    </button>
                </div>
            </div>

            {/* Ledger Table */}
            <div className="card rounded-[2.5rem] overflow-hidden border-border p-0 shadow-xl bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-muted/5 border-b border-border">
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Verification Date</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Transaction Details</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right">Debit (+)</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right">Credit (-)</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right">Ledger Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {statement.map((tx, idx) => (
                                <tr key={idx} className="hover:bg-muted/5 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-foreground font-inter">{formatDate(tx.date)}</span>
                                            <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">{tx.type}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm font-semibold text-foreground tracking-tight italic">
                                                {tx.description}
                                            </span>
                                            {tx.details && (
                                                <span className="text-xs text-muted-foreground opacity-60 font-medium">
                                                    Ref: {tx.details}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <span className={`text-sm font-bold font-inter ${tx.type === 'INVOICE' ? 'text-foreground' : 'text-muted-foreground/20'}`}>
                                            {tx.type === 'INVOICE' ? formatCurrency(Math.abs(tx.amount)) : '—'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <span className={`text-sm font-bold font-inter ${tx.type === 'PAYMENT' ? 'text-emerald-600' : 'text-muted-foreground/20'}`}>
                                            {tx.type === 'PAYMENT' ? `- ${formatCurrency(Math.abs(tx.amount))}` : '—'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className={`text-sm font-black font-inter ${tx.runningBalance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                                {formatCurrency(tx.runningBalance)}
                                            </span>
                                            <div className="h-1 w-8 rounded-full bg-border group-hover:bg-primary/20 transition-all mt-1" />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-8 bg-muted/5 border-t border-border flex justify-center">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.25em] opacity-40">
                        Official Audited Statement • End of Records
                    </p>
                </div>
            </div>

            {/* Manual Fee Modal */}
            <Dialog open={showFeeModal} onOpenChange={setShowFeeModal}>
                <DialogContent className="max-w-xl p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
                    <DialogHeader className="p-10 pb-0 bg-primary text-primary-foreground rounded-t-[2.5rem]">
                        <div className="flex justify-between items-start">
                            <div className="space-y-2">
                                <DialogTitle className="text-3xl font-outfit font-bold tracking-tight italic">Inject Debit</DialogTitle>
                                <DialogDescription className="text-white/60 text-sm font-medium uppercase tracking-widest">Manual Fee Adjustment</DialogDescription>
                            </div>
                            <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                <Plus className="text-white" size={24} />
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleAddFee} className="p-10 space-y-8 bg-card">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Ledger Description</label>
                                <input name="description" required className="h-14 w-full bg-muted/5 border border-border px-5 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="e.g. Field Trip" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Asset Value (KES)</label>
                                <input name="amount" type="number" step="0.01" required className="h-14 w-full bg-muted/5 border border-border px-5 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="0.00" />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Classification Hub</label>
                            <select name="category" className="h-14 w-full bg-muted/5 border border-border px-5 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none cursor-pointer">
                                <option value="OTHER">Generic Adjustment</option>
                                <option value="TUITION">Academic Tuition</option>
                                <option value="BOARDING">Residential Services</option>
                                <option value="TRANSPORT">Logistical Transit</option>
                                <option value="TRIPS">External Expeditions</option>
                                <option value="UNIFORMS">Apparel Hub</option>
                                <option value="BOOKS">Resource Materials</option>
                                <option value="ACTIVITIES">Extracurricular Hub</option>
                            </select>
                        </div>

                        <DialogFooter className="pt-8 border-t border-border flex items-center justify-between gap-4">
                            <button type="button" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted/50 h-14 px-8 rounded-2xl transition-all" onClick={() => setShowFeeModal(false)}>Abandon</button>
                            <button
                                type="submit"
                                className="h-14 px-10 bg-primary text-primary-foreground rounded-2xl font-bold text-sm shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center justify-center"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'SYNCHRONIZING...' : 'COMMIT DEBIT'}
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Manual Payment Modal */}
            <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
                <DialogContent className="max-w-xl p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
                    <DialogHeader className="p-10 pb-0 bg-primary text-primary-foreground rounded-t-[2.5rem]">
                        <div className="flex justify-between items-start">
                            <div className="space-y-2">
                                <DialogTitle className="text-3xl font-outfit font-bold tracking-tight italic">Authorize Credit</DialogTitle>
                                <DialogDescription className="text-white/60 text-sm font-medium uppercase tracking-widest">Manual Inflow Registry</DialogDescription>
                            </div>
                            <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                <Wallet className="text-white" size={24} />
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleRecordPayment} className="p-10 space-y-8 bg-card">
                        <div className="space-y-3">
                            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Inflow Value (KES)</label>
                            <input name="amount" type="number" step="0.01" required className="h-14 w-full bg-muted/5 border border-border px-5 rounded-2xl text-xl font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="0.00" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Credit Channel</label>
                                <select name="method" className="h-14 w-full bg-muted/5 border border-border px-5 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none cursor-pointer" required>
                                    <option value="CASH">Physical Cash</option>
                                    <option value="BANK_TRANSFER">Bank Settlement</option>
                                    <option value="MPESA">Digital Payload</option>
                                    <option value="CHEQUE">Bank Instrument</option>
                                </select>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Accounting Date</label>
                                <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="h-14 w-full bg-muted/5 border border-border px-5 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Verification Reference</label>
                            <input name="transactionRef" className="h-14 w-full bg-muted/5 border border-border px-5 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="Bank ref, Cheque no, etc." />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Audit Notes</label>
                            <textarea name="description" className="h-24 w-full bg-muted/5 border border-border p-5 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none" placeholder="Any additional details..." />
                        </div>

                        <DialogFooter className="pt-8 border-t border-border flex items-center justify-between gap-4">
                            <button type="button" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted/50 h-14 px-8 rounded-2xl transition-all" onClick={() => setShowPaymentModal(false)}>Abandon</button>
                            <button
                                type="submit"
                                className="h-14 px-10 bg-primary text-primary-foreground rounded-2xl font-bold text-sm shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center justify-center"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'SYNCHRONIZING...' : 'COMMIT CREDIT'}
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
