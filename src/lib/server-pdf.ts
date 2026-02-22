import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import { PDFDocument } from 'pdf-lib'

/**
 * Server-side PDF generation utilities for batching
 */

export async function generateInvoicePDFBuffer(invoice: any) {
    const doc = new jsPDF() as any
    const brandingColor = invoice.school?.primaryColor || '#1f2937'
    const rgb = [31, 41, 55] // Default for now, hexToRgb simplified

    // Header
    doc.setFontSize(22)
    doc.text(invoice.school?.name || 'PayDesk', 105, 20, { align: 'center' })

    doc.setFontSize(10)
    doc.text('OFFICIAL INVOICE', 105, 28, { align: 'center' })

    doc.line(20, 35, 190, 35)

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Invoice Details', 20, 45)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Invoice No: ${invoice.invoiceNumber}`, 20, 52)
    doc.text(`Issue Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 20, 59)
    doc.text(`Status: ${invoice.status}`, 20, 66)

    doc.setFont('helvetica', 'bold')
    doc.text('Billed To', 120, 45)
    doc.setFont('helvetica', 'normal')
    doc.text(`Name: ${invoice.student?.firstName} ${invoice.student?.lastName}`, 120, 52)
    doc.text(`Adm No: ${invoice.student?.admissionNumber}`, 120, 59)

    // Table
    const tableHead = [['Description', 'Amount']]
    const tableBody = invoice.items.map((item: any) => [
        item.description,
        `KES ${parseFloat(item.amount).toLocaleString()}`
    ])

    doc.autoTable({
        startY: 75,
        head: tableHead,
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: rgb }
    })

    const finalY = doc.lastAutoTable.finalY
    doc.setFont('helvetica', 'bold')
    doc.text(`TOTAL OUTSTANDING: KES ${parseFloat(invoice.balance).toLocaleString()}`, 120, finalY + 15)

    // Return as ArrayBuffer
    return doc.output('arraybuffer')
}

export async function mergePDFs(pdfBuffers: ArrayBuffer[]) {
    const mergedPdf = await PDFDocument.create()

    for (const buffer of pdfBuffers) {
        const pdf = await PDFDocument.load(buffer)
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
        copiedPages.forEach((page) => mergedPdf.addPage(page))
    }

    return await mergedPdf.save()
}
