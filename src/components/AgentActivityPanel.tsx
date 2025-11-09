import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function AgentActivityPanel() {
  const agentLogs = useQuery(api.dashboard.getAgentActivity, { limit: 50 });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Agent Activity (ReAct Workflow)</h2>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-200">
          {agentLogs?.map((log) => (
            <div key={log._id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <AgentIcon type={log.agentType} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900 capitalize">
                      {log.agentType} Agent
                    </span>
                    <StepBadge step={log.step} />
                    <span className="text-xs text-gray-500">
                      {new Date(log._creationTime).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{log.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AgentIcon({ type }: { type: string }) {
  const icons = {
    vision: "👁️",
    supervisor: "👔",
    rag: "📚",
    coordinator: "🎯",
  };

  const colors = {
    vision: "bg-purple-100 text-purple-600",
    supervisor: "bg-blue-100 text-blue-600",
    rag: "bg-green-100 text-green-600",
    coordinator: "bg-orange-100 text-orange-600",
  };

  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${colors[type as keyof typeof colors]}`}>
      {icons[type as keyof typeof icons]}
    </div>
  );
}

function StepBadge({ step }: { step: string }) {
  const colors = {
    reason: "bg-blue-100 text-blue-800",
    act: "bg-green-100 text-green-800",
    observe: "bg-purple-100 text-purple-800",
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded ${colors[step as keyof typeof colors]}`}>
      {step}
    </span>
  );
}
