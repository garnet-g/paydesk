'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import {
    MessageSquare,
    Send,
    Users,
    Bell,
    Mail,
    History,
    Search,
    CheckCircle2,
    Info,
    MoreHorizontal
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function CommunicationPage() {
    const { data: session } = useSession()
    const [subject, setSubject] = useState('')
    const [message, setMessage] = useState('')
    const [recipient, setRecipient] = useState('ALL_PARENTS')
    const [submitting, setSubmitting] = useState(false)

    // Mock history data consistent with screenshot
    const messageHistory = [
        {
            id: 1,
            title: 'School Reopening Notice',
            recipient: 'All Parents',
            message: 'School will reopen on March 10, 2025. Please ensure all fees are paid.',
            date: '3/1/2026',
            channel: 'Both',
            status: 'Sent'
        },
        {
            id: 2,
            title: 'Exam Schedule',
            recipient: 'Grade 10',
            message: 'Mid-term exams begin on March 15, 2026.',
            date: '3/2/2026',
            channel: 'SMS',
            status: 'Sent'
        }
    ]

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!subject || !message) {
            toast.error("Missing Information", {
                description: "Please provide both a subject and a message."
            })
            return
        }

        setSubmitting(true)
        // Simulate API call
        setTimeout(() => {
            setSubmitting(false)
            toast.success("Message Sent", {
                description: `Announcement has been successfully sent to ${recipient.replace('_', ' ').toLowerCase()}.`
            })
            setSubject('')
            setMessage('')
        }, 1500)
    }

    return (
        <DashboardLayout>
            <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
                {/* Header */}
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Communication Hub</h1>
                    <p className="text-slate-500 dark:text-slate-400">Send SMS and announcements to parents</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    {/* Send Message Form */}
                    <Card className="border-none shadow-sm bg-white dark:bg-slate-950 rounded-2xl overflow-hidden ring-1 ring-slate-100 dark:ring-slate-900">
                        <CardHeader className="p-6 pb-2">
                            <CardTitle className="text-lg font-semibold">Send Message</CardTitle>
                            <CardDescription>Bulk SMS to parents</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 pt-4">
                            <form onSubmit={handleSendMessage} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="recipient" className="text-sm font-medium">Recipient</Label>
                                    <Select value={recipient} onValueChange={setRecipient}>
                                        <SelectTrigger id="recipient" className="h-11 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl">
                                            <SelectValue placeholder="Select Recipient" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL_PARENTS">All Parents</SelectItem>
                                            <SelectItem value="ALL_STAFF">All Staff</SelectItem>
                                            <SelectItem value="GRADE_10">Grade 10 Parents</SelectItem>
                                            <SelectItem value="FEE_DEFAULTERS">Fee Defaulters</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="subject" className="text-sm font-medium">Subject</Label>
                                    <Input
                                        id="subject"
                                        placeholder="Message subject"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        className="h-11 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="message" className="text-sm font-medium">Message</Label>
                                    <Textarea
                                        id="message"
                                        placeholder="Type your message here..."
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        className="min-h-[120px] bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl resize-none p-4"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-xl font-semibold transition-all shadow-lg active:scale-[0.98]"
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        "Sending..."
                                    ) : (
                                        <>
                                            <Send size={18} className="mr-2" />
                                            Send Message
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Message History */}
                    <Card className="border-none shadow-sm bg-white dark:bg-slate-950 rounded-2xl overflow-hidden ring-1 ring-slate-100 dark:ring-slate-900">
                        <CardHeader className="p-6 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-lg font-semibold">Message History</CardTitle>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                <Search size={16} className="text-slate-400" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-6 pt-0">
                            <div className="space-y-4">
                                {messageHistory.map((item) => (
                                    <div
                                        key={item.id}
                                        className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 group hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer relative"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                                            <Badge className="bg-slate-900 text-white border-none rounded-lg text-[10px] px-2 py-0.5">
                                                {item.status}
                                            </Badge>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-medium mb-2  tracking-wide">{item.recipient}</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
                                            {item.message}
                                        </p>
                                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium ">
                                            <span className="flex items-center gap-1">
                                                Sent on {item.date} via {item.channel}
                                            </span>
                                        </div>
                                    </div>
                                ))}

                                {messageHistory.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="h-16 w-16 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
                                            <History size={32} />
                                        </div>
                                        <h3 className="font-semibold text-slate-900 dark:text-white">No history yet</h3>
                                        <p className="text-sm text-slate-500 max-w-[200px] mx-auto mt-1">Your sent announcements will appear here</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="p-6 border-t border-slate-50 dark:border-slate-900">
                            <Button variant="ghost" className="w-full text-xs font-semibold text-slate-400 hover:text-slate-900">
                                View Full History
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                {/* Info Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-900/20 rounded-2xl flex items-start gap-4">
                        <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                            <Bell size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300">In-App Notifications</h4>
                            <p className="text-xs text-blue-700/70 dark:text-blue-400/60 mt-1">Messages are automatically delivered to parents' mobile dashboards.</p>
                        </div>
                    </div>
                    <div className="p-6 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100/50 dark:border-emerald-900/20 rounded-2xl flex items-start gap-4">
                        <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                            <Mail size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">Email Updates</h4>
                            <p className="text-xs text-emerald-700/70 dark:text-emerald-400/60 mt-1">Important notices are mirrored to registered email addresses.</p>
                        </div>
                    </div>
                    <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-start gap-4">
                        <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-600 shrink-0">
                            <Info size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-300">Support Center</h4>
                            <p className="text-xs text-slate-500 mt-1">Need help with mass messaging? Contact our technical team.</p>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
