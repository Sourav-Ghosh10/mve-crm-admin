import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Calendar,
    Clock,
    MapPin,
    Smartphone,
    // User as UserIcon,
    AlertCircle,
    Coffee,
    LogOut,
    LogIn,
    Timer,
    History
} from "lucide-react";
import { cn } from "../../lib/utils";
import { attendanceService } from "../../services/attendanceService";
import type { Attendance } from "../../types/attendance.types";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/common/Card";
import Button from "../../components/common/Button";
import BackButton from "../../components/common/BackButton";
import GlobalLoader from "../../components/common/LoadingSpinner/GlobalLoader";
import Avatar from "../../components/common/Avatar";
import TimezoneDualView from "../../components/common/TimezoneDualView";
import { formatInTimeZone } from "date-fns-tz";
import { useAppSelector } from "../../store/hooks";
import TimezoneToggle from "../../components/common/TimezoneToggle";
import { getOfficeTimezone } from "../../utils/dateUtils";


// Dynamic interactive Leaflet Map Component (100% Client-Side & Plug-and-Play)
export const LeafletMap: React.FC<{
    points: { lat: number; lng: number; label: string; time?: string; type?: string; address?: string }[]
}> = ({ points }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);

    useEffect(() => {
        if (!mapRef.current || points.length === 0) return;

        const loadLeaflet = () => {
            if ((window as any).L) {
                initMap();
                return;
            }

            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);

            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = () => initMap();
            document.body.appendChild(script);
        };

        const initMap = () => {
            const L = (window as any).L;
            if (!L || !mapRef.current) return;

            if (mapInstance.current) {
                mapInstance.current.remove();
            }

            const validPoints = points.filter(p => p.lat && p.lng);
            if (validPoints.length === 0) return;

            const center = [validPoints[0].lat, validPoints[0].lng] as [number, number];
            const map = L.map(mapRef.current).setView(center, 13);
            mapInstance.current = map;

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            const latlngs = validPoints.map(p => [p.lat, p.lng]);
            const polyline = L.polyline(latlngs, { color: '#6366f1', weight: 4, opacity: 0.8 }).addTo(map);
            
            validPoints.forEach((p) => {
                let color = '#f59e0b'; // default tracking
                if (p.type === 'clock_in') color = '#22c55e';
                if (p.type === 'clock_out') color = '#ef4444';

                const customMarkerHtml = `
                    <div style="
                        background-color: ${color}; 
                        width: 14px; 
                        height: 14px; 
                        border-radius: 50%; 
                        border: 2px solid white; 
                        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    "></div>
                `;

                const icon = L.divIcon({
                    html: customMarkerHtml,
                    className: 'custom-div-icon',
                    iconSize: [14, 14],
                    iconAnchor: [7, 7]
                });

                const popupContent = `
                    <div style="font-family: inherit; font-size: 11px; padding: 2px; min-width: 120px;">
                        <b style="text-transform: uppercase; color: ${color};">${p.label}</b>
                        ${p.time ? `<br/><b>Time:</b> ${p.time}` : ''}
                        ${p.address ? `<br/><span style="color: #666; font-size: 10px; display: block; margin-top: 4px;">${p.address}</span>` : ''}
                    </div>
                `;

                L.marker([p.lat, p.lng], { icon })
                    .addTo(map)
                    .bindPopup(popupContent);
            });

            if (validPoints.length > 1) {
                map.fitBounds(polyline.getBounds(), { padding: [30, 30] });
            }
        };

        loadLeaflet();

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, [points]);

    return (
        <div 
            ref={mapRef} 
            className="w-full h-full rounded-2xl overflow-hidden border border-border/40 shadow-inner" 
            style={{ minHeight: '350px', background: '#f1f5f9' }} 
        />
    );
};

