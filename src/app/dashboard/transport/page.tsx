'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import {
    Bus,
    Plus,
    MapPin,
    User,
    Users,
    ChevronRight,
    ShieldCheck,
    Edit,
    Trash2,
    X,
    Save,
    Search,
    UserPlus,
    UserMinus,
    Play,
    CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function TransportManagementPage() {
    const { data: session } = useSession()
    const [routes, setRoutes] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const [allStudents, setAllStudents] = useState<any[]>([])

    const [showRouteModal, setShowRouteModal] = useState(false)
    const [showRosterModal, setShowRosterModal] = useState(false)
    const [showActiveRunModal, setShowActiveRunModal] = useState(false)

    // Form state for Route
    const [editingRoute, setEditingRoute] = useState<any>(null)
    const [activeRun, setActiveRun] = useState<any>(null)
    const [routeForm, setRouteForm] = useState({
        name: '',
        driver: '',
        vehicleNumber: '',
        monthlyFee: '',
        capacity: '40',
        stops: ''
    })

    // Roster form state
    const [rosterSearch, setRosterSearch] = useState('')

    useEffect(() => {
        if (session) {
            fetchRoutes()
            fetchStudents()
        }
    }, [session])

    const fetchRoutes = async () => {
        try {
            const res = await fetch('/api/transport')
            const data = await res.json()
            // Map the parsed JSON back
            const parsedRoutes = data.map((r: any) => ({
                ...r,
                stops: JSON.parse(r.stops || '[]')
            }))
            setRoutes(parsedRoutes)
        } catch (error) {
            console.error('Failed to fetch routes', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchStudents = async () => {
        // We need all active students to assign to the roster
        try {
            const res = await fetch('/api/students')
            if (res.ok) {
                const data = await res.json()
                setAllStudents(data)
            }
        } catch (error) {
            console.error('Failed to fetch students', error)
        }
    }

    const handleSaveRoute = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const stopsArray = routeForm.stops.split(',').map(s => s.trim()).filter(s => s !== '')

            const payload = {
                ...routeForm,
                stops: stopsArray
            }

            const url = editingRoute ? `/api/transport/${editingRoute.id}` : '/api/transport'
            const method = editingRoute ? 'PATCH' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                toast.success(`Route ${editingRoute ? 'updated' : 'created'} successfully!`)
                setShowRouteModal(false)
                fetchRoutes()
            } else {
                const err = await res.json()
                toast.error(err.error || 'Failed to save route')
            }
        } catch (error) {
            toast.error('Connection error')
        }
    }

    const handleDeleteRoute = async (id: string) => {
        if (!confirm('Delete this transport route? Unassigned students will be dropped from the route.')) return
        try {
            const res = await fetch(`/api/transport/${id}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success('Route deleted')
                fetchRoutes()
            }
        } catch (error) {
            toast.error('Failed to delete route')
        }
    }

    const openCreateModal = () => {
        setEditingRoute(null)
        setRouteForm({
            name: '',
            driver: '',
            vehicleNumber: '',
            monthlyFee: '',
            capacity: '40',
            stops: ''
        })
        setShowRouteModal(true)
    }

    const openEditModal = (route: any) => {
        setEditingRoute(route)
        setRouteForm({
            name: route.name,
            driver: route.driver || '',
            vehicleNumber: route.vehicleNumber || '',
            monthlyFee: route.monthlyFee.toString(),
            capacity: route.capacity.toString(),
            stops: route.stops.join(', ')
        })
        setShowRouteModal(true)
    }

    const openRosterModal = (route: any) => {
        setEditingRoute(route)
        setShowRosterModal(true)
    }

    const handleAssignStudent = async (studentId: string, action: 'add' | 'remove') => {
        try {
            const res = await fetch(`/api/transport/${editingRoute.id}/roster`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId, action })
            })
            if (res.ok) {
                toast.success(`Student ${action === 'add' ? 'added to' : 'removed from'} route`)
                fetchRoutes()
                // Update local state temporarily for snappy UI
                setEditingRoute((prev: any) => {
                    if (action === 'add') {
                        const s = allStudents.find(stu => stu.id === studentId);
                        if (s) {
                            return { ...prev, students: [...prev.students, s] }
                        }
                        return prev;
                    } else {
                        return { ...prev, students: prev.students.filter((s: any) => s.id !== studentId) }
                    }
                })
            } else {
                toast.error('Failed to update roster')
            }
        } catch (error) {
            toast.error('Connection error')
        }
    }

    const handleStartRun = async (route: any) => {
        try {
            const res = await fetch(`/api/transport/${route.id}/runs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ direction: 'DROPOFF' })
            })
            if (res.ok) {
                const run = await res.json()
                setActiveRun(run)
                setShowActiveRunModal(true)
                toast.success('Transport trip started! Live mode active.')
            } else {
                toast.error('Failed to start run')
            }
        } catch (error) {
            toast.error('Connection error')
        }
    }

    const handleUpdatePassengerStatus = async (studentId: string, status: string) => {
        if (!activeRun) return
        try {
            const res = await fetch(`/api/transport/runs/${activeRun.id}/dropoff`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId, status })
            })
            if (res.ok) {
                toast.success(`Student flagged safely! Notification dispatched to parent.`)
                // Refresh active run state
                setActiveRun((prev: any) => {
                    const newPassengers = prev.passengers.map((p: any) =>
                        p.studentId === studentId ? { ...p, status } : p
                    )
                    return { ...prev, passengers: newPassengers }
                })
            } else {
                toast.error('Failed to update student')
            }
        } catch (error) {
            toast.error('Connection error')
        }
    }

    const handleEndRun = async () => {
        if (!activeRun) return
        if (!confirm('Are you sure you want to officially end this transport trip?')) return
        try {
            const res = await fetch(`/api/transport/runs/${activeRun.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'COMPLETED' })
            })
            if (res.ok) {
                toast.success('Transport run finished and archived!')
                setShowActiveRunModal(false)
                setActiveRun(null)
            }
        } catch (error) {
            toast.error('Failed to end run')
        }
    }

    const totalStudentsOnRoutes = routes.reduce((sum, route) => sum + route.students.length, 0)

    const filteredStudentsForRoster = allStudents.filter(s =>
        (s.firstName.toLowerCase().includes(rosterSearch.toLowerCase()) || s.lastName.toLowerCase().includes(rosterSearch.toLowerCase())) &&
        // Filter out students already assigned elsewhere if we want strict one-route-per-student
        // Or just show all unassigned or currently assigned to THIS route
        (s.transportRouteId === null || s.transportRouteId === editingRoute?.id)
    )

    return (
        <DashboardLayout>
            <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground dark:text-white italic uppercase">Transport</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Coordinate school transport and driver schedules</p>
                    </div>
                    {(session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'PRINCIPAL') && (
                        <Button onClick={openCreateModal} className="h-11 bg-slate-900 hover:bg-slate-800 text-slate-50 dark:bg-white dark:text-foreground dark:hover:bg-muted rounded-xl px-6 font-semibold shadow-lg">
                            <Plus size={18} className="mr-2" />
                            New Route
                        </Button>
                    )}
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-white dark:bg-slate-950 rounded-2xl ring-1 ring-slate-100 dark:ring-slate-900 shadow-sm flex items-center gap-4">
                        <div className="h-10 w-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600">
                            <Bus size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] tracking-wider font-bold text-slate-400 uppercase italic">Fleets</p>
                            <p className="text-lg font-bold">{routes.length} Active</p>
                        </div>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-950 rounded-2xl ring-1 ring-slate-100 dark:ring-slate-900 shadow-sm flex items-center gap-4">
                        <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-600">
                            <Users size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] tracking-wider font-bold text-slate-400 uppercase italic">Commuters</p>
                            <p className="text-lg font-bold">{totalStudentsOnRoutes} Daily</p>
                        </div>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-950 rounded-2xl ring-1 ring-slate-100 dark:ring-slate-900 shadow-sm flex items-center gap-4">
                        <div className="h-10 w-10 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center text-purple-600">
                            <MapPin size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] tracking-wider font-bold text-slate-400 uppercase italic">Network</p>
                            <p className="text-lg font-bold">{routes.reduce((acc, r) => acc + r.stops.length, 0)} Stops</p>
                        </div>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-950 rounded-2xl ring-1 ring-slate-100 dark:ring-slate-900 shadow-sm flex items-center gap-4">
                        <div className="h-10 w-10 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-amber-600">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] tracking-wider font-bold text-slate-400 uppercase italic">Safety</p>
                            <p className="text-lg font-bold italic">Certified</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {loading ? (
                        <div className="col-span-1 lg:col-span-2 text-center py-12">
                            <div className="spinner mx-auto" style={{ width: 30, height: 30 }} />
                        </div>
                    ) : routes.length === 0 ? (
                        <div className="col-span-1 lg:col-span-2 text-center py-12 text-slate-500">
                            <Bus size={48} className="mx-auto opacity-20 mb-4" />
                            <p>No transport routes established yet.</p>
                        </div>
                    ) : routes.map((route) => (
                        <Card key={route.id} className="border-none shadow-sm flex flex-col justify-between bg-white dark:bg-slate-950 rounded-[2rem] overflow-hidden ring-1 ring-slate-100 dark:ring-slate-900 group hover:shadow-xl transition-all duration-500">
                            <div>
                                <CardHeader className="p-8 pb-4">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <CardTitle className="text-xl font-bold">{route.name}</CardTitle>
                                            <CardDescription className="flex items-center gap-2">
                                                <span className="font-semibold text-slate-400">Driver:</span>
                                                <span className="text-foreground dark:text-white font-medium">{route.driver || 'Unassigned'}</span>
                                            </CardDescription>
                                        </div>
                                        <Badge variant="outline" className="bg-slate-900 text-white dark:bg-white dark:text-foreground border-none font-bold px-3 py-1 rounded-lg">
                                            {route.students.length} / {route.capacity}
                                        </Badge>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-8 pt-4 space-y-8">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] cursor-default font-bold text-slate-400">Vehicle Number</Label>
                                            <p className="text-sm font-bold text-foreground dark:text-white">{route.vehicleNumber || 'Unassigned'}</p>
                                        </div>
                                        <div className="space-y-1 text-right lg:text-left">
                                            <Label className="text-[10px] cursor-default font-bold text-slate-400">Monthly Fee</Label>
                                            <p className="text-sm font-bold text-foreground dark:text-white">KES {parseFloat(route.monthlyFee).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-[10px] cursor-default font-bold text-slate-400">Route Stops</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {route.stops && route.stops.length > 0 ? route.stops.map((stop: string, idx: number) => (
                                                <div key={idx} className="flex items-center gap-2">
                                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                                                        {stop}
                                                    </div>
                                                    {idx < route.stops.length - 1 && <ChevronRight size={14} className="text-slate-200" />}
                                                </div>
                                            )) : (
                                                <span className="text-xs text-slate-400 italic">No stops added</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-[10px] cursor-default font-bold text-slate-400">Assigned Students ({route.students.length})</Label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {route.students.slice(0, 4).map((student: any, idx: number) => (
                                                <div key={idx} className="flex items-center gap-3 p-3 bg-muted dark:bg-slate-900/50 rounded-xl border border-border dark:border-slate-800">
                                                    <div className="h-8 w-8 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 border border-border dark:border-slate-700">
                                                        <User size={14} />
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{student.firstName} {student.lastName}</span>
                                                </div>
                                            ))}
                                            {route.students.length > 4 && (
                                                <div className="flex items-center gap-3 p-3 bg-muted dark:bg-slate-900/50 rounded-xl border border-border dark:border-slate-800">
                                                    <span className="text-xs font-bold text-slate-500 pl-2">+{route.students.length - 4} more</span>
                                                </div>
                                            )}
                                            {route.students.length === 0 && (
                                                <span className="text-xs text-slate-400 italic col-span-2">No students assigned to this route</span>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </div>

                            {(session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'PRINCIPAL') && (
                                <CardFooter className="p-8 pt-0 flex justify-end flex-wrap gap-3">
                                    <Button onClick={() => handleDeleteRoute(route.id)} variant="ghost" className="h-10 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 font-bold text-xs italic">
                                        <Trash2 size={14} className="mr-1" />
                                        Delete
                                    </Button>
                                    <Button onClick={() => openEditModal(route)} variant="ghost" className="h-10 rounded-xl text-primary-600 hover:bg-primary-50 font-bold text-xs italic">
                                        <Edit size={14} className="mr-1" />
                                        Edit Route
                                    </Button>
                                    <Button onClick={() => openRosterModal(route)} variant="outline" className="h-10 rounded-xl border-primary-100 text-primary-700 font-bold text-xs bg-primary-50/30 hover:bg-primary-50 italic">
                                        <Users size={14} className="mr-1" />
                                        Student Roster
                                    </Button>
                                    <Button onClick={() => handleStartRun(route)} className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs italic shadow-md">
                                        <Play size={14} className="mr-1" />
                                        Start Trip
                                    </Button>
                                </CardFooter>
                            )}
                        </Card>
                    ))}
                </div>

                {/* Route Form Modal */}
                {showRouteModal && (
                    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowRouteModal(false) }}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">{editingRoute ? 'Edit Route' : 'New Route'}</h3>
                                <button className="btn btn-ghost btn-sm" onClick={() => setShowRouteModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleSaveRoute}>
                                <div className="modal-body space-y-4">
                                    <div className="form-group mb-0">
                                        <Label className="mb-2 block">Route Name</Label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            required
                                            value={routeForm.name}
                                            onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })}
                                            placeholder="e.g. Route A - Westlands"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="form-group mb-0">
                                            <Label className="mb-2 block">Driver Name</Label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={routeForm.driver}
                                                onChange={(e) => setRouteForm({ ...routeForm, driver: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group mb-0">
                                            <Label className="mb-2 block">Vehicle Number</Label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={routeForm.vehicleNumber}
                                                onChange={(e) => setRouteForm({ ...routeForm, vehicleNumber: e.target.value })}
                                                placeholder="e.g. KCA 123X"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="form-group mb-0">
                                            <Label className="mb-2 block">Monthly Fee (KES)</Label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                required
                                                min="0"
                                                value={routeForm.monthlyFee}
                                                onChange={(e) => setRouteForm({ ...routeForm, monthlyFee: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group mb-0">
                                            <Label className="mb-2 block">Capacity (Seats)</Label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                required
                                                min="1"
                                                value={routeForm.capacity}
                                                onChange={(e) => setRouteForm({ ...routeForm, capacity: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group mb-0">
                                        <Label className="mb-2 block">Stops (Comma separated)</Label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={routeForm.stops}
                                            onChange={(e) => setRouteForm({ ...routeForm, stops: e.target.value })}
                                            placeholder="Westlands, Parklands, Highridge"
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <Button type="button" variant="outline" className="rounded-xl border-slate-200" onClick={() => setShowRouteModal(false)}>Cancel</Button>
                                    <Button type="submit" className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
                                        <Save size={16} className="mr-2" />
                                        {editingRoute ? 'Save Changes' : 'Create Route'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Roster Modal */}
                {showRosterModal && editingRoute && (
                    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowRosterModal(false) }}>
                        <div className="modal-content modal-content--wide" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">Student Roster: {editingRoute.name}</h3>
                                <button className="btn btn-ghost btn-sm" onClick={() => setShowRosterModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="modal-body space-y-4">
                                <div className="relative">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search active students by name..."
                                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                                        value={rosterSearch}
                                        onChange={e => setRosterSearch(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {filteredStudentsForRoster.length === 0 ? (
                                        <p className="text-center text-slate-400 py-8 text-sm italic">No students match your search.</p>
                                    ) : filteredStudentsForRoster.map(student => {
                                        const isAssigned = editingRoute.students.some((s: any) => s.id === student.id)
                                        return (
                                            <div key={student.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:border-slate-300 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-bold text-xs">
                                                        {student.firstName[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">{student.firstName} {student.lastName}</p>
                                                        <p className="text-xs text-slate-500">Adm: {student.admissionNumber}</p>
                                                    </div>
                                                </div>

                                                {isAssigned ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleAssignStudent(student.id, 'remove')}
                                                        className="text-red-500 hover:text-red-600 hover:bg-red-50 bg-red-50/50 rounded-lg h-8 px-3 ml-auto"
                                                    >
                                                        <UserMinus size={14} className="mr-1" /> Remove
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleAssignStudent(student.id, 'add')}
                                                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 bg-emerald-50/50 rounded-lg h-8 px-3 ml-auto"
                                                    >
                                                        <UserPlus size={14} className="mr-1" /> Assign
                                                    </Button>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <Button type="button" variant="outline" className="rounded-xl border-slate-200" onClick={() => setShowRosterModal(false)}>Close Roster</Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Active Run / Conductor Modal */}
                {showActiveRunModal && activeRun && (
                    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowActiveRunModal(false) }}>
                        <div className="modal-content modal-content--wide" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <div>
                                    <h3 className="modal-title flex items-center gap-2">
                                        <Bus size={18} className="text-emerald-600" />
                                        Live Conductor Mode
                                    </h3>
                                    <p className="text-xs text-slate-500 font-bold">Driver: {activeRun.driverName}</p>
                                </div>
                                <button className="btn btn-ghost btn-sm" onClick={() => setShowActiveRunModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="modal-body space-y-4">
                                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {activeRun.passengers.length === 0 ? (
                                        <p className="text-center text-slate-400 py-8 text-sm italic">No students are boarded to this route.</p>
                                    ) : activeRun.passengers.map((p: any) => {
                                        return (
                                            <div key={p.id} className={cn("flex items-center justify-between p-3 border rounded-xl transition-colors", p.status === 'DROPPED_OFF' ? "bg-emerald-50/50 border-emerald-100" : "bg-white border-slate-100")}>
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg font-bold text-xs", p.status === 'DROPPED_OFF' ? "bg-emerald-100 text-emerald-700" : "bg-blue-50 text-blue-600")}>
                                                        {p.student.firstName[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">{p.student.firstName} {p.student.lastName}</p>
                                                        <p className={cn("text-xs font-semibold", p.status === 'DROPPED_OFF' ? "text-emerald-600" : "text-amber-500")}>
                                                            {p.status === 'DROPPED_OFF' ? "Completed" : "In Transit"}
                                                        </p>
                                                    </div>
                                                </div>

                                                {p.status === 'DROPPED_OFF' ? (
                                                    <Badge variant="outline" className="bg-emerald-100 border-none text-emerald-700 font-bold"><CheckCircle2 size={12} className="mr-1" /> Safely Home</Badge>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleUpdatePassengerStatus(p.studentId, 'DROPPED_OFF')}
                                                        className="text-white hover:bg-emerald-500 bg-emerald-600 rounded-lg h-8 px-4 ml-auto shadow-sm tracking-wide font-bold"
                                                    >
                                                        Log Drop Off
                                                    </Button>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                            <div className="modal-footer justify-between">
                                <span className="text-xs text-slate-400 font-bold italic hidden sm:block">Marking 'Drop Off' instantly notifies parent via SMS/Email.</span>
                                <div>
                                    <Button type="button" variant="outline" className="rounded-xl border-slate-200 mr-2" onClick={() => setShowActiveRunModal(false)}>Minimize</Button>
                                    <Button type="button" onClick={handleEndRun} className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white">End Trip</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
