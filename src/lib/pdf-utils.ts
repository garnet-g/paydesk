import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const loadImage = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'Anonymous'
        img.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = img.width
            canvas.height = img.height
            const ctx = canvas.getContext('2d')
            ctx?.drawImage(img, 0, 0)
            resolve(canvas.toDataURL('image/png'))
        }
        img.onerror = reject
        img.src = url
    })
}

/**
 * Safely converts Prisma Decimal / string / number to a plain number.
 * Prevents `.toLocaleString()` crashes on Decimal objects.
 */
function toNum(val: any): number {
    if (val === null || val === undefined) return 0
    if (typeof val === 'number') return val
    return parseFloat(val.toString())
}

/**
 * Formats a number as KES with commas. 
 * Handles negative amounts (credits/overpayments) gracefully.
 */
function kes(amount: any): string {
    const n = toNum(amount)
    const abs = Math.abs(n)
    const formatted = abs.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
    return n < 0 ? `(KES ${formatted})` : `KES ${formatted}`
}

// ==========================================================================
//  RECEIPT PDF
// ==========================================================================

export const generateReceiptPDF = async (payment: any, action: 'download' | 'print' = 'download') => {
    const doc = new jsPDF()
    const brandingColor = payment.school?.primaryColor || '#667eea'
    const rgb = hexToRgb(brandingColor) || [102, 126, 234]

    // ── School Logo ──────────────────────────────────────────────────────
    let headerY = 20
    if (payment.school?.logoUrl) {
        try {
            const logoBase64 = await loadImage(payment.school.logoUrl)
            doc.addImage(logoBase64, 'PNG', 105 - 15, 10, 30, 30, undefined, 'FAST')
            headerY = 45
        } catch (e) {
            console.error('Failed to load logo for PDF:', e)
        }
    }

    // ── School Header ────────────────────────────────────────────────────
    doc.setFontSize(22)
    doc.setTextColor(40, 44, 52)
    doc.text(payment.school?.name || 'PayDesk', 105, headerY, { align: 'center' })

    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(payment.school?.tagline || 'Official Payment Receipt', 105, headerY + 8, { align: 'center' })

    doc.setDrawColor(200)
    doc.line(20, headerY + 15, 190, headerY + 15)

    // ── RECEIPT badge ────────────────────────────────────────────────────
    doc.setFillColor(rgb[0], rgb[1], rgb[2])
    doc.roundedRect(150, headerY + 18, 40, 10, 2, 2, 'F')
    doc.setFontSize(9)
    doc.setTextColor(255, 255, 255)
    doc.text('RECEIPT', 170, headerY + 25, { align: 'center' })

    // ── Receipt Details (left column) ────────────────────────────────────
    doc.setFontSize(11)
    doc.setTextColor(0)
    doc.setFont('helvetica', 'bold')
    doc.text('Receipt Details', 20, headerY + 28)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const receiptData = [
        ['Receipt No:', payment.receiptNumber || payment.transactionRef || 'N/A'],
        ['Date:', payment.completedAt ? new Date(payment.completedAt).toLocaleString('en-KE') : new Date(payment.createdAt).toLocaleString('en-KE')],
        ['Payment Method:', formatMethod(payment.method)],
        ['Status:', payment.status || 'COMPLETED'],
    ]
    if (payment.transactionRef && payment.receiptNumber) {
        receiptData.push(['Transaction Ref:', payment.transactionRef])
    }

    let y = headerY + 35
    receiptData.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold')
        doc.text(label, 20, y)
        doc.setFont('helvetica', 'normal')
        doc.text(String(value || 'N/A'), 60, y)
        y += 6
    })

    // ── Student Info (right column) ──────────────────────────────────────
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('Student Information', 120, headerY + 28)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const studentName = [payment.student?.firstName, payment.student?.lastName].filter(Boolean).join(' ') || 'N/A'
    const studentData = [
        ['Name:', studentName],
        ['Adm No:', payment.student?.admissionNumber || 'N/A'],
        ['Class:', payment.student?.class?.name || 'N/A'],
        ['School:', payment.school?.name || 'N/A'],
    ]

    y = headerY + 35
    studentData.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold')
        doc.text(label, 120, y)
        doc.setFont('helvetica', 'normal')
        doc.text(String(value), 148, y)
        y += 6
    })

    // ── Transaction Table ────────────────────────────────────────────────
    const tableHead = [['#', 'Category', 'Description', 'Amount']]
    const tableBody: any[] = []

    if (payment.invoice?.items && payment.invoice.items.length > 0) {
        payment.invoice.items.forEach((item: any, idx: number) => {
            if (!item.isDismissed) {
                tableBody.push([
                    idx + 1,
                    item.category || 'OTHER',
                    item.description,
                    kes(item.amount)
                ])
            }
        })
    } else {
        tableBody.push([
            1,
            payment.method || 'GENERAL',
            `Fee Payment${payment.invoice?.invoiceNumber ? ` – ${payment.invoice.invoiceNumber}` : ''}`,
            kes(payment.amount)
        ])
    }

    const tableStartY = headerY + 68
    autoTable(doc, {
        startY: tableStartY,
        head: tableHead,
        body: tableBody,
        foot: [['', '', 'TOTAL PAID', kes(payment.amount)]],
        theme: 'striped',
        headStyles: { fillColor: rgb as any, fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 10 },
        columnStyles: {
            0: { cellWidth: 12 },
            3: { halign: 'right' }
        },
        margin: { left: 20, right: 20 }
    })

    // ── Footer ───────────────────────────────────────────────────────────
    const finalY = (doc as any).lastAutoTable?.finalY || 200
    const footerY = Math.max(finalY + 25, 240)

    doc.setDrawColor(200)
    doc.line(20, footerY - 5, 190, footerY - 5)

    doc.setFontSize(8)
    doc.setTextColor(130)
    doc.text('This is a computer-generated receipt and does not require a physical signature.', 105, footerY, { align: 'center' })
    doc.text(`Generated by ${payment.school?.name || 'PayDesk'} on ${new Date().toLocaleDateString('en-KE')}`, 105, footerY + 5, { align: 'center' })
    doc.text('For inquiries, contact the school\'s finance office.', 105, footerY + 10, { align: 'center' })

    // ── Output ───────────────────────────────────────────────────────────
    if (action === 'print') {
        doc.autoPrint()
        window.open(doc.output('bloburl'), '_blank')
    } else {
        doc.save(`Receipt_${payment.receiptNumber || payment.transactionRef || 'download'}.pdf`)
    }
}


