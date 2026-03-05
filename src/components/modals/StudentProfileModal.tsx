'use client'

import { useState } from 'react'
import { X, Calendar, MapPin, Phone, Mail, FileText, CheckCircle, GraduationCap } from 'lucide-react'
import { format } from 'date-fns'

interface StudentProfileModalProps {
    student: any
    onClose: () => void
}

export default function StudentProfileModal({ student, onClose }: StudentProfileModalProps) {
    const [activeTab, setActiveTab] = useState<'info' | 'academic' | 'billing' | 'parent'>('info')

    const guardian = student?.guardians?.[0]?.user

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl w-full max-w-2xl animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Student Profile</h2>
                        <p className="text-sm text-slate-500 mt-1">Complete student information and records</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="px-6 pt-4">
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-full p-1 border border-slate-200 dark:border-slate-700">
                        <TabButton active={activeTab === 'info'} onClick={() => setActiveTab('info')}>Info</TabButton>
                        <TabButton active={activeTab === 'academic'} onClick={() => setActiveTab('academic')}>Academic</TabButton>
                        <TabButton active={activeTab === 'billing'} onClick={() => setActiveTab('billing')}>Billing</TabButton>
                        <TabButton active={activeTab === 'parent'} onClick={() => setActiveTab('parent')}>Parent</TabButton>
                    </div>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {activeTab === 'info' && (
                        <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                            <div>
                                <h4 className="text-xs font-semibold text-slate-500 mb-1">Full Name</h4>
                                <p className="font-bold text-slate-900 dark:text-white">{student.firstName} {student.middleName || ''} {student.lastName}</p>
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-slate-500 mb-1">Admission Number</h4>
                                <p className="font-bold text-slate-900 dark:text-white">{student.admissionNumber}</p>
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-slate-500 mb-1">Class</h4>
                                <p className="font-bold text-slate-900 dark:text-white">
                                    {student.class?.name || 'Unassigned'} {student.class?.stream ? `- ${student.class.stream}` : ''}
                                </p>
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-slate-500 mb-1">Gender</h4>
                                <p className="font-bold text-slate-900 dark:text-white capitalize">{student.gender || 'Unknown'}</p>
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-slate-500 mb-1">Date of Birth</h4>
                                <p className="font-bold text-slate-900 dark:text-white">
                                    {student.dateOfBirth ? format(new Date(student.dateOfBirth), 'MM/dd/yyyy') : 'Not Provided'}
                                </p>
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-slate-500 mb-1">Enrollment Date</h4>
                                <p className="font-bold text-slate-900 dark:text-white">
                                    {student.createdAt ? format(new Date(student.createdAt), 'MM/dd/yyyy') : 'Unknown'}
                                </p>
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-slate-500 mb-1">Transport Route</h4>
                                <p className="font-bold text-slate-900 dark:text-white">Not Set</p>
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-slate-500 mb-1">Meal Plan</h4>
                                <p className="font-bold text-slate-900 dark:text-white">Default Plan</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'academic' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Recent Grades</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center p-4 border border-slate-100 dark:border-slate-800 rounded-2xl">
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white">Mathematics</p>
                                            <p className="text-xs text-slate-500 mt-1">Term 1 2026</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="inline-flex items-center justify-center bg-slate-950 text-white font-bold rounded-lg h-7 px-3 text-xs tracking-widest uppercase shadow-md mb-1">A</div>
                                            <p className="text-xs text-slate-500 font-medium">85/100</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center p-4 border border-slate-100 dark:border-slate-800 rounded-2xl">
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white">English</p>
                                            <p className="text-xs text-slate-500 mt-1">Term 1 2026</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="inline-flex items-center justify-center bg-slate-950 text-white font-bold rounded-lg h-7 px-3 text-xs tracking-widest uppercase shadow-md mb-1">B+</div>
                                            <p className="text-xs text-slate-500 font-medium">78/100</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Attendance Statistics</h3>
                                <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-50 dark:border-blue-900/20 p-5 rounded-2xl flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-slate-700 dark:text-slate-300">Attendance Rate</p>
                                        <p className="text-xs text-slate-500 mt-2">Present: 45</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-slate-900 dark:text-white">100.0%</p>
                                        <p className="text-xs text-slate-500 mt-1">Total: 45</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'billing' && (
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Invoices</h3>
                            <div className="border border-slate-200 dark:border-slate-800 p-5 rounded-2xl hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white">Term 1 2026</h4>
                                        <p className="text-xs text-slate-500 mt-1">Due: 2/15/2026</p>
                                    </div>
                                    <div className="bg-slate-950 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full">Paid</div>
                                </div>
                                <div className="space-y-2 text-sm border-t border-slate-100 dark:border-slate-800 pt-4">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Total Amount:</span>
                                        <span className="font-bold text-slate-900 dark:text-white">KES 59,000</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Paid:</span>
                                        <span className="font-bold text-emerald-600">KES 59,000</span>
                                    </div>
                                    <div className="flex justify-between mt-2 pt-2 border-t border-slate-50 dark:border-slate-800/50">
                                        <span className="text-slate-500 font-medium">Balance:</span>
                                        <span className="font-bold text-red-600">KES 0</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'parent' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Parent/Guardian Information</h3>
                                <button className="text-xs font-semibold px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                    <EditIcon /> Edit
                                </button>
                            </div>

                            {guardian ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <h4 className="text-xs font-semibold text-slate-500 mb-1">Full Name</h4>
                                            <p className="font-bold text-slate-900 dark:text-white">{guardian.firstName} {guardian.lastName}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-semibold text-slate-500 mb-1">Relationship</h4>
                                            <p className="font-bold text-slate-900 dark:text-white">Guardian</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex gap-4 items-center">
                                            <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                <Mail size={16} />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-semibold text-slate-500 mb-0.5">Email</h4>
                                                <p className="font-bold text-slate-900 dark:text-white text-sm">{guardian.email || 'N/A'}</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 items-center">
                                            <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                <Phone size={16} />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-semibold text-slate-500 mb-0.5">Phone</h4>
                                                <p className="font-bold text-slate-900 dark:text-white text-sm">{guardian.phoneNumber || 'N/A'}</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 items-center">
                                            <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                <MapPin size={16} />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-semibold text-slate-500 mb-0.5">Address</h4>
                                                <p className="font-bold text-slate-900 dark:text-white text-sm">Nairobi, Kenya</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-slate-500">No parent or guardian information strictly assigned.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function TabButton({ active, children, onClick }: { active: boolean, children: React.ReactNode, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 py-1.5 px-4 rounded-full text-sm font-semibold transition-all shadow-none ${active
                    ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
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
