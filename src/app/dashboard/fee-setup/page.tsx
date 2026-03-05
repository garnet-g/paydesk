'use client'

import DashboardLayout from '@/components/DashboardLayout'
import AcademicPeriodManager from '@/components/AcademicPeriodManager'
import FeeStructureManager from '@/components/FeeStructureManager'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Calendar, Coins, Settings, Wallet, Layers, LayoutGrid, Info } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export default function FeeSetupPage() {
    const { data: session } = useSession()
    const [activeTab, setActiveTab] = useState<'periods' | 'fees'>('fees')

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-8 p-8 pt-6 animate-in fade-in duration-500">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                <Settings size={24} className="text-blue-400" />
                            </div>
                            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Fee Settings</h2>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium ">
                            Manage school fee structures and academic terms
                        </p>
                    </div>
                </div>

                <Tabs defaultValue="fees" className="w-full space-y-8" onValueChange={(v) => setActiveTab(v as any)}>
                    <div className="bg-white dark:bg-slate-950 p-2 rounded-[1.5rem] shadow-xl border border-slate-100 dark:border-slate-900 inline-flex">
                        <TabsList className="bg-transparent gap-2 h-auto p-0">
                            <TabsTrigger
                                value="fees"
                                className={cn(
                                    "h-12 px-8 rounded-xl font-semibold text-[10px]   transition-all duration-300",
                                    "data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-200/50",
                                    "hover:bg-slate-50 dark:hover:bg-slate-900"
                                )}
                            >
                                <Wallet size={16} className="mr-2" />
                                Fee Structures
                            </TabsTrigger>
                            <TabsTrigger
                                value="periods"
                                className={cn(
                                    "h-12 px-8 rounded-xl font-semibold text-[10px]   transition-all duration-300",
                                    "data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-200/50",
                                    "hover:bg-slate-50 dark:hover:bg-slate-900"
                                )}
                            >
                                <Calendar size={16} className="mr-2" />
                                Terms & Periods
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="fees" className="mt-0 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                        <FeeStructureManager />
                    </TabsContent>

                    <TabsContent value="periods" className="mt-0 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                        <AcademicPeriodManager />
                    </TabsContent>
                </Tabs>

                {/* Global Info Bar */}
                <div className="mt-12 p-6 bg-slate-900 rounded-[2rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative border-t-4 border-blue-600">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="h-12 w-12 bg-blue-600/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
                            <Info size={20} className="text-blue-400" />
                        </div>
                        <div>
                            <div className="text-xs font-semibold">Important Notice</div>
                            <div className="text-[10px] text-slate-400 font-semibold tracking-wide">Modifying fee structures will only affect newly generated invoices. Existing invoices remain unchanged.</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-8 relative z-10">
                        <div className="text-right">
                            <div className="text-xs font-semibold text-blue-400">Subscription Plan</div>
                            <div className="text-xl font-semibold tracking-tight">{session?.user?.planTier || 'FREE'}</div>
                        </div>
                        <div className="h-10 w-[1px] bg-white/10 hidden md:block"></div>
                        <div className="flex -space-x-3">
                            <div className="h-10 w-10 rounded-full border-2 border-slate-900 bg-blue-600 flex items-center justify-center text-[10px] font-semibold">
                                AG
                            </div>
                            <div className="h-10 w-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-semibold">
                                {session?.user?.schoolName?.substring(0, 2).toUpperCase() || 'SC'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