const AttendanceDetails: React.FC = () => {
    const { date, userId } = useParams<{ date: string; userId: string }>();
    const navigate = useNavigate();
    const [record, setRecord] = useState<Attendance | null>(null);
    const [loading, setLoading] = useState(true);
    const timezoneView = useAppSelector((state) => state.ui.timezoneView);
    const dateKey = (date || "").slice(0, 10);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!dateKey || !userId) return;
            try {
                // Backend expects YYYY-MM-DD; avoid ISO timestamps in the URL
                const data = await attendanceService.getByDateAndUser(dateKey, userId);
                setRecord(data);
            } catch (error) {
                console.error("Failed to fetch attendance details:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [dateKey, userId]);

    if (loading) return <GlobalLoader fullScreen message="Syncing records..." />;

    if (!record) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <AlertCircle className="w-12 h-12 text-error" />
                <h2 className="text-xl font-bold">Record not found</h2>
                <Button onClick={() => navigate("/attendance")}>Back to Log</Button>
            </div>
        );
    }

    const employeeTimezone = record.employeeId?.employment?.timezone || 'Asia/Kolkata';
    const adminTimezone = getOfficeTimezone();
    const activeTimezone = timezoneView === 'employee' ? employeeTimezone : adminTimezone;

    const formatTime = (timeStr?: string) => {
        if (!timeStr) return "--:--";
        try {
            return formatInTimeZone(new Date(timeStr), activeTimezone, 'hh:mm:ss a');
        } catch {
            return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }
    };

    const formatDate = (dateStr: string) => {
        try {
            return formatInTimeZone(new Date(dateStr), activeTimezone, 'EEEE, MMMM dd, yyyy');
        } catch {
            return new Date(dateStr).toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    };

    const sessions = record.sessions || [];
    const breaks = record.breaks || [];
    const isCurrentlyActive = sessions.length > 0 && !sessions[sessions.length - 1].checkOut;

    const stripSeconds = (durationStr?: string) => {
        if (!durationStr) return "";
        const stripped = durationStr.replace(/\s*\d+s\s*$/i, "").trim();
        return stripped || "0M";
    };

    const formatDuration = (minutes?: number, forceHours: boolean = false) => {
        const mVal = minutes || 0;
        const totalMinutes = Math.floor(mVal);
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;

        const parts = [];
        if (h > 0 || forceHours) parts.push(`${h}h`);
        if (m > 0 || (h > 0 && m === 0) || h === 0) parts.push(`${m}m`);

        return parts.join(' ');
    };

    // Construct Map coordinates timeline
    const timelineData = record.timeline || [];
    const mapPoints = timelineData.map((rec: any) => {
        let label = 'GPS Track';
        if (rec.type === 'clock_in') label = 'Check In';
        if (rec.type === 'clock_out') label = 'Check Out';
        if (rec.type === 'break_start') label = 'Break Start';
        if (rec.type === 'break_end') label = 'Break End';
        if (rec.type === 'location_update') label = 'GPS Track';

        let timeStr = '';
        const eventTime = rec.time || rec.loginAt;
        try {
            timeStr = formatInTimeZone(new Date(eventTime), activeTimezone, 'hh:mm a');
        } catch {
            timeStr = new Date(eventTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        return {
            lat: rec.latitude,
            lng: rec.longitude,
            label,
            time: timeStr,
            type: rec.type,
            address: rec.address
        };
    });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto px-4 lg:px-6 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                    <BackButton onClick={() => navigate("/attendance")} label="Back to Attendance" className="mb-2" />
                    <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight flex items-center gap-3">
                        Attendance Detail
                        {record.isLate && (
                            <span className="px-3 py-1 bg-warning/10 text-warning border border-warning/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                                Late Arrival
                            </span>
                        )}
                        {record.isHoliday && (
                            <span className="px-3 py-1 bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                                Public Holiday
                            </span>
                        )}
                    </h1>
                    <p className="text-foreground-tertiary font-medium flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {formatDate(record.date)}
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <TimezoneToggle variant="horizontal" />
                </div>
            </div>

            {/* Holiday Banner */}
            {record.isHoliday && (
                <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 rounded-[2rem] p-6 flex items-center gap-6 animate-in slide-in-from-top-4 duration-500">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-600 shadow-xl shadow-indigo-500/10">
                        <Calendar className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-indigo-900">{record.holidayName}</h3>
                        <p className="text-sm font-bold text-indigo-600/70">This day was marked as an official holiday.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                {/* Left Column: Summary & Employee */}
                <div className="lg:col-span-4 space-y-6">
                    {/* User Card */}
                    <Card variant="bordered" className="rounded-xl sm:rounded-xl bg-surface shadow-md overflow-hidden border-primary/5">
                        <div className="h-24 bg-gradient-to-br from-primary to-primary-dark" />
                        <CardContent className="relative pt-0 px-6 pb-8">
                            <div className="flex justify-center -mt-12 mb-4">
                                <div className="w-24 h-24 rounded-3xl bg-surface p-1.5 shadow-xl border-4 border-surface overflow-hidden">
                                    <Avatar
                                        src={record.profilePicture || record.employeeId?.personalInfo?.profilePicture}
                                        firstName={record.name?.split(' ')[0] || record.employeeId?.personalInfo?.firstName || ''}
                                        lastName={record.name?.split(' ')[1] || record.employeeId?.personalInfo?.lastName || ''}
                                        objectFit="contain"
                                        className="rounded-2xl h-full w-full"
                                    />
                                </div>
                            </div>
                            <div className="text-center space-y-1">
                                <h3 className="text-xl font-black text-foreground">
                                    {record.name || record.employeeId?.fullName ||
                                        `${record.employeeId?.personalInfo?.firstName || ''} ${record.employeeId?.personalInfo?.lastName || ''}`.trim() ||
                                        "Unknown Employee"}
                                </h3>
                                <p className="text-sm font-bold text-foreground-tertiary">
                                    {record.email || record.employeeId?.personalInfo?.email || `@${record.employeeId?.username || ''}`}
                                </p>
                                <div className="pt-4 flex flex-wrap justify-center gap-2">
                                    <span className={cn(
                                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all",
                                        record.status === 'present' ? "bg-success/10 text-success border-success/20" : "bg-muted text-foreground-tertiary border-border"
                                    )}>
                                        {record.status}
                                    </span>
                                    {isCurrentlyActive && (
                                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-primary/10 text-primary border-primary/20 animate-pulse">
                                            Currently Active
                                        </span>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stats Summary */}
                    <Card variant="default" className="rounded-xl sm:rounded-xl border-border/50 shadow-soft overflow-hidden">
                        <CardHeader className="bg-muted/30 border-b border-border/50 px-8 py-5">
                            <CardTitle className="text-xs font-black uppercase tracking-widest text-foreground-tertiary flex items-center gap-2">
                                <Timer className="w-4 h-4" />
                                Day Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-3xl bg-primary/5 border border-primary/10">
                                    <p className="text-[10px] font-black text-primary uppercase mb-1">Work Hours</p>
                                    <p className="text-2xl font-black text-foreground">
                                        {!record.checkOut && isCurrentlyActive ? (
                                            <span className="text-primary text-sm animate-pulse">ONGOING</span>
                                        ) : (
                                            stripSeconds(record.totalDurationString) || formatDuration(record.totalHours * 60)
                                        )}
                                    </p>
                                </div>
                                <div className="p-4 rounded-3xl bg-accent/5 border border-accent/10">
                                    <p className="text-[10px] font-black text-accent uppercase mb-1">Break Time</p>
                                    <p className="text-2xl font-black text-foreground">
                                        {stripSeconds(record.totalBreakDurationString) || formatDuration(record.breakTime)}
                                    </p>
                                </div>
                            </div>

                            {record.overtime > 0 && (
                                <div className="p-4 rounded-3xl bg-indigo-500/5 border border-indigo-500/10 mb-4 animate-in zoom-in duration-500">
                                    <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">Overtime Earned</p>
                                    <p className="text-2xl font-black text-indigo-900 flex items-baseline gap-2">
                                        {formatDuration(record.overtime * 60, true)}
                                        <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">(Hours)</span>
                                    </p>
                                </div>
                            )}

                            <div className="space-y-4 pt-2">
                                <div className="space-y-1.5 group">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-3 text-foreground-secondary font-bold">
                                            <div className="w-8 h-8 rounded-xl bg-success/10 flex items-center justify-center text-success">
                                                <LogIn className="w-4 h-4" />
                                            </div>
                                            First Check In
                                        </div>
                                        <span className="font-mono text-foreground font-black bg-muted/30 px-3 py-1 rounded-lg">
                                            {formatTime(record.checkIn?.time)}
                                        </span>
                                    </div>
                                    {record.checkIn?.address && (
                                        <div className="pl-11 text-xs text-foreground-tertiary flex items-start gap-1">
                                            <MapPin className="w-3.5 h-3.5 text-foreground-tertiary flex-shrink-0 mt-0.5" />
                                            <span className="leading-normal hover:underline cursor-pointer" title={record.checkIn.address}>{record.checkIn.address}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1.5 group">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-3 text-foreground-secondary font-bold">
                                            <div className="w-8 h-8 rounded-xl bg-error/10 flex items-center justify-center text-error">
                                                <LogOut className="w-4 h-4" />
                                            </div>
                                            Last Check Out
                                        </div>
                                        <span className={cn(
                                            "font-mono font-black px-3 py-1 rounded-lg",
                                            isCurrentlyActive ? "text-primary bg-primary/10 animate-pulse" : "text-foreground bg-muted/30"
                                        )}>
                                            {isCurrentlyActive ? "ONGOING" : formatTime(record.checkOut?.time)}
                                        </span>
                                    </div>
                                    {record.checkOut?.address && !isCurrentlyActive && (
                                        <div className="pl-11 text-xs text-foreground-tertiary flex items-start gap-1">
                                            <MapPin className="w-3.5 h-3.5 text-foreground-tertiary flex-shrink-0 mt-0.5" />
                                            <span className="leading-normal hover:underline cursor-pointer" title={record.checkOut.address}>{record.checkOut.address}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Timeline & Sessions */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Device & Network Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="rounded-3xl border-border/50 shadow-soft p-4 bg-surface hover:border-primary/20 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                                    <Smartphone className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-foreground-tertiary uppercase tracking-widest">Device Details</p>
                                    <p className="text-sm font-bold text-foreground">{record.checkIn?.deviceInfo || "Standard Browser"}</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="rounded-3xl border-border/50 shadow-soft p-4 bg-surface hover:border-primary/20 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-foreground-tertiary uppercase tracking-widest">Network Access</p>
                                    <p className="text-sm font-bold text-foreground font-mono">{record.checkIn?.ipAddress || "Hidden"}</p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* GPS Movement Timeline Map */}
                    {mapPoints.length > 0 && (
                        <Card variant="bordered" className="rounded-3xl border-border/50 shadow-md bg-surface overflow-hidden">
                            <CardHeader className="bg-muted/10 border-b border-border/50 px-6 py-4">
                                <CardTitle className="text-xl font-black tracking-tight flex items-center gap-3 text-foreground">
                                    <MapPin className="w-6 h-6 text-primary" />
                                    Shift Movement Route & History
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="md:col-span-2 h-[350px] relative z-10">
                                        <LeafletMap points={mapPoints} />
                                    </div>
                                    <div className="h-[350px] overflow-y-auto pr-2 space-y-3">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground-tertiary border-b border-border/40 pb-2">Captured Coordinates</h4>
                                        <div className="divide-y divide-border/40">
                                            {mapPoints.map((pt: any, idx: number) => (
                                                <div key={idx} className="py-2.5 space-y-1">
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className={cn(
                                                            "font-black uppercase text-[9px] px-2 py-0.5 rounded-md",
                                                            pt.type === 'clock_in' && "bg-success/10 text-success",
                                                            pt.type === 'clock_out' && "bg-error/10 text-error",
                                                            pt.type === 'break_start' && "bg-accent/10 text-accent",
                                                            pt.type === 'break_end' && "bg-indigo-500/10 text-indigo-600",
                                                            (pt.type === 'tracking' || pt.type === 'location_update') && "bg-warning/10 text-warning"
                                                        )}>
                                                            {pt.label}
                                                        </span>
                                                        <span className="font-mono text-[10px] text-foreground-tertiary">{pt.time}</span>
                                                    </div>
                                                    <p className="text-[10px] text-foreground-secondary leading-normal">
                                                        {pt.address || (
                                                            pt.type === 'break_start' ? "Started break period" :
                                                            pt.type === 'break_end' ? "Resumed standard shift" :
                                                            "Resolving address..."
                                                        )}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Sessions Timeline */}
                    <Card variant="bordered" className="rounded-3xl border-border/50 shadow-md bg-surface overflow-hidden">
                        <CardHeader className="bg-muted/10 border-b border-border/50 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl font-black tracking-tight flex items-center gap-3 text-foreground">
                                    <History className="w-6 h-6 text-primary" />
                                    Work Sessions
                                </CardTitle>
                                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg">
                                    {sessions.length} Segments
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-border/40">
                                {sessions.length > 0 ? (
                                    sessions.map((session, idx) => (
                                        <div key={session._id} className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-muted/10 transition-colors">
                                            <div className="flex items-center gap-6">
                                                <div className="w-10 h-10 rounded-2xl bg-muted/50 border border-border flex items-center justify-center font-black text-foreground-tertiary text-xs">
                                                    #{idx + 1}
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-3">
                                                        <TimezoneDualView
                                                            startTime={session.checkIn.time}
                                                            endTime={session.checkOut?.time}
                                                            primaryTimezone={record.employeeId?.employment?.timezone || 'Asia/Kolkata'}
                                                            secondaryTimezone={adminTimezone}
                                                            variant="minimal"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-3.5 h-3.5 text-foreground-tertiary" />
                                                        <span className="text-xs font-bold text-foreground-tertiary uppercase">
                                                            Duration: <span className="text-foreground">
                                                                {session.checkOut
                                                                    ? (stripSeconds(session.durationString) || formatDuration(session.duration * 60))
                                                                    : <span className="text-primary animate-pulse text-[10px]">ONGOING</span>}
                                                            </span>
                                                        </span>
                                                    </div>
                                                    {session.checkIn.address && (
                                                        <div className="flex items-start gap-1.5 mt-1 max-w-[320px] sm:max-w-[450px]">
                                                            <MapPin className="w-3 h-3 text-success flex-shrink-0 mt-0.5" />
                                                            <span className="text-[11px] text-foreground-tertiary font-medium leading-normal" title={session.checkIn.address}>
                                                                Check-In: <span className="text-foreground-secondary">{session.checkIn.address}</span>
                                                            </span>
                                                        </div>
                                                    )}
                                                    {session.checkOut?.address && (
                                                        <div className="flex items-start gap-1.5 mt-0.5 max-w-[320px] sm:max-w-[450px]">
                                                            <MapPin className="w-3 h-3 text-error flex-shrink-0 mt-0.5" />
                                                            <span className="text-[11px] text-foreground-tertiary font-medium leading-normal" title={session.checkOut.address}>
                                                                Check-Out: <span className="text-foreground-secondary">{session.checkOut.address}</span>
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {session.isLate && (
                                                    <span className="px-3 py-1 bg-error/10 text-error text-[9px] font-black uppercase tracking-widest rounded-full border border-error/10">Late</span>
                                                )}
                                                {session.isEarlyLeave && (
                                                    <span className="px-3 py-1 bg-amber-500/10 text-amber-600 text-[9px] font-black uppercase tracking-widest rounded-full border border-amber-500/10">Early Leave</span>
                                                )}
                                                {!session.isLate && !session.isEarlyLeave && (
                                                    <span className="px-3 py-1 bg-success/10 text-success text-[9px] font-black uppercase tracking-widest rounded-full border border-success/10">Standard</span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-12 text-center">
                                        <p className="text-foreground-tertiary font-bold">No interactive sessions recorded for this day.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Breaks Section */}
                    {breaks.length > 0 && (
                        <Card variant="bordered" className="rounded-xl sm:rounded-xl border-border/50 shadow-md bg-surface overflow-hidden">
                            <CardHeader className="bg-muted/20 border-b border-border/50 px-8 py-6">
                                <CardTitle className="text-xl font-black tracking-tight flex items-center gap-3 text-foreground">
                                    <Coffee className="w-6 h-6 text-accent" />
                                    Break Breakdown
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-border/50 overflow-y-auto max-h-[235px]">
                                    {breaks.map((b, idx) => (
                                        <div key={b._id} className="p-6 sm:p-8 flex items-center justify-between hover:bg-muted/20 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center font-black text-accent text-[10px]">
                                                    B{idx + 1}
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-black text-foreground font-mono">{formatTime(b.startTime)}</span>
                                                        <span className="text-foreground-tertiary">→</span>
                                                        <span className="text-sm font-black text-foreground font-mono">{formatTime(b.endTime)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-black text-foreground uppercase tracking-widest">
                                                    {stripSeconds(b.durationString) || formatDuration(b.duration)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AttendanceDetails;
