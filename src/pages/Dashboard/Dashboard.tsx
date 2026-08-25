import React, { useState, useEffect } from "react";
import { Users, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { cn } from "../../lib/utils";
import { dashboardService, type AdminDashboardStats } from "../../services/dashboardService";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: string; positive: boolean };
  borderColor: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  borderColor,
}) => (
  <div
    className={cn(
      "bg-surface p-4 sm:p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300",
      `border-t-4 ${borderColor}`,
    )}
  >
    <div className="flex justify-between items-start mb-4">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
    </div>
    <div className="text-3xl font-bold text-primary mb-1">{value}</div>
    <div className="text-sm text-foreground-secondary">{title}</div>
    {trend && (
      <div
        className={cn(
          "flex items-center gap-1 mt-2 text-xs",
          trend.positive ? "text-success" : "text-error",
        )}
      >
        <TrendingUp
          className={cn("w-3 h-3", !trend.positive && "rotate-180")}
        />
        {trend.value}
      </div>
    )}
  </div>
);

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashboardService.getAdminDashboardStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase">Enterprise Overview</h1>
          <p className="text-foreground-tertiary text-xs font-bold uppercase tracking-widest mt-1">Operational Control Center</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-success/10 rounded-full border border-success/20">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-[10px] font-black text-success uppercase tracking-[0.2em]">Systems: Optimal</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Employees"
          value={stats?.totalEmployees || 0}
          icon={<Users className="w-6 h-6" />}
          borderColor="border-primary"
        />
        <StatCard
          title="Attendance Today"
          value={stats?.attendanceToday || 0}
          icon={<CheckCircle className="w-6 h-6" />}
          borderColor="border-success"
        />
        <StatCard
          title="Pending Leaves"
          value={stats?.pendingLeaves || 0}
          icon={<Clock className="w-6 h-6" />}
          borderColor="border-warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface p-4 sm:p-6 rounded-[2rem] border border-border/50 shadow-sm">
          <h2 className="text-sm font-black text-foreground uppercase tracking-widest mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {stats?.recentActivity?.length ? (
              stats.recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0"
                >
                  <div>
                    <span className="text-sm font-bold text-foreground">
                      {activity.user}
                    </span>
                    <span className="text-xs text-foreground-secondary">
                      {" "}
                      {activity.action}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-foreground-tertiary uppercase">
                    {activity.time}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-sm text-foreground-secondary py-4 text-center">No recent activity</div>
            )}
          </div>
        </div>

        <div className="bg-surface p-4 sm:p-6 rounded-[2rem] border border-border/50 shadow-sm">
          <h2 className="text-sm font-black text-foreground uppercase tracking-widest mb-6">Resource Allocation</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-success/5 border border-success/10">
              <span className="text-xs font-bold text-foreground-secondary uppercase tracking-wider">Present Today</span>
              <span className="text-lg font-black text-success">{stats?.resourceAllocation?.presentToday || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-error/5 border border-error/10">
              <span className="text-xs font-bold text-foreground-secondary uppercase tracking-wider">Absent Today</span>
              <span className="text-lg font-black text-error">{stats?.resourceAllocation?.absentToday || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-warning/5 border border-warning/10">
              <span className="text-xs font-bold text-foreground-secondary uppercase tracking-wider">On Leave</span>
              <span className="text-lg font-black text-warning">{stats?.resourceAllocation?.onLeave || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10">
              <span className="text-xs font-bold text-foreground-secondary uppercase tracking-wider">Late Arrivals</span>
              <span className="text-lg font-black text-primary">{stats?.resourceAllocation?.lateArrivals || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
