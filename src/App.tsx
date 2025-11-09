import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState } from "react";
import { Id } from "../convex/_generated/dataModel";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 glass-strong h-16 flex justify-between items-center border-b border-white/10 px-6">
        <h2 className="text-2xl font-bold gradient-text">Technician Vision AI</h2>
        <SignOutButton />
      </header>
      <main className="flex-1 p-8">
        <Content />
      </main>
      <Toaster theme="dark" />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500/20 border-t-purple-500"></div>
          <div className="absolute inset-0 rounded-full bg-purple-500/20 blur-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <Authenticated>
        <Dashboard />
      </Authenticated>
      <Unauthenticated>
        <div className="max-w-md mx-auto mt-12">
          <div className="text-center mb-10">
            <h1 className="text-5xl font-bold gradient-text mb-4">Multi-Agent Maintenance System</h1>
            <p className="text-xl text-gray-400">Sign in to access the dashboard</p>
          </div>
          <div className="glass-strong p-8 rounded-2xl border border-white/10 shadow-glow">
            <SignInForm />
          </div>
        </div>
      </Unauthenticated>
    </div>
  );
}

function Dashboard() {
  const [activeTab, setActiveTab] = useState<"tickets" | "technicians" | "cameras" | "docs">("tickets");

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-bold gradient-text mb-3">Maintenance Control Center</h1>
        <p className="text-lg text-gray-400">Multi-agent system with vision AI, voice guidance, and autonomous ticket management</p>
      </div>

      <div className="glass p-1 rounded-xl mb-8 inline-flex gap-1">
        <button
          onClick={() => setActiveTab("tickets")}
          className={`px-6 py-3 font-semibold rounded-lg transition-all ${
            activeTab === "tickets"
              ? "bg-gradient-primary text-white shadow-glow"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          🎫 Tickets
        </button>
        <button
          onClick={() => setActiveTab("technicians")}
          className={`px-6 py-3 font-semibold rounded-lg transition-all ${
            activeTab === "technicians"
              ? "bg-gradient-primary text-white shadow-glow"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          👷 Technicians
        </button>
        <button
          onClick={() => setActiveTab("cameras")}
          className={`px-6 py-3 font-semibold rounded-lg transition-all ${
            activeTab === "cameras"
              ? "bg-gradient-primary text-white shadow-glow"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          📹 Cameras
        </button>
        <button
          onClick={() => setActiveTab("docs")}
          className={`px-6 py-3 font-semibold rounded-lg transition-all ${
            activeTab === "docs"
              ? "bg-gradient-primary text-white shadow-glow"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          Documentation
        </button>
      </div>

      {activeTab === "tickets" && <TicketsView />}
      {activeTab === "technicians" && <TechniciansView />}
      {activeTab === "cameras" && <CamerasView />}
      {activeTab === "docs" && <DocumentsView />}
    </div>
  );
}

function TicketsView() {
  const tickets = useQuery(api.tickets.listTickets, {});
  const createTicket = useMutation(api.tickets.createTicket);
  const deleteTicket = useMutation(api.tickets.deleteTicket);
  const [showForm, setShowForm] = useState(false);

  const handleCreateTicket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    await createTicket({
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      priority: formData.get("priority") as "low" | "medium" | "high" | "critical",
      createdBy: "manual",
    });
    
    setShowForm(false);
    e.currentTarget.reset();
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
      medium: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
      high: "bg-orange-500/20 text-orange-300 border border-orange-500/30",
      critical: "bg-red-500/20 text-red-300 border border-red-500/30",
    };
    return colors[priority] || "bg-gray-500/20 text-gray-300 border border-gray-500/30";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-gray-500/20 text-gray-300 border border-gray-500/30",
      in_progress: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
      completed: "bg-green-500/20 text-green-300 border border-green-500/30",
      blocked: "bg-red-500/20 text-red-300 border border-red-500/30",
    };
    return colors[status] || "bg-gray-500/20 text-gray-300 border border-gray-500/30";
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-white">Tickets</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 bg-gradient-primary text-white rounded-lg hover:shadow-glow transition-all font-semibold transform hover:scale-105"
        >
          {showForm ? "✕ Cancel" : "+ Create Ticket"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreateTicket} className="glass-strong p-6 rounded-xl border border-white/10 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Title</label>
              <input
                name="title"
                type="text"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
                placeholder="Enter ticket title..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Description</label>
              <textarea
                name="description"
                required
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all resize-none"
                placeholder="Describe the issue..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Priority</label>
              <select
                name="priority"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
              >
                <option value="low" className="bg-dark-card">Low</option>
                <option value="medium" className="bg-dark-card">Medium</option>
                <option value="high" className="bg-dark-card">High</option>
                <option value="critical" className="bg-dark-card">Critical</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full px-4 py-3 bg-gradient-primary text-white rounded-lg hover:shadow-glow transition-all font-semibold transform hover:scale-[1.02]"
            >
              Create Ticket
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4">
        {tickets?.map((ticket) => (
          <div key={ticket._id} className="glass-strong p-6 rounded-xl border border-white/10 hover:border-purple-500/30 transition-all hover:shadow-glow group">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">{ticket.title}</h3>
              <div className="flex gap-2 items-center">
                <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
                  {ticket.priority.toUpperCase()}
                </span>
                <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${getStatusColor(ticket.status)}`}>
                  {ticket.status.replace('_', ' ').toUpperCase()}
                </span>
                <button
                  onClick={() => deleteTicket({ ticketId: ticket._id })}
                  className="text-red-400 hover:text-red-300 text-lg transition-colors ml-2"
                  title="Delete ticket"
                >
                  🗑️
                </button>
              </div>
            </div>
            <p className="text-gray-400 mb-4 leading-relaxed">{ticket.description}</p>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <span className="text-purple-400">👤</span>
                Created by: <span className="text-gray-300">{ticket.createdBy}</span>
              </span>
              {ticket.technician && (
                <span className="flex items-center gap-2">
                  <span className="text-blue-400">👷</span>
                  Assigned to: <span className="text-gray-300">{ticket.technician.name}</span>
                </span>
              )}
            </div>
            {ticket.metadata?.detectedIssue && (
              <div className="mt-4 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                <p className="text-sm font-semibold text-yellow-300 flex items-center gap-2">
                  <span>🤖</span> AI Detected Issue
                </p>
                <p className="text-sm text-yellow-200/80 mt-2">{ticket.metadata.detectedIssue}</p>
              </div>
            )}
          </div>
        ))}
        {tickets?.length === 0 && (
          <div className="glass p-12 rounded-xl border border-white/10 text-center">
            <div className="text-6xl mb-4">🎫</div>
            <p className="text-xl text-gray-400">No tickets yet</p>
            <p className="text-gray-500 mt-2">Create your first ticket to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TechniciansView() {
  const technicians = useQuery(api.technicians.listTechnicians, {});
  const createTechnician = useMutation(api.technicians.createTechnician);
  const deleteTechnician = useMutation(api.technicians.deleteTechnician);
  const [showForm, setShowForm] = useState(false);
  const [selectedTechId, setSelectedTechId] = useState<Id<"technicians"> | null>(null);

  const handleCreateTechnician = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const skills = (formData.get("skills") as string).split(",").map(s => s.trim());
    
    await createTechnician({
      name: formData.get("name") as string,
      skills,
      location: formData.get("location") as string || undefined,
    });
    
    setShowForm(false);
    e.currentTarget.reset();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: "bg-green-100 text-green-800",
      busy: "bg-yellow-100 text-yellow-800",
      offline: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Technicians</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-hover transition-colors"
        >
          {showForm ? "Cancel" : "Add Technician"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreateTechnician} className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                name="name"
                type="text"
                required
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Skills (comma-separated)</label>
              <input
                name="skills"
                type="text"
                required
                placeholder="electrical, plumbing, hvac"
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <input
                name="location"
                type="text"
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-primary text-white rounded hover:bg-primary-hover transition-colors"
            >
              Add
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {technicians?.map((tech) => (
          <div key={tech._id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-semibold">{tech.name}</h3>
              <div className="flex gap-2 items-center">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(tech.status)}`}>
                  {tech.status}
                </span>
                <button
                  onClick={() => setSelectedTechId(tech._id)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                  title="View voice alerts"
                >
                  🔊
                </button>
                <button
                  onClick={() => deleteTechnician({ technicianId: tech._id })}
                  className="text-red-600 hover:text-red-800 text-sm"
                  title="Delete technician"
                >
                  🗑️
                </button>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Skills:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {tech.skills.map((skill, i) => (
                    <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              {tech.location && (
                <div>
                  <span className="font-medium">Location:</span> {tech.location}
                </div>
              )}
              {tech.currentTicket && (
                <div className="mt-3 p-2 bg-blue-50 rounded">
                  <span className="font-medium text-blue-800">Current Task:</span>
                  <p className="text-blue-700 text-xs mt-1">{tech.currentTicket.title}</p>
                </div>
              )}
            </div>
          </div>
        ))}
        {technicians?.length === 0 && (
          <div className="col-span-2 text-center py-12 text-gray-500">
            No technicians yet. Add one to get started.
          </div>
        )}
      </div>

      {selectedTechId && (
        <VoiceInteractionsModal 
          technicianId={selectedTechId} 
          onClose={() => setSelectedTechId(null)} 
        />
      )}
    </div>
  );
}

function VoiceInteractionsModal({ technicianId, onClose }: { technicianId: Id<"technicians">; onClose: () => void }) {
  const interactions = useQuery(api.technicians.getVoiceInteractions, { technicianId });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold">Voice Interactions</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {interactions && interactions.length > 0 ? (
            <div className="space-y-4">
              {interactions.map((interaction) => (
                <div key={interaction._id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      interaction.triggerReason === "safety" ? "bg-red-100 text-red-800" :
                      interaction.triggerReason === "critical" ? "bg-orange-100 text-orange-800" :
                      "bg-blue-100 text-blue-800"
                    }`}>
                      {interaction.triggerReason}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(interaction.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-2">{interaction.message}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${interaction.wasSpoken ? "text-green-600" : "text-gray-500"}`}>
                      {interaction.wasSpoken ? "🔊 Spoken" : "📝 Logged only"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No voice interactions yet. Voice alerts will appear here when the vision AI detects issues.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CamerasView() {
  const cameras = useQuery(api.cameras.listCameras, {});
  const createCamera = useMutation(api.cameras.createCamera);
  const deleteCamera = useMutation(api.cameras.deleteCamera);
  const [showForm, setShowForm] = useState(false);
  const [selectedCameraId, setSelectedCameraId] = useState<Id<"cameraFeeds"> | null>(null);

  const handleCreateCamera = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    await createCamera({
      name: formData.get("name") as string,
      streamUrl: formData.get("streamUrl") as string,
      location: formData.get("location") as string,
    });
    
    setShowForm(false);
    e.currentTarget.reset();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-white">Camera Feeds</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 bg-gradient-accent text-white rounded-lg hover:shadow-glow transition-all font-semibold transform hover:scale-105"
        >
          {showForm ? "✕ Cancel" : "+ Add Camera"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreateCamera} className="glass-strong p-6 rounded-xl border border-white/10 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Name</label>
              <input
                name="name"
                type="text"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all"
                placeholder="Camera name..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Stream URL (YouTube or other)</label>
              <input
                name="streamUrl"
                type="text"
                required
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Location</label>
              <input
                name="location"
                type="text"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all"
                placeholder="Camera location..."
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-3 bg-gradient-accent text-white rounded-lg hover:shadow-glow transition-all font-semibold transform hover:scale-[1.02]"
            >
              Add Camera
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cameras?.map((camera) => (
          <div key={camera._id} className="glass-strong p-6 rounded-xl border border-white/10 hover:border-cyan-500/30 transition-all hover:shadow-glow group">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">{camera.name}</h3>
                <p className="text-xs text-gray-500 mt-1 font-mono">{camera._id}</p>
              </div>
              <div className="flex gap-2 items-center">
                <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                  camera.isActive 
                    ? "bg-green-500/20 text-green-300 border border-green-500/30" 
                    : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                }`}>
                  {camera.isActive ? "● ACTIVE" : "○ INACTIVE"}
                </span>
                <button 
                  onClick={() => setSelectedCameraId(camera._id)} 
                  className="text-blue-400 hover:text-blue-300 text-lg transition-colors" 
                  title="View analysis"
                >
                  📊
                </button>
                <button 
                  onClick={() => deleteCamera({ cameraId: camera._id })} 
                  className="text-red-400 hover:text-red-300 text-lg transition-colors" 
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-purple-400">📍</span>
                <div>
                  <span className="font-semibold text-gray-400">Location:</span>
                  <span className="text-gray-300 ml-2">{camera.location}</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-cyan-400">🔗</span>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-gray-400">Stream:</span>
                  <p className="text-xs text-gray-500 mt-1 break-all font-mono">{camera.streamUrl}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
        {cameras?.length === 0 && (
          <div className="col-span-3 glass p-12 rounded-xl border border-white/10 text-center">
            <div className="text-6xl mb-4">📹</div>
            <p className="text-xl text-gray-400">No cameras yet</p>
            <p className="text-gray-500 mt-2">Add a camera feed to get started</p>
          </div>
        )}
      </div>

      {selectedCameraId && (
        <VisionAnalysisModal 
          cameraId={selectedCameraId} 
          onClose={() => setSelectedCameraId(null)} 
        />
      )}
    </div>
  );
}

function VisionAnalysisModal({ cameraId, onClose }: { cameraId: Id<"cameraFeeds">; onClose: () => void }) {
  const analyses = useQuery(api.cameras.getVisionAnalysis, { cameraId });
  const camera = useQuery(api.cameras.listCameras, {})?.find(c => c._id === cameraId);

  const getYouTubeEmbedUrl = (url: string): string => {
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
    if (videoIdMatch) {
      return `https://www.youtube.com/embed/${videoIdMatch[1]}`;
    }
    return url;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Vision Analysis</h2>
            <p className="text-sm text-gray-600">{camera?.name} - {camera?.location}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {camera && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Live Preview</h3>
              {camera.streamUrl.includes("youtube.com") || camera.streamUrl.includes("youtu.be") ? (
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <iframe
                    src={getYouTubeEmbedUrl(camera.streamUrl)}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center text-white">
                  <div className="text-center">
                    <p className="mb-2">Stream URL: {camera.streamUrl}</p>
                    <p className="text-sm text-gray-400">Direct video streaming requires external integration</p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <h3 className="font-semibold mb-4">Analysis History</h3>
          {analyses && analyses.length > 0 ? (
            <div className="space-y-4">
              {analyses.map((analysis) => (
                <div key={analysis._id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      analysis.requiresAction ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                    }`}>
                      {analysis.requiresAction ? "Action Required" : "Normal"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(analysis.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-2">{analysis.analysis}</p>
                  {analysis.detectedIssues.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-600 mb-1">Detected Issues:</p>
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {analysis.detectedIssues.map((issue, i) => (
                          <li key={i}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="mt-2 text-xs text-gray-500">
                    Confidence: {(analysis.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">No analysis data yet.</p>
              <p className="text-sm mb-2">To analyze frames from this camera, send POST requests to:</p>
              <code className="block mt-2 p-3 bg-gray-100 rounded text-xs font-mono">
                https://accurate-marlin-326.convex.site/api/analyze-frame
              </code>
              <p className="text-xs mt-3 text-gray-600">
                Include: {`{ "cameraId": "${cameraId}", "frameData": "base64_image" }`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DocumentsView() {
  const documents = useQuery(api.documents.listDocuments, {});
  const createDocument = useMutation(api.documents.createDocument);
  const deleteDocument = useMutation(api.documents.deleteDocument);
  const [showForm, setShowForm] = useState(false);

  const handleCreateDocument = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const tags = (formData.get("tags") as string).split(",").map(s => s.trim());
    
    await createDocument({
      title: formData.get("title") as string,
      content: formData.get("content") as string,
      category: formData.get("category") as "sop" | "safety" | "troubleshooting" | "repair",
      tags,
    });
    
    setShowForm(false);
    e.currentTarget.reset();
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      sop: "bg-blue-100 text-blue-800",
      safety: "bg-red-100 text-red-800",
      troubleshooting: "bg-yellow-100 text-yellow-800",
      repair: "bg-green-100 text-green-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Documentation</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-hover transition-colors"
        >
          {showForm ? "Cancel" : "Add Document"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreateDocument} className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                name="title"
                type="text"
                required
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Content</label>
              <textarea
                name="content"
                required
                rows={6}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                name="category"
                required
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primary"
              >
                <option value="sop">SOP</option>
                <option value="safety">Safety</option>
                <option value="troubleshooting">Troubleshooting</option>
                <option value="repair">Repair</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
              <input
                name="tags"
                type="text"
                required
                placeholder="electrical, safety, hvac"
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-primary text-white rounded hover:bg-primary-hover transition-colors"
            >
              Add
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4">
        {documents?.map((doc) => (
          <div key={doc._id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-semibold">{doc.title}</h3>
              <div className="flex gap-2 items-center">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(doc.category)}`}>
                  {doc.category}
                </span>
                <button onClick={() => deleteDocument({ documentId: doc._id })} className="text-red-600 hover:text-red-800 text-sm" title="Delete">🗑️</button>
              </div>
            </div>
            <p className="text-gray-600 mb-3 line-clamp-3">{doc.content}</p>
            <div className="flex flex-wrap gap-1">
              {doc.tags.map((tag, i) => (
                <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
        {documents?.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No documents yet. Add one to get started.
          </div>
        )}
      </div>
    </div>
  );
}
