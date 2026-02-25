import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import { PDFDocument } from 'pdf-lib'

/**
 * Safely converts Prisma Decimal / string / number to a plain JS number.
 */
function toNum(val: any): number {
    if (val === null || val === undefined) return 0
    if (typeof val === 'number') return val
    return parseFloat(val.toString())
}

function kes(amount: any): string {
    const n = toNum(amount)
    return `KES ${Math.abs(n).toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
        ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
        : [31, 41, 55]
}

/**
 * Server-side invoice PDF generation — used for batch exports.
 * Mirrors the quality of the client-side pdf-utils.ts version.
 */
export async function generateInvoicePDFBuffer(invoice: any): Promise<ArrayBuffer> {
    const doc = new jsPDF() as any
    const rgb = hexToRgb(invoice.school?.primaryColor || '#1f2937')

    // ── Header ───────────────────────────────────────────────────────────
    doc.setFontSize(22)
    doc.setTextColor(40, 44, 52)
    doc.text(invoice.school?.name || 'PayDesk', 105, 20, { align: 'center' })

    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text('OFFICIAL INVOICE', 105, 28, { align: 'center' })

    doc.setDrawColor(200)
    doc.line(20, 33, 190, 33)

    // ── Invoice Details (left) ────────────────────────────────────────────
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0)
    doc.text('Invoice Details', 20, 43)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    let y = 50
    const invData = [
        ['Invoice No:', invoice.invoiceNumber],
        ['Issue Date:', new Date(invoice.createdAt).toLocaleDateString('en-KE')],
        ['Due Date:', new Date(invoice.dueDate).toLocaleDateString('en-KE')],
        ['Status:', (invoice.status || '').replace(/_/g, ' ')],
    ]
    invData.forEach(([lbl, val]) => {
        doc.setFont('helvetica', 'bold')
        doc.text(lbl, 20, y)
        doc.setFont('helvetica', 'normal')
        doc.text(String(val || 'N/A'), 55, y)
        y += 6
    })

    // ── Student Info (right) ──────────────────────────────────────────────
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('Billed To', 120, 43)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    y = 50
    const studentName = [invoice.student?.firstName, invoice.student?.lastName].filter(Boolean).join(' ') || 'N/A'
    const studentData = [
        ['Name:', studentName],
        ['Adm No:', invoice.student?.admissionNumber || 'N/A'],
        ['Term:', invoice.academicPeriod?.term?.replace(/_/g, ' ') || 'N/A'],
        ['Year:', invoice.academicPeriod?.academicYear || 'N/A'],
    ]
    studentData.forEach(([lbl, val]) => {
        doc.setFont('helvetica', 'bold')
        doc.text(lbl, 120, y)
        doc.setFont('helvetica', 'normal')
        doc.text(String(val), 147, y)
        y += 6
    })

    // ── Fee Items Table ───────────────────────────────────────────────────
    const tableHead = [['#', 'Category', 'Description', 'Amount']]
    const tableBody: any[] = []

    if (invoice.items && invoice.items.length > 0) {
        invoice.items.forEach((item: any, idx: number) => {
            if (!item.isDismissed) {
                tableBody.push([idx + 1, item.category || 'OTHER', item.description, kes(item.amount)])
            }
        })
    } else {
        tableBody.push([1, 'TUITION', invoice.feeStructure?.name || 'School Fees', kes(invoice.totalAmount)])
    }

    doc.autoTable({
        startY: 78,
        head: tableHead,
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: rgb, fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        columnStyles: { 0: { cellWidth: 12 }, 3: { halign: 'right' } },
        margin: { left: 20, right: 20 }
    })

    let cursorY = doc.lastAutoTable.finalY + 10

    // ── Summary ───────────────────────────────────────────────────────────
    const valueX = 190
    const labelX = 125

    const drawSumLine = (label: string, amount: number, bold = false, color = [0, 0, 0]) => {
        doc.setFont('helvetica', bold ? 'bold' : 'normal')
        doc.setTextColor(color[0], color[1], color[2])
        doc.setFontSize(bold ? 10 : 9)
        doc.text(label, labelX, cursorY)
        doc.text(kes(amount), valueX, cursorY, { align: 'right' })
        cursorY += 6
    }

    drawSumLine('Invoice Total:', toNum(invoice.totalAmount))
    drawSumLine('Amount Paid:', toNum(invoice.paidAmount), false, [22, 163, 74])
    doc.setDrawColor(180)
    doc.line(labelX, cursorY - 2, valueX, cursorY - 2)
    cursorY += 4
    const balance = toNum(invoice.balance)
    drawSumLine('BALANCE DUE:', balance, true, balance > 0 ? [220, 38, 38] : [22, 163, 74])
    cursorY += 8

    // ── Payment Instructions ──────────────────────────────────────────────
    if (cursorY > 240) { doc.addPage(); cursorY = 20 }

    doc.setTextColor(0)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('Payment Instructions', 20, cursorY)
    cursorY += 7
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)

    if (invoice.school?.mpesaPaybill) {
        doc.setFont('helvetica', 'bold')
        doc.text('M-Pesa Paybill:', 20, cursorY)
        doc.setFont('helvetica', 'normal')
        doc.text(`Paybill: ${invoice.school.mpesaPaybill}  |  Account: ${invoice.invoiceNumber}`, 60, cursorY)
        cursorY += 7
    }
    if (invoice.school?.bankName && invoice.school?.bankAccount) {
        doc.setFont('helvetica', 'bold')
        doc.text('Bank Transfer:', 20, cursorY)
        doc.setFont('helvetica', 'normal')
        doc.text(`${invoice.school.bankName}  –  A/C: ${invoice.school.bankAccount}  (${invoice.school.bankAccountName || invoice.school.name})`, 60, cursorY)
        cursorY += 7
    }
    if (!invoice.school?.mpesaPaybill && !invoice.school?.bankName) {
        doc.text('Please contact the school finance office for payment details.', 20, cursorY)
        cursorY += 7
    }

    // ── Footer ────────────────────────────────────────────────────────────
    doc.setFontSize(7)
    doc.setTextColor(150)
    doc.text(`Use invoice number ${invoice.invoiceNumber} as your payment reference.`, 105, cursorY + 5, { align: 'center' })
    doc.text(`Generated by PayDesk on ${new Date().toLocaleDateString('en-KE')}`, 105, cursorY + 10, { align: 'center' })

    return doc.output('arraybuffer')
}

/**
 * Merges multiple PDF ArrayBuffers into a single PDF.
 */
export async function mergePDFs(pdfBuffers: ArrayBuffer[]): Promise<Uint8Array> {
    const mergedPdf = await PDFDocument.create()

    for (const buffer of pdfBuffers) {
        const pdf = await PDFDocument.load(buffer)
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
        copiedPages.forEach((page) => mergedPdf.addPage(page))
    }

    return await mergedPdf.save()
}
