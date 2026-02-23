import { prisma } from './prisma'

/**
 * Communication Engine
 * Handles sending SMS and Emails via various providers (Africa's Talking, SendGrid, etc.)
 */

interface SendMessageOptions {
    to: string;
    subject?: string;
    message: string;
    studentId?: string;
    schoolId?: string;
}

export const CommunicationEngine = {
    /**
     * Send SMS via Africa's Talking
     */
    async sendSMS({ to, message, studentId, schoolId }: SendMessageOptions) {
        console.log(`[SMS MOCK] Sending to ${to}: ${message}`)

        try {
            // Save to Notification log
            await prisma.notification.create({
                data: {
                    type: 'SMS',
                    recipient: to,
                    message: message,
                    status: 'SENT', // Mark as sent in mock
                    sentAt: new Date(),
                    studentId,
                    schoolId
                }
            })

            // REAL IMPLEMENTATION (Skeleton)
            /*
            const options = {
                apiKey: process.env.AT_API_KEY,
                username: process.env.AT_USERNAME,
            };
            const AfricasTalking = require('africastalking')(options);
            const sms = AfricasTalking.SMS;
            await sms.send({
                to: [to],
                message: message,
                from: process.env.AT_SENDER_ID
            });
            */

        } catch (error) {
            console.error("SMS Sending Error:", error)
            // Log as failed
            await prisma.notification.create({
                data: {
                    type: 'SMS',
                    recipient: to,
                    message: message,
                    status: 'FAILED',
                    studentId,
                    schoolId
                }
            })
        }
    },

    /**
     * Send Email
     */
    async sendEmail({ to, subject, message, studentId, schoolId }: SendMessageOptions) {
        console.log(`[EMAIL MOCK] Sending to ${to} (${subject}): ${message}`)

        try {
            await prisma.notification.create({
                data: {
                    type: 'EMAIL',
                    recipient: to,
                    subject: subject || 'School Notification',
                    message: message,
                    status: 'SENT',
                    sentAt: new Date(),
                    studentId,
                    schoolId
                }
            })

            // REAL IMPLEMENTATION (Skeleton)
            /*
            const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ... })
            });
            */
        } catch (error) {
            console.error("Email Sending Error:", error)
        }
    },

    /**
     * Notify parent of a new invoice
     */
    async notifyInvoiceGenerated(invoiceId: string) {
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                student: {
                    include: {
                        guardians: {
                            include: { user: true }
                        }
                    }
                },
                school: true
            }
        })

        if (!invoice) return

        const message = `Dear Parent, a new invoice ${invoice.invoiceNumber} for ${invoice.student.firstName} has been generated. Total: KES ${invoice.totalAmount}. Due by ${invoice.dueDate?.toLocaleDateString()}. - ${invoice.school.name}`

        for (const g of invoice.student.guardians) {
            if (g.user.phoneNumber) {
                await this.sendSMS({
                    to: g.user.phoneNumber,
                    message,
                    studentId: invoice.studentId,
                    schoolId: invoice.schoolId
                })
            }
            if (g.user.email) {
                await this.sendEmail({
                    to: g.user.email,
                    subject: `New Invoice Generated - ${invoice.invoiceNumber}`,
                    message,
                    studentId: invoice.studentId,
                    schoolId: invoice.schoolId
                })
            }
        }
    },

    /**
     * Notify parents in bulk after a billing run
     */
    async notifyBulkInvoices(invoiceIds: string[]) {
        console.log(`[COMMUNICATION] Queuing notifications for ${invoiceIds.length} invoices...`)
        // In a real app, this would be pushed to a queue (BullMQ/Redis)
        // For MVP, we'll process them asynchronously
        for (const id of invoiceIds) {
            this.notifyInvoiceGenerated(id).catch(err => console.error(`Failed to notify for invoice ${id}:`, err))
        }
    },

    /**
     * Notify parent of a payment received
     */
    async notifyPaymentReceived(paymentId: string) {
        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
            include: {
                student: {
                    include: {
                        guardians: {
                            include: { user: true }
                        }
                    }
                },
                school: true,
                invoice: true
            }
        })

        if (!payment || payment.status !== 'COMPLETED') return

        const message = `Payment of KES ${payment.amount} received for ${payment.student.firstName}. Ref: ${payment.transactionRef}. Thank you for choosing ${payment.school.name}.`

        for (const g of payment.student.guardians) {
            if (g.user.phoneNumber) {
                await this.sendSMS({
                    to: g.user.phoneNumber,
                    message,
                    studentId: payment.studentId,
                    schoolId: payment.schoolId
                })
            }
        }
    },

    /**
     * Notify parents of overdue invoices
     * This would typically be called by a daily cron job
     */
    async notifyOverdueInvoices() {
        const today = new Date()
        const overdueInvoices = await prisma.invoice.findMany({
            where: {
                status: { in: ['PENDING', 'PARTIALLY_PAID'] },
                dueDate: { lt: today }
            },
            include: {
                student: { include: { guardians: { include: { user: true } } } },
                school: true
            }
        })

        console.log(`[COMMUNICATION] Sending reminders for ${overdueInvoices.length} overdue invoices...`)

        for (const invoice of overdueInvoices) {
            const message = `REMINDER: Invoice ${invoice.invoiceNumber} for ${invoice.student.firstName} is overdue. Balance: KES ${invoice.balance}. Please pay via Paybill 174379. - ${invoice.school.name}`

            for (const g of invoice.student.guardians) {
                if (g.user.phoneNumber) {
                    await this.sendSMS({
                        to: g.user.phoneNumber,
                        message,
                        studentId: invoice.studentId,
                        schoolId: invoice.schoolId
                    })
                }
            }
        }
    },

    /**
     * Notify parent of account creation
     */
    async notifyParentAccountCreated(userId: string, tempPassword: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { school: true }
        })

        if (!user || user.role !== 'PARENT') return

        const message = `Welcome to ${user.school?.name || 'PayDesk'}. Your parent account has been created. Login at ${process.env.APP_URL}/login using your email: ${user.email} and temporary password: ${tempPassword}. You will be prompted to change it upon first login.`

        if (user.phoneNumber) {
            await this.sendSMS({
                to: user.phoneNumber,
                message,
                schoolId: user.schoolId || undefined
            })
        }

        if (user.email) {
            await this.sendEmail({
                to: user.email,
                subject: `Parent Account Created - ${user.school?.name || 'PayDesk'}`,
                message,
                schoolId: user.schoolId || undefined
            })
        }
    },

    /**
     * Notify School Principal of Past Due Platform Subscription
     */
    async notifySchoolPastDue(schoolId: string) {
        const school = await prisma.school.findUnique({
            where: { id: schoolId },
            include: {
                users: {
                    where: { role: 'PRINCIPAL' },
                    take: 1
                }
            }
        })

        if (!school || !school.users[0]) return

        const principal = school.users[0]
        const message = `URGENT: Your PayDesk platform subscription for ${school.name} is PAST DUE. To avoid service interruption for your staff and parents, please settle the outstanding balance of KES ${school.subscriptionFee}. Thank you.`

        if (principal.phoneNumber) {
            await this.sendSMS({
                to: principal.phoneNumber,
                message,
                schoolId: school.id
            })
        }

        if (principal.email) {
            await this.sendEmail({
                to: principal.email,
                subject: `URGENT: Platform Subscription Past Due - ${school.name}`,
                message,
                schoolId: school.id
            })
        }

        // Track last notification
        await prisma.school.update({
            where: { id: schoolId },
            data: { lastBillingNotification: new Date() }
        })
    }
}