// ==========================================================================
//  INVOICE PDF
// ==========================================================================

export const generateInvoicePDF = async (invoice: any, action: 'download' | 'print' = 'download') => {
    const doc = new jsPDF()
    const brandingColor = invoice.school?.primaryColor || '#1f2937'
    const rgb = hexToRgb(brandingColor) || [31, 41, 55]

    // ── Logo ─────────────────────────────────────────────────────────────
    let headerY = 20
    if (invoice.school?.logoUrl) {
        try {
            const logoBase64 = await loadImage(invoice.school.logoUrl)
            doc.addImage(logoBase64, 'PNG', 105 - 15, 10, 30, 30, undefined, 'FAST')
            headerY = 45
        } catch (e) {
            console.error('Failed to load logo for PDF:', e)
        }
    }

    // ── School Header ────────────────────────────────────────────────────
    doc.setFontSize(22)
    doc.setTextColor(40, 44, 52)
    doc.text(invoice.school?.name || 'PayDesk', 105, headerY, { align: 'center' })

    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text('OFFICIAL INVOICE', 105, headerY + 8, { align: 'center' })

    doc.setDrawColor(200)
    doc.line(20, headerY + 15, 190, headerY + 15)

    // ── Invoice Details (left column) ────────────────────────────────────
    doc.setFontSize(11)
    doc.setTextColor(0)
    doc.setFont('helvetica', 'bold')
    doc.text('Invoice Details', 20, headerY + 25)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const invData = [
        ['Invoice No:', invoice.invoiceNumber],
        ['Issue Date:', new Date(invoice.createdAt).toLocaleDateString('en-KE')],
        ['Due Date:', new Date(invoice.dueDate).toLocaleDateString('en-KE')],
        ['Status:', (invoice.status || '').replace(/_/g, ' ')],
    ]

    let y = headerY + 32
    invData.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold')
        doc.text(label, 20, y)
        doc.setFont('helvetica', 'normal')
        doc.text(String(value || 'N/A'), 58, y)
        y += 6
    })

    // ── Student Info (right column) ──────────────────────────────────────
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('Billed To', 120, headerY + 25)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const studentName = [invoice.student?.firstName, invoice.student?.lastName].filter(Boolean).join(' ') || 'N/A'
    const studentData = [
        ['Name:', studentName],
        ['Adm No:', invoice.student?.admissionNumber || 'N/A'],
        ['Term:', invoice.academicPeriod?.term?.replace(/_/g, ' ') || 'N/A'],
        ['Year:', invoice.academicPeriod?.academicYear || 'N/A'],
    ]

    y = headerY + 32
    studentData.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold')
        doc.text(label, 120, y)
        doc.setFont('helvetica', 'normal')
        doc.text(String(value), 148, y)
        y += 6
    })

    // ── Fetch billing summary for arrears context ────────────────────────
    let previousArrears = 0
    try {
        const summaryRes = await fetch(`/api/students/${invoice.studentId}/billing-summary`)
        if (summaryRes.ok) {
            const summary = await summaryRes.json()
            previousArrears = toNum(summary.overallBalance) - toNum(invoice.balance)
        }
    } catch (e) {
        console.error('Failed to fetch billing summary for PDF:', e)
    }

    // ── Fee Breakdown Table ──────────────────────────────────────────────
    const tableHead = [['#', 'Category', 'Description', 'Qty', 'Unit Price', 'Amount']]
    const tableBody: any[] = []

    if (invoice.items && invoice.items.length > 0) {
        let idx = 0
        invoice.items.forEach((item: any) => {
            if (!item.isDismissed) {
                idx++
                tableBody.push([
                    idx,
                    item.category || 'OTHER',
                    item.description,
                    item.quantity || 1,
                    kes(item.unitPrice || item.amount),
                    kes(item.amount)
                ])
            }
        })
    } else {
        tableBody.push([
            1,
            'TUITION',
            invoice.feeStructure?.name || 'School Fees',
            1,
            kes(invoice.totalAmount),
            kes(invoice.totalAmount)
        ])
    }

    const tableStartY = headerY + 62
    autoTable(doc, {
        startY: tableStartY,
        head: tableHead,
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: rgb as any, fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
            0: { cellWidth: 10 },
            3: { cellWidth: 12, halign: 'center' },
            4: { halign: 'right' },
            5: { halign: 'right' }
        },
        margin: { left: 20, right: 20 }
    })

    let cursorY = ((doc as any).lastAutoTable?.finalY || 200) + 10

    // ── Payment Summary (right-aligned block) ────────────────────────────
    const summaryX = 125
    const valueX = 190

    const drawLine = (label: string, amount: number, bold = false, color = [0, 0, 0]) => {
        doc.setFont('helvetica', bold ? 'bold' : 'normal')
        doc.setTextColor(color[0], color[1], color[2])
        doc.setFontSize(bold ? 10 : 9)
        doc.text(label, summaryX, cursorY)
        doc.text(kes(amount), valueX, cursorY, { align: 'right' })
        cursorY += 6
    }

    drawLine('Invoice Total:', toNum(invoice.totalAmount))
    drawLine('Amount Paid:', toNum(invoice.paidAmount), false, [22, 163, 74])

    if (previousArrears !== 0) {
        drawLine(
            previousArrears > 0 ? 'Arrears (B/F):' : 'Overpayment (B/F):',
            previousArrears,
            false,
            previousArrears > 0 ? [220, 38, 38] : [22, 163, 74]
        )
    }

    // Divider line
    doc.setDrawColor(180)
    doc.line(summaryX, cursorY - 2, valueX, cursorY - 2)
    cursorY += 4

    const totalOutstanding = previousArrears + toNum(invoice.balance)
    drawLine(
        'TOTAL OUTSTANDING:',
        totalOutstanding,
        true,
        totalOutstanding > 0 ? [220, 38, 38] : [22, 163, 74]
    )

    cursorY += 8

    // ── Payment Instructions ─────────────────────────────────────────────
    // Check if we need a new page
    if (cursorY > 240) {
        doc.addPage()
        cursorY = 20
    }

    doc.setTextColor(0)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Payment Instructions', 20, cursorY)
    cursorY += 8

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')

    if (invoice.school?.mpesaPaybill) {
        doc.setFont('helvetica', 'bold')
        doc.text('Option 1: M-Pesa Paybill', 20, cursorY)
        doc.setFont('helvetica', 'normal')
        doc.text(`Paybill Number: ${invoice.school.mpesaPaybill}`, 28, cursorY + 5)
        doc.text(`Account Number: ${invoice.invoiceNumber}`, 28, cursorY + 10)
        cursorY += 18
    }

    if (invoice.school?.bankName && invoice.school?.bankAccount) {
        doc.setFont('helvetica', 'bold')
        doc.text(`Option ${invoice.school?.mpesaPaybill ? '2' : '1'}: Bank Transfer`, 20, cursorY)
        doc.setFont('helvetica', 'normal')
        doc.text(`Bank: ${invoice.school.bankName}`, 28, cursorY + 5)
        doc.text(`A/C Name: ${invoice.school.bankAccountName || invoice.school.name}`, 28, cursorY + 10)
        doc.text(`A/C Number: ${invoice.school.bankAccount}`, 28, cursorY + 15)
        if (invoice.school.bankBranch) {
            doc.text(`Branch: ${invoice.school.bankBranch}`, 28, cursorY + 20)
            cursorY += 28
        } else {
            cursorY += 23
        }
    }

    if (!invoice.school?.mpesaPaybill && !invoice.school?.bankName) {
        doc.text('Please contact the school finance office for payment details.', 20, cursorY)
        cursorY += 8
    } else {
        doc.setFontSize(8)
        doc.setTextColor(100)
        doc.text(`Note: Use ${invoice.invoiceNumber} as your payment reference for all channels.`, 20, cursorY)
        cursorY += 8
    }

    // ── Footer ───────────────────────────────────────────────────────────
    const pageHeight = doc.internal.pageSize.getHeight()
    const footerY = Math.max(cursorY + 15, pageHeight - 15)

    doc.setFontSize(7)
    doc.setTextColor(150)
    doc.text('Thank you for your prompt payment.', 105, footerY - 5, { align: 'center' })
    doc.text(`Generated by ${invoice.school?.name || 'PayDesk'} on ${new Date().toLocaleDateString('en-KE')}`, 105, footerY, { align: 'center' })

    // ── Output ───────────────────────────────────────────────────────────
    if (action === 'print') {
        doc.autoPrint()
        window.open(doc.output('bloburl'), '_blank')
    } else {
        doc.save(`Invoice_${invoice.invoiceNumber}.pdf`)
    }
}


