import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
    return clsx(inputs)
}

export function formatCurrency(amount: number | string): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
    }).format(num)
}

export function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('en-KE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(d)
}

export function formatDateTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('en-KE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(d)
}

export function generateInvoiceNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `INV-${timestamp}-${random}`
}

export function generateReceiptNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `RCT-${timestamp}-${random}`
}

export function generateTransactionRef(): string {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `TXN-${timestamp}-${random}`
}

export function calculateBalance(totalAmount: number, paidAmount: number): number {
    return Math.max(0, totalAmount - paidAmount)
}

export function getInvoiceStatus(totalAmount: number, paidAmount: number, dueDate?: Date | null): string {
    const balance = calculateBalance(totalAmount, paidAmount)

    if (balance === 0) return 'PAID'
    if (paidAmount > 0) return 'PARTIALLY_PAID'
    if (dueDate && new Date(dueDate) < new Date()) return 'OVERDUE'
    return 'PENDING'
}

export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

export function isOfficialEmail(email: string): boolean {
    if (!email) return false
    const PUBLIC_DOMAINS = [
        'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
        'aol.com', 'icloud.com', 'mail.com', 'zoho.com', 'protonmail.com'
    ]
    const domain = email.split('@')[1]?.toLowerCase()
    return domain ? !PUBLIC_DOMAINS.includes(domain) : false
}

export function validatePhoneNumber(phone: string): boolean {
    // Kenyan phone number format: 254XXXXXXXXX or 07XXXXXXXX or +254XXXXXXXXX
    const phoneRegex = /^(\+?254|0)[17]\d{8}$/
    return phoneRegex.test(phone.replace(/\s/g, ''))
}

export function normalizePhoneNumber(phone: string): string {
    // Convert to 254XXXXXXXXX format
    let normalized = phone.replace(/\s/g, '')
    if (normalized.startsWith('+254')) {
        normalized = normalized.substring(1)
    } else if (normalized.startsWith('0')) {
        normalized = '254' + normalized.substring(1)
    }
    return normalized
}
