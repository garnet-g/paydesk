'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, MapPin, Phone, Mail, FileText, CheckCircle, GraduationCap, Loader2, CreditCard, Activity } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface StudentProfileModalProps {
    student: any
    onClose: () => void
}

export default function StudentProfileModal({ student, onClose }: StudentProfileModalProps) {
    const [activeTab, setActiveTab] = useState<'info' | 'academic' | 'billing' | 'parent'>('info')
    const [loading, setLoading] = useState(true)
    const [fullStudent, setFullStudent] = useState<any>(student)

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true)
            try {
                const res = await fetch(`/api/students/${student.id}`)
                if (res.ok) {
                    const data = await res.json()
                    setFullStudent(data)
                } else {
                    toast.error("Failed to load student profile")
                }
            } catch (error) {
                console.error('Error fetching student details:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchDetails()
    }, [student.id])

    const guardian = fullStudent?.guardians?.[0]?.user

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] overflow-hidden shadow-2xl w-full max-w-2xl animate-in zoom-in-95 duration-300 border border-border dark:border-slate-800">
                <div className="p-8 border-b border-border dark:border-slate-800 flex justify-between items-start bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200 dark:shadow-none">
                            <GraduationCap size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-foreground dark:text-white tracking-tight italic uppercase">Student Profile</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Records For {fullStudent.admissionNumber}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-white dark:hover:bg-slate-800 rounded-2xl text-slate-400 hover:text-foreground transition-all border border-transparent hover:border-border shadow-none"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="px-8 pt-6">
                    <div className="flex bg-muted dark:bg-slate-900 rounded-2xl p-1.5 border border-border dark:border-slate-800">
                        <TabButton active={activeTab === 'info'} onClick={() => setActiveTab('info')}>Information</TabButton>
                        <TabButton active={activeTab === 'academic'} onClick={() => setActiveTab('academic')}>Academic</TabButton>
                        <TabButton active={activeTab === 'billing'} onClick={() => setActiveTab('billing')}>Invoices</TabButton>
                        <TabButton active={activeTab === 'parent'} onClick={() => setActiveTab('parent')}>Guardian</TabButton>
                    </div>
                </div>

                <div className="p-8 max-h-[60vh] overflow-y-auto">
                    {loading && activeTab !== 'info' ? (
                        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                            <Loader2 className="animate-spin text-blue-600 mb-4" size={32} />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Syncing Records...</p>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'info' && (
                                <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                                    <InfoField label="Full Name" value={`${fullStudent.firstName} ${fullStudent.middleName || ''} ${fullStudent.lastName}`} />
                                    <InfoField label="Admission Number" value={fullStudent.admissionNumber} />
                                    <InfoField label="Class / Stream" value={`${fullStudent.class?.name || 'Unassigned'} ${fullStudent.class?.stream ? `- ${fullStudent.class.stream}` : ''}`} />
                                    <InfoField label="Gender" value={fullStudent.gender || 'Unknown'} />
                                    <InfoField label="Date of Birth" value={fullStudent.dateOfBirth ? format(new Date(fullStudent.dateOfBirth), 'MMMM dd, yyyy') : 'Unknown'} />
                                    <InfoField label="Enrollment Date" value={format(new Date(fullStudent.createdAt), 'MMMM dd, yyyy')} />
                                    <InfoField label="Transport Route" value="Not Assigned" />
                                    <InfoField label="Meal Plan" value="Standard" />
                                </div>
                            )}

                            {activeTab === 'academic' && (
                                <div className="space-y-8">
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <Activity size={16} className="text-blue-600" />
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Performance Summary</h3>
                                        </div>
                                        {fullStudent.examResults?.length > 0 ? (
                                            <div className="space-y-4">
                                                {fullStudent.examResults.map((result: any) => (
                                                    <div key={result.id} className="flex justify-between items-center p-5 bg-slate-50 dark:bg-slate-900/50 border border-border dark:border-slate-800 rounded-2xl hover:border-blue-200 transition-all">
                                                        <div>
                                                            <p className="font-black text-xs uppercase tracking-tight text-foreground dark:text-white">{result.subject}</p>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 italic">{result.exam?.name || 'Academic Assessment'}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="inline-flex items-center justify-center bg-blue-600 text-white font-black rounded-xl h-8 px-4 text-xs tracking-widest uppercase shadow-lg shadow-blue-200 dark:shadow-none mb-1">
                                                                {result.grade || 'N/A'}
                                                            </div>
                                                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-tight">{result.score}/{result.maxScore}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <EmptyState icon={<FileText />} message="No academic records found for this student." />
                                        )}
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <CheckCircle size={16} className="text-emerald-600" />
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Attendance Rate</h3>
                                        </div>
                                        <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100/50 dark:border-emerald-900/20 p-6 rounded-[2rem] flex justify-between items-center">
                                            <div>
                                                <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest italic mb-2">Term Attendance</p>
                                                <p className="text-xs text-slate-500 font-bold uppercase italic tracking-tighter">Total Sessions: {fullStudent.attendance?.length || 0}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">
                                                    {fullStudent.attendance?.length > 0
                                                        ? ((fullStudent.attendance.filter((a: any) => a.status === 'PRESENT').length / fullStudent.attendance.length) * 100).toFixed(1)
                                                        : '100'}%
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'billing' && (
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <CreditCard size={16} className="text-purple-600" />
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Billing History</h3>
                                    </div>
                                    {fullStudent.invoices?.length > 0 ? (
                                        <div className="space-y-4">
                                            {fullStudent.invoices.map((invoice: any) => (
                                                <div key={invoice.id} className="border border-border dark:border-slate-800 p-6 rounded-[2rem] bg-white dark:bg-slate-900/40 hover:shadow-xl transition-all group">
                                                    <div className="flex justify-between items-start mb-6">
                                                        <div>
                                                            <h4 className="font-black text-xs uppercase tracking-tight text-foreground dark:text-white">{invoice.invoiceNumber}</h4>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 italic">Due: {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</p>
                                                        </div>
                                                        <div className={cn(
                                                            "text-[10px] font-black uppercase px-4 py-1.5 rounded-full tracking-widest italic",
                                                            invoice.status === 'PAID' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30"
                                                        )}>
                                                            {invoice.status}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3 text-xs border-t border-border dark:border-slate-800 pt-6">
                                                        <div className="flex justify-between">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Total Amount</span>
                                                            <span className="font-black text-foreground dark:text-white">KES {Number(invoice.totalAmount).toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Paid Amount</span>
                                                            <span className="font-black text-emerald-600">KES {Number(invoice.paidAmount).toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between mt-2 pt-4 border-t border-slate-50 dark:border-slate-800/50">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Outstanding Balance</span>
                                                            <span className="font-black text-red-600">KES {Number(invoice.balance).toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <EmptyState icon={<CreditCard />} message="No pending or past invoices for this student." />
                                    )}
                                </div>
                            )}

                            {activeTab === 'parent' && (
                                <div>
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="flex items-center gap-2">
                                            <Phone size={16} className="text-blue-600" />
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Guardian Details</h3>
                                        </div>
                                        <button className="text-[10px] font-black uppercase tracking-widest px-4 py-2 border border-border dark:border-slate-800 rounded-xl flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all italic">
                                            <EditIcon /> Edit Profile
                                        </button>
                                    </div>

                                    {guardian ? (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                            <div className="grid grid-cols-2 gap-8">
                                                <InfoField label="Guardian Name" value={`${guardian.firstName} ${guardian.lastName}`} />
                                                <InfoField label="Relationship" value="Primary Guardian" />
                                            </div>

                                            <div className="space-y-6 bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-border dark:border-slate-800">
                                                <div className="flex gap-6 items-center">
                                                    <div className="h-12 w-12 rounded-2xl bg-white dark:bg-slate-950 flex items-center justify-center text-blue-500 shadow-sm border border-border dark:border-slate-800">
                                                        <Mail size={18} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic mb-1">Email Address</h4>
                                                        <p className="font-black text-foreground dark:text-white text-sm tracking-tight">{guardian.email}</p>
                                                    </div>
                                                </div>

                                                <div className="flex gap-6 items-center">
                                                    <div className="h-12 w-12 rounded-2xl bg-white dark:bg-slate-950 flex items-center justify-center text-blue-500 shadow-sm border border-border dark:border-slate-800">
                                                        <Phone size={18} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic mb-1">Phone Number</h4>
                                                        <p className="font-black text-foreground dark:text-white text-sm tracking-tight">{guardian.phoneNumber || 'Not Provided'}</p>
                                                    </div>
                                                </div>

                                                <div className="flex gap-6 items-center">
                                                    <div className="h-12 w-12 rounded-2xl bg-white dark:bg-slate-950 flex items-center justify-center text-blue-500 shadow-sm border border-border dark:border-slate-800">
                                                        <MapPin size={18} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic mb-1">Residential Address</h4>
                                                        <p className="font-black text-foreground dark:text-white text-sm tracking-tight">Not Provided</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-dashed border-border dark:border-slate-800">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">No Guardian Profile Linked</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

function InfoField({ label, value }: { label: string, value: string }) {
    return (
        <div className="animate-in fade-in slide-in-from-left-2 duration-500">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 italic">{label}</h4>
            <p className="font-black text-xs uppercase tracking-tight text-foreground dark:text-white">{value}</p>
        </div>
    )
}

function EmptyState({ icon, message }: { icon: React.ReactNode, message: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-dashed border-border dark:border-slate-800">
            <div className="h-16 w-16 bg-white dark:bg-slate-950 rounded-2xl flex items-center justify-center text-slate-300 dark:text-slate-800 mb-4 shadow-inner border border-border dark:border-slate-800">
                {icon}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic max-w-[200px] leading-relaxed">
                {message}
            </p>
        </div>
    )
}

function TabButton({ active, children, onClick }: { active: boolean, children: React.ReactNode, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all italic",
                active
                    ? "bg-white dark:bg-slate-950 text-blue-600 shadow-xl shadow-blue-500/10"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            )}
        >
            {children}
        </button>
    )
}

function EditIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
    )
}