// ==========================================================================
//  FEE SCHEDULE PDF
// ==========================================================================

/**
 * Generates a school-wide official fee schedule document.
 * Shows fees grouped by class, with subtotals and payment instructions.
 * Typically printed and pinned at school notice boards or sent to parents at term start.
 *
 * @param school   School object (name, logoUrl, primaryColor, tagline, mpesaPaybill, bankName, etc.)
 * @param period   AcademicPeriod object (term, academicYear, startDate, endDate)
 * @param feeStructures  Array of fee structures with classId and class.name
 * @param action   'download' or 'print'
 */
export const generateFeeSchedulePDF = async (
    school: any,
    period: any,
    feeStructures: any[],
    action: 'download' | 'print' = 'download'
) => {
    const doc = new jsPDF()
    const brandingColor = school?.primaryColor || '#1f2937'
    const rgb = hexToRgb(brandingColor) || [31, 41, 55]

    // ── Coloured header banner ────────────────────────────────────────────
    doc.setFillColor(rgb[0], rgb[1], rgb[2])
    doc.rect(0, 0, 210, 38, 'F')

    // Logo in header
    if (school?.logoUrl) {
        try {
            const logoBase64 = await loadImage(school.logoUrl)
            doc.addImage(logoBase64, 'PNG', 8, 4, 28, 28, undefined, 'FAST')
        } catch (e) { /* skip if logo fails */ }
    }

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text(school?.name || 'PayDesk', 105, 16, { align: 'center' })

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(school?.tagline || 'Excellence in Education', 105, 24, { align: 'center' })

    // FEE SCHEDULE badge top-right
    doc.setFillColor(255, 255, 255)
    doc.setTextColor(rgb[0], rgb[1], rgb[2])
    doc.roundedRect(150, 8, 50, 12, 2, 2, 'F')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('FEE SCHEDULE', 175, 16, { align: 'center' })

    // ── Term Info ─────────────────────────────────────────────────────────
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    const termLabel = period?.term?.replace(/_/g, ' ') || 'Term'
    const yearLabel = period?.academicYear || new Date().getFullYear().toString()
    doc.text(`${termLabel} — ${yearLabel}`, 105, 50, { align: 'center' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(100)
    const startDate = period?.startDate ? new Date(period.startDate).toLocaleDateString('en-KE') : ''
    const endDate = period?.endDate ? new Date(period.endDate).toLocaleDateString('en-KE') : ''
    if (startDate && endDate) {
        doc.text(`Term Period: ${startDate} – ${endDate}`, 105, 56, { align: 'center' })
    }
    doc.text(`Issued: ${new Date().toLocaleDateString('en-KE')}`, 105, 61, { align: 'center' })

    doc.setDrawColor(200)
    doc.line(20, 64, 190, 64)

    // ── Fee Tables grouped by class ───────────────────────────────────────
    // Group fee structures by classId (null = applies to all classes)
    const grouped: Record<string, any[]> = {}
    feeStructures.forEach(fs => {
        const key = fs.classId ? (fs.class?.name || fs.classId) : '__ALL__'
        if (!grouped[key]) grouped[key] = []
        grouped[key].push(fs)
    })

    let cursorY = 70
    const classes = Object.keys(grouped).sort((a, b) => a === '__ALL__' ? -1 : b === '__ALL__' ? 1 : a.localeCompare(b))

    classes.forEach((classKey, idx) => {
        const fees = grouped[classKey]
        const classLabel = classKey === '__ALL__' ? 'All Classes (General)' : classKey
        const classTotal = fees.reduce((sum: number, f: any) => sum + toNum(f.amount), 0)

        if (cursorY > 240) {
            doc.addPage()
            cursorY = 20
        }

        // Class label
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(rgb[0], rgb[1], rgb[2])
        doc.text(classLabel, 20, cursorY)
        cursorY += 5

        autoTable(doc, {
            startY: cursorY,
            head: [['#', 'Fee Component', 'Category', 'Amount (KES)']],
            body: fees.map((f: any, i: number) => [
                i + 1,
                f.name,
                (f.category || 'GENERAL').replace(/_/g, ' '),
                kes(f.amount)
            ]),
            foot: [['', '', 'TOTAL', kes(classTotal)]],
            theme: 'striped',
            headStyles: { fillColor: rgb as any, fontSize: 8 },
            bodyStyles: { fontSize: 8 },
            footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
            columnStyles: { 0: { cellWidth: 12 }, 3: { halign: 'right' } },
            margin: { left: 20, right: 20 }
        })

        cursorY = ((doc as any).lastAutoTable?.finalY || cursorY) + 10
    })

    // ── Payment Instructions ──────────────────────────────────────────────
    if (cursorY > 230) { doc.addPage(); cursorY = 20 }

    cursorY += 5
    doc.setDrawColor(200)
    doc.line(20, cursorY - 3, 190, cursorY - 3)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(0)
    doc.text('Payment Instructions', 20, cursorY + 4)
    cursorY += 11

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)

    if (school?.mpesaPaybill) {
        doc.setFont('helvetica', 'bold')
        doc.text('M-Pesa Paybill:', 20, cursorY)
        doc.setFont('helvetica', 'normal')
        doc.text(`Paybill: ${school.mpesaPaybill}   |   Account: [Student Invoice Number]`, 60, cursorY)
        cursorY += 7
    }

    if (school?.bankName && school?.bankAccount) {
        doc.setFont('helvetica', 'bold')
        doc.text('Bank Transfer:', 20, cursorY)
        doc.setFont('helvetica', 'normal')
        doc.text(`${school.bankName}  –  A/C: ${school.bankAccount}  (${school.bankAccountName || school.name})${school.bankBranch ? `  –  ${school.bankBranch}` : ''}`, 60, cursorY)
        cursorY += 7
    }

    if (!school?.mpesaPaybill && !school?.bankName) {
        doc.text('Please contact the school administration for payment details.', 20, cursorY)
        cursorY += 7
    }

    // ── Authorisation ─────────────────────────────────────────────────────
    cursorY += 12
    if (cursorY > 255) { doc.addPage(); cursorY = 20 }

    doc.setDrawColor(0)
    doc.line(20, cursorY, 80, cursorY)
    doc.line(120, cursorY, 190, cursorY)
    doc.setFontSize(8)
    doc.setTextColor(100)
    doc.text("Principal's Signature", 50, cursorY + 5, { align: 'center' })
    doc.text("School Stamp", 155, cursorY + 5, { align: 'center' })

    // ── Footer ────────────────────────────────────────────────────────────
    doc.setFontSize(7)
    doc.setTextColor(160)
    const pageH = doc.internal.pageSize.getHeight()
    doc.text(`${school?.name || 'PayDesk'} — Official Fee Schedule — ${termLabel} ${yearLabel}`, 105, pageH - 8, { align: 'center' })

    // ── Output ────────────────────────────────────────────────────────────
    const filename = `FeeSchedule_${yearLabel}_${termLabel.replace(/\s/g, '')}.pdf`
    if (action === 'print') {
        doc.autoPrint()
        window.open(doc.output('bloburl'), '_blank')
    } else {
        doc.save(filename)
    }
}




function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : null
}

function formatMethod(method: string): string {
    const map: Record<string, string> = {
        'MPESA': 'M-Pesa',
        'BANK_TRANSFER': 'Bank Transfer',
        'CASH': 'Cash',
        'CARD': 'Card Payment',
        'CHEQUE': 'Cheque',
        'MPESA_DIRECT': 'M-Pesa (Direct)',
    }
    return map[method] || method
}
