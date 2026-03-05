'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import {
    MessageSquare,
    Send,
    CheckCircle2,
    Clock,
    Plus,
    X,
    Search,
    Filter,
    MoreHorizontal,
    User,
    ShieldCheck,
    AlertCircle,
    Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { cn, formatDate } from '@/lib/utils'

export default function InquiriesPage() {
    const { data: session } = useSession()
    const [inquiries, setInquiries] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showNewModal, setShowNewModal] = useState(false)
    const [newInquiry, setNewInquiry] = useState({ subject: '', message: '' })
    const [submitting, setSubmitting] = useState(false)
    const [replyingTo, setReplyingTo] = useState<any>(null)
    const [replyMessage, setReplyMessage] = useState('')

    const isPrincipal = session?.user?.role === 'PRINCIPAL' || session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'FINANCE_MANAGER'

    useEffect(() => {
        if (session) {
            fetchInquiries()
        }
    }, [session])

    const fetchInquiries = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/inquiries')
            if (res.ok) {
                const data = await res.json()
                setInquiries(data)
            }
        } catch (error) {
            console.error('Failed to fetch inquiries:', error)
            toast.error("Failed to load inquiries")
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newInquiry.subject || !newInquiry.message) return

        setSubmitting(true)
        try {
            const res = await fetch('/api/inquiries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newInquiry)
            })

            if (res.ok) {
                toast.success("Inquiry Sent", {
                    description: "The administration will review your concern and respond shortly."
                })
                setNewInquiry({ subject: '', message: '' })
                setShowNewModal(false)
                fetchInquiries()
            } else {
                toast.error("Submission Failed")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setSubmitting(false)
        }
    }

    const handleReplySubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!replyMessage) return

        setSubmitting(true)
        try {
            const res = await fetch(`/api/inquiries/${replyingTo.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    response: replyMessage,
                    status: 'RESOLVED'
                })
            })

            if (res.ok) {
                toast.success("Response sent accurately")
                setReplyMessage('')
                setReplyingTo(null)
                fetchInquiries()
            } else {
                toast.error("Failed to deliver response")
            }
        } catch (error) {
            toast.error("Network error")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <DashboardLayout>
            <div className="max-w-[1200px] mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-semibold tracking-tight text-foreground dark:text-white">
                            {session?.user.role === 'PARENT' ? 'Support' : 'Inquiries'}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">
                            {isPrincipal ? 'Respond to parent concerns and questions' : 'Communicate with the school administration'}
                        </p>
                    </div>
                    {session?.user.role === 'PARENT' && (
                        <Button
                            className="h-11 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-foreground dark:hover:bg-muted rounded-xl px-6 font-semibold shadow-lg"
                            onClick={() => setShowNewModal(true)}
                        >
                            <Plus size={18} className="mr-2" />
                            New Inquiry
                        </Button>
                    )}
                </div>

                {/* Main Content Area */}
                <div className="space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="h-12 w-12 border-4 border-border border-t-slate-900 dark:border-slate-800 dark:border-t-white rounded-full animate-spin mb-4" />
                            <p className="text-slate-500 font-medium">Loading inquiries...</p>
                        </div>
                    ) : inquiries.length === 0 ? (
                        <Card className="border-none shadow-sm bg-white dark:bg-slate-950 rounded-[2.5rem] overflow-hidden p-12 text-center ring-1 ring-slate-100 dark:ring-slate-900">
                            <div className="h-20 w-20 bg-muted dark:bg-slate-900 rounded-[2rem] flex items-center justify-center text-slate-300 mx-auto mb-6 border border-border dark:border-slate-800">
                                <MessageSquare size={40} />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">No inquiries yet</h3>
                            <p className="text-slate-500 max-w-[300px] mx-auto mb-8">
                                {isPrincipal
                                    ? 'Incoming parent questions and concerns will appear here.'
                                    : 'Need help? Start a new inquiry to reach the school administration.'}
                            </p>
                        </Card>
                    ) : (
                        <div className="grid gap-6">
                            {inquiries.map(inquiry => (
                                <Card key={inquiry.id} className="border-none shadow-sm bg-white dark:bg-slate-950 rounded-[2rem] overflow-hidden ring-1 ring-slate-100 dark:ring-slate-900 transition-all hover:shadow-md">
                                    <div className="p-6 md:p-8">
                                        {/* Status & Header */}
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "h-12 w-12 rounded-2xl flex items-center justify-center shadow-sm",
                                                    inquiry.status === 'RESOLVED'
                                                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
                                                        : "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
                                                )}>
                                                    {inquiry.status === 'RESOLVED' ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-semibold text-foreground dark:text-white mb-1">{inquiry.subject}</h3>
                                                    <p className="text-xs font-semibold text-slate-400   flex items-center gap-2">
                                                        {isPrincipal ? (
                                                            <span className="flex items-center gap-1">
                                                                <User size={12} className="text-blue-600" />
                                                                {inquiry.user?.firstName} {inquiry.user?.lastName}
                                                            </span>
                                                        ) : 'Administration'}
                                                        <span>•</span>
                                                        {new Date(inquiry.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge className={cn(
                                                "rounded-lg px-3 py-1 font-bold text-[10px]  border-none",
                                                inquiry.status === 'RESOLVED'
                                                    ? "bg-emerald-600 text-white dark:bg-emerald-500"
                                                    : "bg-slate-900 text-white dark:bg-slate-800"
                                            )}>
                                                {inquiry.status}
                                            </Badge>
                                        </div>

                                        {/* Content Area */}
                                        <div className="space-y-6">
                                            {/* Original Message */}
                                            <div className="flex gap-4">
                                                <div className="h-10 w-10 bg-muted dark:bg-slate-900 rounded-full flex items-center justify-center shrink-0 border border-border dark:border-slate-800">
                                                    <User size={18} className="text-slate-400" />
                                                </div>
                                                <div className="bg-muted dark:bg-slate-900/50 p-6 rounded-2xl rounded-tl-none text-sm text-slate-700 dark:text-slate-300 leading-relaxed max-w-[90%] border border-border dark:border-slate-800">
                                                    {inquiry.message}
                                                </div>
                                            </div>

                                            {/* Response Area */}
                                            {inquiry.response ? (
                                                <div className="flex flex-row-reverse gap-4">
                                                    <div className="h-10 w-10 bg-slate-900 dark:bg-muted rounded-full flex items-center justify-center shrink-0 shadow-lg text-white dark:text-foreground font-bold text-xs">
                                                        S
                                                    </div>
                                                    <div className="bg-slate-900 dark:bg-white p-6 rounded-2xl rounded-tr-none text-sm text-white dark:text-foreground leading-relaxed max-w-[90%] shadow-xl shadow-slate-200/50 dark:shadow-none relative">
                                                        <div className="text-[10px] font-bold   opacity-60 mb-2">School Response</div>
                                                        {inquiry.response}
                                                    </div>
                                                </div>
                                            ) : isPrincipal ? (
                                                <div className="flex justify-end pt-4">
                                                    <Dialog open={replyingTo?.id === inquiry.id} onOpenChange={(open) => !open && setReplyingTo(null)}>
                                                        <DialogTrigger asChild>
                                                            <Button
                                                                className="bg-slate-900 dark:bg-white text-white dark:text-foreground rounded-xl px-6 h-11 font-semibold group shadow-lg"
                                                                onClick={() => setReplyingTo(inquiry)}
                                                            >
                                                                <Send size={18} className="mr-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                                                Provide Response
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="rounded-[2rem] border-none shadow-2xl p-8 max-w-lg">
                                                            <DialogHeader>
                                                                <DialogTitle className="text-2xl font-bold tracking-tight">Resolve Inquiry</DialogTitle>
                                                                <DialogDescription className="text-slate-500 font-medium">Respond to the concern regarding: <span className="text-foreground dark:text-white font-bold ">"{inquiry.subject}"</span></DialogDescription>
                                                            </DialogHeader>
                                                            <div className="space-y-4 py-6">
                                                                <Label className="text-xs font-bold text-slate-400  ">Your Response</Label>
                                                                <Textarea
                                                                    placeholder="Enter response here..."
                                                                    className="min-h-[160px] bg-muted dark:bg-slate-900 border-border dark:border-slate-800 rounded-2xl p-6 font-medium placeholder:text-slate-300 resize-none"
                                                                    value={replyMessage}
                                                                    onChange={(e) => setReplyMessage(e.target.value)}
                                                                />
                                                                <div className="flex items-center gap-2 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100/50 dark:border-blue-900/20">
                                                                    <Info size={16} className="text-blue-600 shrink-0" />
                                                                    <p className="text-[10px] text-blue-700/70 dark:text-blue-400/70 font-medium ">Your response will be permanently logged and visible to the parent immediately.</p>
                                                                </div>
                                                            </div>
                                                            <DialogFooter className="gap-3">
                                                                <Button variant="ghost" onClick={() => setReplyingTo(null)} className="rounded-xl px-6 font-bold  text-[10px]  text-slate-400">Cancel</Button>
                                                                <Button
                                                                    className="bg-slate-900 dark:bg-white text-white dark:text-foreground rounded-xl px-8 font-bold  text-[10px]  shadow-xl"
                                                                    onClick={handleReplySubmit}
                                                                    disabled={submitting || !replyMessage}
                                                                >
                                                                    {submitting ? 'Transmitting...' : 'Authorize & Send'}
                                                                </Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 pt-4 pl-14">
                                                    <Clock size={14} className="text-slate-400 animate-pulse" />
                                                    <span className="text-xs font-bold text-slate-400 ">Awaiting response from administration</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Legend / Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                    <div className="p-8 bg-slate-900 text-white rounded-[2.5rem] relative overflow-hidden flex items-center justify-between border-t-4 border-blue-600 shadow-xl">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                        <div className="relative z-10 flex items-center gap-6">
                            <div className="h-14 w-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 text-blue-400">
                                <ShieldCheck size={28} />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold   text-slate-400 mb-1 leading-none">Response Rate</h4>
                                <p className="text-3xl font-bold tracking-tight">96.4%</p>
                            </div>
                        </div>
                        <div className="relative z-10 text-right">
                            <h4 className="text-[10px] font-bold   text-slate-500 mb-1 leading-none ">Avg. Latency</h4>
                            <p className="text-xl font-bold text-blue-400 tracking-tight leading-none ">~2.4 Hrs</p>
                        </div>
                    </div>
                    <div className="p-8 bg-blue-50/50 dark:bg-blue-900/10 border-2 border-dashed border-blue-600/20 rounded-[2.5rem] flex items-center gap-6">
                        <div className="h-14 w-14 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm shrink-0 border border-blue-100 dark:border-blue-800">
                            <AlertCircle size={28} />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-foreground dark:text-white tracking-tight leading-snug">Support Priority</h4>
                            <p className="text-xs text-slate-500 leading-relaxed font-medium  mt-1  tracking-tight">Critical fee disputes and payment verification inquiries are prioritized by the finance department.</p>
                        </div>
                    </div>
                </div>

                {/* New Inquiry Modal for Parents */}
                <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
                    <DialogContent className="rounded-[2rem] border-none shadow-2xl p-8 max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold tracking-tight">Submit Inquiry</DialogTitle>
                            <DialogDescription className="text-slate-500 font-medium">Communicate a concern or query to the school admin.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-6 py-6 font-medium">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-400   ml-1">Inquiry Subject</Label>
                                <Input
                                    className="h-11 bg-muted dark:bg-slate-900 border-border dark:border-slate-800 rounded-xl font-medium"
                                    placeholder="Brief summary..."
                                    required
                                    value={newInquiry.subject}
                                    onChange={(e) => setNewInquiry({ ...newInquiry, subject: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-400   ml-1">Detailed Message</Label>
                                <Textarea
                                    placeholder="Explain your concern..."
                                    className="min-h-[140px] bg-muted dark:bg-slate-900 border-border dark:border-slate-800 rounded-xl p-4 font-medium resize-none"
                                    required
                                    value={newInquiry.message}
                                    onChange={(e) => setNewInquiry({ ...newInquiry, message: e.target.value })}
                                />
                            </div>
                        </form>
                        <DialogFooter className="gap-3">
                            <Button variant="ghost" onClick={() => setShowNewModal(false)} className="rounded-xl px-6 font-bold  text-[10px]  text-slate-400">Discard</Button>
                            <Button
                                className="bg-slate-900 dark:bg-white text-white dark:text-foreground rounded-xl px-8 h-11 font-bold  text-[10px]  shadow-xl"
                                onClick={handleSubmit}
                                disabled={submitting || !newInquiry.subject || !newInquiry.message}
                            >
                                {submitting ? 'Transmitting...' : 'Send Inquiry'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    )
}
