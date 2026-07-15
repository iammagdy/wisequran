import { useEffect, useState } from "react";
import { DK } from "./devkit-utils";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface VisitorSession {
  id: string;
  session_id: string;
  ip: string;
  org: string;
  city: string;
  country: string;
  device: string;
  bookmarks_count: number;
  hifz_count: number;
  tasbeeh_count: number;
  session_duration_seconds: number;
  last_active_at: string;
  created_at: string;
}

export default function VisitorsPanel() {
  const [sessions, setSessions] = useState<VisitorSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    if (!isSupabaseConfigured) {
      setError("Supabase is not configured in this environment.");
      setLoading(false);
      return;
    }

    try {
      const { data, error: err } = await supabase
        .from("visitor_analytics")
        .select("*")
        .order("created_at", { ascending: false });

      if (err) {
        throw err;
      }

      setSessions(data || []);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to fetch analytics data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSessions();
    const interval = setInterval(fetchSessions, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins < 60) return `${mins}m ${secs}s`;
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hrs}h ${remainingMins}m`;
  };

  const activeThreshold = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const activeSessionsCount = sessions.filter(s => s.last_active_at >= activeThreshold).length;

  // Aggregate stats
  const totalVisitors = sessions.length;
  
  // Group by company (org)
  const orgCounts: Record<string, number> = {};
  sessions.forEach(s => {
    const org = s.org || "Unknown Company";
    orgCounts[org] = (orgCounts[org] || 0) + 1;
  });
  const topCompanies = Object.entries(orgCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const totalBookmarks = sessions.reduce((acc, s) => acc + (s.bookmarks_count || 0), 0);
  const totalHifz = sessions.reduce((acc, s) => acc + (s.hifz_count || 0), 0);
  const totalTasbeeh = sessions.reduce((acc, s) => acc + (s.tasbeeh_count || 0), 0);
  const avgDuration = sessions.length 
    ? Math.round(sessions.reduce((acc, s) => acc + (s.session_duration_seconds || 0), 0) / sessions.length)
    : 0;

  return (
    <div className="space-y-4">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`rounded-lg p-4 ${DK.card}`}>
          <p className={`font-mono text-[10px] ${DK.subtle} uppercase tracking-wider`}>Total Sessions</p>
          <p className={`font-mono text-2xl font-bold ${DK.text} mt-1`}>{totalVisitors}</p>
        </div>
        <div className={`rounded-lg p-4 ${DK.card}`}>
          <p className={`font-mono text-[10px] ${DK.subtle} uppercase tracking-wider`}>Active Now (5m)</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-2.5 h-2.5 rounded-full ${activeSessionsCount > 0 ? "bg-[#3fb950] animate-pulse" : "bg-[#8b949e]"}`} />
            <p className={`font-mono text-2xl font-bold ${DK.text}`}>{activeSessionsCount}</p>
          </div>
        </div>
        <div className={`rounded-lg p-4 ${DK.card}`}>
          <p className={`font-mono text-[10px] ${DK.subtle} uppercase tracking-wider`}>Avg Session Time</p>
          <p className={`font-mono text-2xl font-bold ${DK.text} mt-1`}>{formatDuration(avgDuration)}</p>
        </div>
        <div className={`rounded-lg p-4 ${DK.card}`}>
          <p className={`font-mono text-[10px] ${DK.subtle} uppercase tracking-wider`}>Active Features Usage</p>
          <p className={`font-mono text-[10px] ${DK.muted} mt-1.5`}>
            🔖 {totalBookmarks} Bookmarks<br />
            🎯 {totalHifz} Hifz Surahs<br />
            📿 {totalTasbeeh} Tasbeehs
          </p>
        </div>
      </div>

      {/* Grid: Companies + Device Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Companies */}
        <div className={`rounded-lg p-4 ${DK.card} space-y-3`}>
          <p className={`font-mono text-xs font-semibold ${DK.text}`}>Top Companies / Organizations</p>
          {topCompanies.length === 0 ? (
            <p className={`font-mono text-xs ${DK.subtle}`}>No company data available.</p>
          ) : (
            <div className="space-y-2">
              {topCompanies.map(([org, count]) => (
                <div key={org} className="flex justify-between items-center text-xs font-mono">
                  <span className={`${DK.muted} truncate max-w-[80%]`} title={org}>{org}</span>
                  <span className={`${DK.blue} font-semibold`}>{count} ({Math.round((count / totalVisitors) * 100)}%)</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Refresh Status */}
        <div className={`rounded-lg p-4 ${DK.card} flex flex-col justify-between`}>
          <div className="space-y-1">
            <p className={`font-mono text-xs font-semibold ${DK.text}`}>Dashboard Status</p>
            <p className={`font-mono text-[11px] ${DK.muted}`}>
              Auto-refreshing every 15 seconds. Telemetry logs anonymous IP organization and app utilization statistics in real-time.
            </p>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => { setLoading(true); void fetchSessions(); }}
              disabled={loading}
              className={`${DK.btnBase} ${DK.btnGray} text-[11px] px-3 py-1.5`}
            >
              {loading ? "Refreshing..." : "Force Refresh"}
            </button>
            {error && <span className={`text-[10px] font-mono ${DK.red}`}>{error}</span>}
          </div>
        </div>
      </div>

      {/* Visitor Session Log Table */}
      <div className={`rounded-lg p-4 ${DK.card}`}>
        <p className={`font-mono text-xs font-semibold ${DK.text} mb-3`}>Visitor Log ({sessions.length})</p>
        {sessions.length === 0 ? (
          <p className={`font-mono text-xs ${DK.subtle} text-center py-6`}>No visitor sessions logged yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-[11px]">
              <thead>
                <tr className={`text-start ${DK.subtle} border-b ${DK.border}`}>
                  <th className="py-2 pe-3 text-start">Start Time</th>
                  <th className="py-2 pe-3 text-start">Company / Organization</th>
                  <th className="py-2 pe-3 text-start">Location</th>
                  <th className="py-2 pe-3 text-start">Device</th>
                  <th className="py-2 pe-3 text-start">Duration</th>
                  <th className="py-2 pe-3 text-center">Stats (🔖 / 🎯 / 📿)</th>
                  <th className="py-2 text-end">Active</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => {
                  const isActive = s.last_active_at >= activeThreshold;
                  return (
                    <tr key={s.id} className={`border-t ${DK.border} hover:bg-[#161b22]/40`}>
                      <td className={`py-2 pe-3 ${DK.muted}`} title={new Date(s.created_at).toLocaleString()}>
                        {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className={`py-2 pe-3 ${DK.text} max-w-[200px] truncate`} title={s.org}>
                        {s.org || "Unknown Organization"}
                      </td>
                      <td className={`py-2 pe-3 ${DK.muted}`}>
                        {s.city && s.country ? `${s.city}, ${s.country}` : (s.country || "Unknown")}
                      </td>
                      <td className={`py-2 pe-3 ${DK.muted} max-w-[120px] truncate`} title={s.device}>
                        {s.device || "Unknown"}
                      </td>
                      <td className={`py-2 pe-3 ${DK.text}`}>
                        {formatDuration(s.session_duration_seconds)}
                      </td>
                      <td className={`py-2 pe-3 text-center ${DK.text}`}>
                        {s.bookmarks_count || 0} / {s.hifz_count || 0} / {s.tasbeeh_count || 0}
                      </td>
                      <td className="py-2 text-end">
                        <span className={`inline-block w-2 h-2 rounded-full ${isActive ? "bg-[#3fb950]" : "bg-[#30363d]"}`} title={isActive ? "Active recently" : "Idle"} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
