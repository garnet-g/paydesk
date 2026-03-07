'use client'

import DashboardLayout from '@/components/DashboardLayout'
import GradePromotionPanel from '@/components/GradePromotionPanel'
import { GraduationCap, Info, ShieldCheck, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export default function GradePromotionPage() {
    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
                {/* Modern Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="h-14 w-14 bg-slate-900 rounded-[1.25rem] flex items-center justify-center text-white shadow-2xl shadow-slate-200 dark:shadow-none border border-slate-800">
                            <GraduationCap size={28} className="text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tighter italic text-foreground dark:text-white leading-none">
                                Academic Progression
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-2 flex items-center gap-2">
                                <ShieldCheck size={12} className="text-blue-500" />
                                Student grade promotion & transitioning hub
                            </p>
                        </div>
                    </div>
                </div>

                {/* Performance Insight Card: How it works */}
                <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-slate-950 overflow-hidden ring-1 ring-slate-100 dark:ring-slate-900">
                    <CardContent className="p-8 md:p-10">
                        <div className="flex flex-col md:flex-row gap-10">
                            <div className="md:w-1/3">
                                <div className="p-6 bg-slate-900 rounded-[2rem] text-white relative overflow-hidden h-full flex flex-col justify-between">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                                    <div className="relative z-10">
                                        <div className="h-12 w-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10 mb-6">
                                            <Info size={22} className="text-blue-400" />
                                        </div>
                                        <h3 className="text-xl font-black uppercase italic tracking-tighter mb-2">Protocol Overview</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                                            Formalizing student transitions across academic units.
                                        </p>
                                    </div>
                                    <div className="mt-8 pt-6 border-t border-white/10 relative z-10">
                                        <div className="text-[10px] font-black text-blue-400 uppercase italic mb-1">Authorization Mode</div>
                                        <div className="text-sm font-black tracking-widest uppercase italic">PRINCIPAL REQUIRED</div>
                                    </div>
                                </div>
                            </div>

                            <div className="md:w-2/3 space-y-6">
                                <div className="grid grid-cols-1 gap-4">
                                    {[
                                        { step: "Selection Phase", desc: "Define source and target academic units, then prioritize students for progression." },
                                        { step: "Verification State", desc: "A pending approval request is established. No data is modified during this phase." },
                                        { step: "Principal Audit", desc: "Final authorization occurs within the Payments Terminal pending section." },
                                        { step: "Cycle Completion", desc: "Upon approval, unit migration is finalized and invoices are auto-generated for the next cycle." }
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                            <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-[10px] font-black transition-all group-hover:bg-slate-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-slate-950">
                                                0{idx + 1}
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black uppercase tracking-widest text-foreground dark:text-white mb-1 italic">{item.step}</h4>
                                                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed uppercase tracking-tight">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Action Panel */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 ml-4">
                        <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Initiate Transition Workflow</span>
                    </div>
                    <GradePromotionPanel />
                </div>
            </div>
        </DashboardLayout>
    )
}
