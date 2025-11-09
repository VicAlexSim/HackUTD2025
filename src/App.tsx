import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { Dashboard } from "./components/Dashboard";
import { WorkOrderPanel } from "./components/WorkOrderPanel";
import { TechnicianPanel } from "./components/TechnicianPanel";
import { CameraFeedPanel } from "./components/CameraFeedPanel";
import { AgentActivityPanel } from "./components/AgentActivityPanel";
import { useState } from "react";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-blue-800 text-white h-16 flex justify-between items-center shadow-lg px-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <span className="text-2xl">🤖</span>
          </div>
          <div>
            <h2 className="text-xl font-bold">Technician Vision AI</h2>
            <p className="text-xs text-blue-100">Multi-Agent Data Center Assistant</p>
          </div>
        </div>
        <SignOutButton />
      </header>
      <main className="flex-1 p-6">
        <Content />
      </main>
      <Toaster />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const [activeTab, setActiveTab] = useState<"dashboard" | "workorders" | "technicians" | "feeds" | "agents">("dashboard");

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Authenticated>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex gap-2 border-b">
            <TabButton active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")}>
              📊 Dashboard
            </TabButton>
            <TabButton active={activeTab === "workorders"} onClick={() => setActiveTab("workorders")}>
              📋 Work Orders
            </TabButton>
            <TabButton active={activeTab === "technicians"} onClick={() => setActiveTab("technicians")}>
              👷 Technicians
            </TabButton>
            <TabButton active={activeTab === "feeds"} onClick={() => setActiveTab("feeds")}>
              📷 Camera Feeds
            </TabButton>
            <TabButton active={activeTab === "agents"} onClick={() => setActiveTab("agents")}>
              🤖 Agent Activity
            </TabButton>
          </div>
        </div>

        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "workorders" && <WorkOrderPanel />}
        {activeTab === "technicians" && <TechnicianPanel />}
        {activeTab === "feeds" && <CameraFeedPanel />}
        {activeTab === "agents" && <AgentActivityPanel />}
      </Authenticated>

      <Unauthenticated>
        <div className="max-w-md mx-auto mt-20">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome to Technician Vision AI</h1>
            <p className="text-lg text-gray-600">Sign in to access the multi-agent maintenance system</p>
          </div>
          <SignInForm />
        </div>
      </Unauthenticated>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 font-medium transition-colors ${
        active
          ? "text-blue-600 border-b-2 border-blue-600"
          : "text-gray-600 hover:text-gray-900"
      }`}
    >
      {children}
    </button>
  );
}
