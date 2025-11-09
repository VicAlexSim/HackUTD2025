import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function Dashboard() {
  const overview = useQuery(api.dashboard.getOverview);

  if (!overview) {
    return <div className="text-center py-8">Loading dashboard...</div>;
  }

  const { stats, recentFeeds, technicians, workOrders } = overview;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Work Orders" value={stats.totalWorkOrders} icon="📋" color="blue" />
        <StatCard title="Pending" value={stats.pendingWorkOrders} icon="⏳" color="yellow" />
        <StatCard title="In Progress" value={stats.inProgressWorkOrders} icon="🔧" color="orange" />
        <StatCard title="Completed" value={stats.completedWorkOrders} icon="✅" color="green" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard title="Available Technicians" value={stats.availableTechnicians} icon="👷" color="green" />
        <StatCard title="Busy Technicians" value={stats.busyTechnicians} icon="⚙️" color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>📷</span> Recent Camera Feeds
          </h3>
          <div className="space-y-3">
            {recentFeeds.length === 0 ? (
              <p className="text-gray-500 text-sm">No camera feeds yet</p>
            ) : (
              recentFeeds.slice(0, 5).map((feed) => (
                <div key={feed._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {feed.imageUrl && (
                    <img src={feed.imageUrl} alt="Feed" className="w-16 h-16 object-cover rounded" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Technician: {feed.technicianId}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(feed._creationTime).toLocaleString()}
                    </p>
                    {feed.analysis && (
                      <p className="text-xs text-gray-600 mt-1 truncate">{feed.analysis.substring(0, 80)}...</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>📋</span> Recent Work Orders
          </h3>
          <div className="space-y-3">
            {workOrders.length === 0 ? (
              <p className="text-gray-500 text-sm">No work orders yet</p>
            ) : (
              workOrders.map((wo) => (
                <div key={wo._id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{wo.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{wo.location} • {wo.equipment}</p>
                    </div>
                    <StatusBadge status={wo.status} />
                  </div>
                  <PriorityBadge priority={wo.priority} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: string; color: string }) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    yellow: "bg-yellow-50 text-yellow-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    pending: "bg-yellow-100 text-yellow-800",
    assigned: "bg-blue-100 text-blue-800",
    in_progress: "bg-orange-100 text-orange-800",
    completed: "bg-green-100 text-green-800",
    blocked: "bg-red-100 text-red-800",
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded ${colors[status as keyof typeof colors]}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors = {
    low: "bg-gray-100 text-gray-800",
    medium: "bg-blue-100 text-blue-800",
    high: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800",
  };

  return (
    <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded ${colors[priority as keyof typeof colors]}`}>
      {priority}
    </span>
  );
}
