'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import {
    Bus,
    Plus,
    MapPin,
    User,
    CreditCard,
    Users,
    ChevronRight,
    Map,
    Clock,
    ShieldCheck,
    MoreVertical
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function TransportManagementPage() {
    const { data: session } = useSession()

    // Mock routes data consistent with screenshot
    const routes = [
        {
            id: 'route-a',
            name: 'Route A - Westlands',
            driver: 'James Kamau',
            vehicleNumber: 'KCA 123X',
            monthlyFee: 6000,
            capacity: '35/40',
            stops: ['Westlands', 'Parklands', 'Highridge', 'School'],
            assignedStudents: [
                { name: 'John Doe' },
                { name: 'Jane Smith' }
            ]
        },
        {
            id: 'route-b',
            name: 'Route B - Eastleigh',
            driver: 'Peter Omondi',
            vehicleNumber: 'KCB 456Y',
            monthlyFee: 5500,
            capacity: '28/40',
            stops: ['Eastleigh', 'Pangani', 'Muthaiga', 'School'],
            assignedStudents: [
                { name: 'Emily Williams' }
            ]
        }
    ]

    return (
        <DashboardLayout>
            <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground dark:text-white">Transport Management</h1>
                        <p className="text-slate-500 dark:text-slate-400">Manage routes and vehicle assignments</p>
                    </div>
                    <Button className="h-11 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-foreground dark:hover:bg-muted rounded-xl px-6 font-semibold shadow-lg">
                        <Plus size={18} className="mr-2" />
                        Add Route
                    </Button>
                </div>

                {/* Dashboard Stats (Tiny Row) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-white dark:bg-slate-950 rounded-2xl ring-1 ring-slate-100 dark:ring-slate-900 shadow-sm flex items-center gap-4">
                        <div className="h-10 w-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600">
                            <Bus size={20} />
                        </div>
                        <div>
                            <p className="text-[10px]  tracking-wider font-bold text-slate-400">Total Vehicles</p>
                            <p className="text-lg font-bold">12 Active</p>
                        </div>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-950 rounded-2xl ring-1 ring-slate-100 dark:ring-slate-900 shadow-sm flex items-center gap-4">
                        <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-600">
                            <Users size={20} />
                        </div>
                        <div>
                            <p className="text-[10px]  tracking-wider font-bold text-slate-400">Students Transported</p>
                            <p className="text-lg font-bold">342 Daily</p>
                        </div>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-950 rounded-2xl ring-1 ring-slate-100 dark:ring-slate-900 shadow-sm flex items-center gap-4">
                        <div className="h-10 w-10 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center text-purple-600">
                            <MapPin size={20} />
                        </div>
                        <div>
                            <p className="text-[10px]  tracking-wider font-bold text-slate-400">Active Routes</p>
                            <p className="text-lg font-bold">8 Established</p>
                        </div>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-950 rounded-2xl ring-1 ring-slate-100 dark:ring-slate-900 shadow-sm flex items-center gap-4">
                        <div className="h-10 w-10 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-amber-600">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <p className="text-[10px]  tracking-wider font-bold text-slate-400">Safety Status</p>
                            <p className="text-lg font-bold">Certified</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {routes.map((route) => (
                        <Card key={route.id} className="border-none shadow-sm bg-white dark:bg-slate-950 rounded-[2rem] overflow-hidden ring-1 ring-slate-100 dark:ring-slate-900 group hover:shadow-xl transition-all duration-500">
                            <CardHeader className="p-8 pb-4">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <CardTitle className="text-xl font-bold">{route.name}</CardTitle>
                                        <CardDescription className="flex items-center gap-2">
                                            <span className="font-semibold text-slate-400">Driver:</span>
                                            <span className="text-foreground dark:text-white font-medium">{route.driver}</span>
                                        </CardDescription>
                                    </div>
                                    <Badge variant="outline" className="bg-slate-900 text-white dark:bg-white dark:text-foreground border-none font-bold px-3 py-1 rounded-lg">
                                        {route.capacity}
                                    </Badge>
                                </div>
                            </CardHeader>

                            <CardContent className="p-8 pt-4 space-y-8">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <Label className="text-[10px]   font-bold text-slate-400">Vehicle Number</Label>
                                        <p className="text-sm font-bold text-foreground dark:text-white">{route.vehicleNumber}</p>
                                    </div>
                                    <div className="space-y-1 text-right lg:text-left">
                                        <Label className="text-[10px]   font-bold text-slate-400">Monthly Fee</Label>
                                        <p className="text-sm font-bold text-foreground dark:text-white">KES {route.monthlyFee.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-[10px]   font-bold text-slate-400">Route Stops</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {route.stops.map((stop, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                                                    {stop}
                                                </div>
                                                {idx < route.stops.length - 1 && <ChevronRight size={14} className="text-slate-200" />}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-[10px]   font-bold text-slate-400">Assigned Students ({route.assignedStudents.length})</Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {route.assignedStudents.map((student, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-3 bg-muted dark:bg-slate-900/50 rounded-xl border border-border dark:border-slate-800">
                                                <div className="h-8 w-8 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 border border-border dark:border-slate-700">
                                                    <User size={14} />
                                                </div>
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{student.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>

                            <CardFooter className="p-8 pt-0 flex justify-end gap-3">
                                <Button variant="ghost" className="h-10 rounded-xl text-primary-600 hover:bg-primary-50 font-bold text-xs">
                                    Edit Route
                                </Button>
                                <Button variant="outline" className="h-10 rounded-xl border-primary-100 text-primary-700 font-bold text-xs bg-primary-50/30 hover:bg-primary-50">
                                    Manage Registry
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    )
}
