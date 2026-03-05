'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import { Megaphone, Mail, Bell, Send, Users, ShieldAlert, Sparkles, MessageSquare, Radio, Mic, Loader2, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function BroadcastPage() {
    const { data: session } = useSession()
    const [subject, setSubject] = useState('')
    const [message, setMessage] = useState('')
    const [recipientGroup, setRecipientGroup] = useState('ALL_PRINCIPALS')
    const [channel, setChannel] = useState('EMAIL')
    const [loading, setLoading] = useState(false)

    const planTier = session?.user?.planTier || 'FREE'
    const isPro = planTier === 'PRO' || planTier === 'ENTERPRISE' || session?.user?.role === 'SUPER_ADMIN'

    if (session?.user?.role !== 'SUPER_ADMIN' && session?.user?.role !== 'PRINCIPAL') {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 animate-in fade-in duration-500">
                    <div className="h-24 w-24 bg-red-100 dark:bg-red-900/30 rounded-[2rem] flex items-center justify-center text-red-600 mb-8 border-4 border-white dark:border-slate-800 shadow-xl">
                        <ShieldAlert size={48} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-4 text-center">Unauthorized Transmission</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium italic text-center max-w-md">
                        Broadcasting capabilities are restricted to <span className="text-red-600 font-black uppercase">Command Staff</span> only.
                    </p>
                    <Button variant="outline" className="mt-8 rounded-xl font-black text-xs uppercase tracking-widest" onClick={() => window.history.back()}>
                        Abort Access
                    </Button>
                </div>
            </DashboardLayout>
        )
    }

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        // Simulate sending a broadcast
        setTimeout(() => {
            setLoading(false)
            toast.success("TRANSMISSION SUCCESSFUL", {
                description: `Broadcast queued for ${recipientGroup.replace('_', ' ')} via ${channel}.`,
                className: "bg-slate-900 text-white rounded-2xl border-blue-600 border-2"
            })
            setSubject('')
            setMessage('')
        }, 1500)
    }

    const getRecipientLabel = (val: string) => {
        const options: any = {
            'ALL_PRINCIPALS': 'Principals & Admins',
            'ALL_FINANCE_MANAGERS': 'Finance Managers',
            'ALL_PARENTS': 'Registered Parents',
            'ALL_USERS': 'Every Platform User',
            'ALL_STAFF': 'School Staff',
            'FEE_DEFAULTERS': 'Fee Defaulters'
        }
        return options[val] || val
    }

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-8 p-8 pt-6 animate-in fade-in duration-500">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                <Radio size={24} className="text-blue-400 animate-pulse" />
                            </div>
                            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">Broadcaster</h2>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium italic">
                            Disseminating critical intelligence to <span className="text-blue-600 font-black uppercase not-italic">Institutional Channels</span>
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Main Broadcaster Interface */}
                    <Card className="lg:col-span-8 border-none shadow-2xl bg-white dark:bg-slate-950 rounded-[2.5rem] overflow-hidden relative">
                        {!isPro && (
                            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 dark:bg-slate-950/60 backdrop-blur-md p-8">
                                <div className="max-w-sm w-full bg-slate-900 rounded-[2.5rem] p-10 text-center shadow-2xl border-t-4 border-blue-600 animate-in zoom-in-95 duration-300">
                                    <div className="h-20 w-20 bg-blue-600/20 rounded-[2rem] flex items-center justify-center text-blue-400 mx-auto mb-8">
                                        <Lock size={40} />
                                    </div>
                                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-4">Channel Locked</h3>
                                    <p className="text-slate-400 font-bold text-sm italic mb-8 uppercase tracking-tight">
                                        Mass communication requires <span className="text-blue-400">PRO LEVEL</span> clearance. Upgrade your institutional tier to authorize broadcasts.
                                    </p>
                                    <Button className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl uppercase tracking-widest" onClick={() => toast("Contact command to upgrade your sector access.")}>
                                        Request Access
                                    </Button>
                                </div>
                            </div>
                        )}

                        <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-900 p-8">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                                    <Mic size={24} />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">New Transmission</CardTitle>
                                    <CardDescription className="text-slate-400 font-medium italic uppercase text-[10px] tracking-widest mt-1">Compose and dispatch announcements</CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-8 space-y-8">
                            <form onSubmit={handleSend} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Sector (Recipients)</Label>
                                        <Select value={recipientGroup} onValueChange={setRecipientGroup}>
                                            <SelectTrigger className="h-14 bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 rounded-2xl font-black uppercase text-xs tracking-widest">
                                                <div className="flex items-center gap-3">
                                                    <Users size={16} className="text-blue-600" />
                                                    <SelectValue />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl">
                                                {session?.user?.role === 'SUPER_ADMIN' ? (
                                                    <>
                                                        <SelectItem value="ALL_PRINCIPALS" className="font-bold">ALL PRINCIPALS & ADMINS</SelectItem>
                                                        <SelectItem value="ALL_FINANCE_MANAGERS" className="font-bold">ALL FINANCE MANAGERS</SelectItem>
                                                        <SelectItem value="ALL_PARENTS" className="font-bold">ALL REGISTERED PARENTS</SelectItem>
                                                        <SelectItem value="ALL_USERS" className="font-bold">EVERY REGISTERED ENTITY</SelectItem>
                                                    </>
                                                ) : (
                                                    <>
                                                        <SelectItem value="ALL_PARENTS" className="font-bold text-slate-900 dark:text-white">ALL SCHOOL PARENTS</SelectItem>
                                                        <SelectItem value="ALL_STAFF" className="font-bold">ALL SCHOOL STAFF</SelectItem>
                                                        <SelectItem value="FEE_DEFAULTERS" className="font-bold text-red-600">FEE DEFAULTERS ONLY</SelectItem>
                                                    </>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Transmission Channel</Label>
                                        <Select value={channel} onValueChange={setChannel}>
                                            <SelectTrigger className="h-14 bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 rounded-2xl font-black uppercase text-xs tracking-widest">
                                                <div className="flex items-center gap-3">
                                                    {channel === 'EMAIL' ? <Mail size={16} className="text-blue-600" /> : <Bell size={16} className="text-blue-600" />}
                                                    <SelectValue />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl">
                                                <SelectItem value="EMAIL" className="font-bold">SECURE EMAIL BLAST</SelectItem>
                                                <SelectItem value="IN_APP" className="font-bold">IN-APP BANNER ALERT</SelectItem>
                                                <SelectItem value="SMS" className="font-bold">DIRECT SMS (PREMIUM)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Transmission Subject</Label>
                                    <Input
                                        className="h-14 bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 rounded-2xl font-black text-slate-900 dark:text-white uppercase placeholder:text-slate-300 dark:placeholder:text-slate-700"
                                        placeholder="E.G. SCHEDULED INSTITUTIONAL MAINTENANCE"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center ml-1">
                                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Message Payload</Label>
                                        <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-slate-200 text-slate-400">RAW DATA</Badge>
                                    </div>
                                    <Textarea
                                        className="min-h-[250px] bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 rounded-[2rem] p-8 font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 leading-relaxed resize-none transition-all focus:ring-4 focus:ring-blue-600/10"
                                        placeholder="INPUT TRANSMISSION CONTENT HERE..."
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        required
                                    />
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3 italic flex items-center gap-2">
                                        <ShieldAlert size={12} className="text-blue-600" /> Verification Protocol: Message will be dispatched exactly as encoded above.
                                    </p>
                                </div>
                            </form>
                        </CardContent>

                        <CardFooter className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-900 p-8 flex justify-between items-center">
                            <div className="hidden md:flex flex-col">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Network Status</span>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                    <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Satellite Uplink Active</span>
                                </div>
                            </div>
                            <Button
                                className="h-14 px-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-widest shadow-2xl shadow-blue-500/40 dark:shadow-none group"
                                disabled={loading || !subject || !message || !isPro}
                                onClick={handleSend}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin mr-3" size={24} />
                                        DECODING...
                                    </>
                                ) : (
                                    <>
                                        <Send size={20} className="mr-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        Dispatch Broadcast
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Broadcast Stats / Info Sidebar */}
                    <div className="lg:col-span-4 space-y-8">
                        <Card className="border-none shadow-xl bg-slate-900 text-white rounded-[2.5rem] overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                            <CardHeader className="p-8">
                                <CardTitle className="text-sm font-black uppercase tracking-widest text-blue-400 mb-1 leading-none italic">Transmission Stats</CardTitle>
                                <CardDescription className="text-slate-400 font-bold uppercase text-[9px] tracking-tight m-0">Institutional Reach Analytics</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 pt-0 space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-60">
                                        <span>Target Capacity</span>
                                        <span>EST. {recipientGroup === 'ALL_PARENTS' ? '450' : '1.2k'} UNITS</span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-600 w-3/4 shadow-[0_0_10px_rgba(37,99,235,0.8)]"></div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                                        <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Delivery Rate</div>
                                        <div className="text-2xl font-black text-blue-400 leading-none">99.8%</div>
                                    </div>
                                    <div className="p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                                        <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Latency</div>
                                        <div className="text-2xl font-black text-emerald-400 leading-none">1.2s</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="p-8 bg-blue-600/5 dark:bg-blue-900/10 border-2 border-dashed border-blue-600/20 rounded-[2.5rem] space-y-4">
                            <div className="h-12 w-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                                <Sparkles size={24} />
                            </div>
                            <h4 className="text-base font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Pro Tip</h4>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed italic uppercase tracking-tight">
                                Use <span className="text-blue-600 font-black">Dynamic Placeholders</span> like <code className="bg-blue-100 dark:bg-blue-900/30 px-1 rounded">{"{PARENT_NAME}"}</code> to personalize your transmissions and increase engagement frequency.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
