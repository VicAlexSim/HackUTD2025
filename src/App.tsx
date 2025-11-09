import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { LandingPage } from "./LandingPage";
import { VoiceChat } from "./VoiceChat";
import { LiveCallChat } from "./LiveCallChat";
import { Toaster } from "sonner";
import { useState, useEffect, useRef } from "react";
import { Id } from "../convex/_generated/dataModel";
import logo from "./logo.jpg";
import { 
  FiFileText as FiTicket, 
  FiUsers, 
  FiVideo, 
  FiActivity, 
  FiTrash2, 
  FiX, 
  FiPlus,
  FiMapPin,
  FiLink,
  FiBarChart2,
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiUser,
  FiVolume2,
  FiVolumeX,
  FiEdit2,
  FiCpu,
  FiClock,
  FiMessageSquare,
  FiPackage
} from "react-icons/fi";

type Page = "tickets" | "cameras" | "activity" | "inventory";

export default function App() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const [activePage, setActivePage] = useState<Page>("tickets");
  const pages: Page[] = ["tickets", "cameras", "activity", "inventory"]

  return (
    <div className="min-h-screen flex flex-col">
      {loggedInUser && (
        <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/5 border-b border-white/10">
          <div className="w-full px-6 py-2 flex items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3">
              <img src={logo} alt="Kramhtron.ai" className="h-16 w-auto rounded-lg" />
              <span className="text-2xl font-bold glassy-text">Kramhtron.ai</span>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              {pages.map((page) => (
									<button
										type="button"
										key={page}
										onClick={() => setActivePage(page)}
										className={`glassy-text hover:text-shadow-none hover:text-gray-300 transition-colors font-medium text-sm ${activePage === page ? "text-white" : ""}`}
									>
										{page[0].toUpperCase()}{page.slice(1)}
									</button>
								))}
            </div>

            {/* Sign Out Button */}
            <SignOutButton />
          </div>
        </header>
      )}
      <main className={`flex-1 ${loggedInUser ? 'p-8 pt-24' : ''}`}>
        <Content activePage={activePage} />
      </main>
      <Toaster theme="dark" />
    </div>
  );
}

function Content({ activePage }: { activePage: Page }) {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const [showAuth, setShowAuth] = useState(false);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-500/20 border-t-gray-400"></div>
          <div className="absolute inset-0 rounded-full bg-gray-400/20 blur-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <Authenticated>
        <Dashboard activePage={activePage} />
      </Authenticated>
      <Unauthenticated>
        {!showAuth ? (
          <LandingPage 
            onGetStarted={() => setShowAuth(true)} 
            onLogin={() => setShowAuth(true)}
          />
        ) : (
          <div className="max-w-md mx-auto mt-12">
            <button
              onClick={() => setShowAuth(false)}
              className="mb-6 text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
            >
              <span>←</span> Back to home
            </button>
            <div className="text-center mb-10">
              <h1 className="text-5xl font-bold gradient-text mb-4">Welcome to Kramhtron.ai</h1>
              <p className="text-xl text-gray-400">Sign in to access the dashboard</p>
            </div>
            <div className="glass-strong p-8 rounded-2xl border border-white/10 shadow-glow">
              <SignInForm />
            </div>
          </div>
        )}
      </Unauthenticated>
    </div>
  );
}

function Dashboard({ activePage }: { activePage: Page }) {
  return (
    <div className="max-w-7xl mx-auto">
      {activePage === "tickets" && <TicketsView />}
      {activePage === "cameras" && <CamerasView />}
      {activePage === "activity" && <ActivityView />}
      {activePage === "inventory" && <InventoryView />}
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
          className="px-6 py-3 bg-gradient-primary text-white rounded-lg hover:shadow-glow transition-all font-semibold transform hover:scale-105 flex items-center gap-2"
        >
          {showForm ? <><FiX /> Cancel</> : <><FiPlus /> Create Ticket</>}
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
                className="w-full px-4 py-3 bg-[#F5F5F5]/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-[#64A8F0] focus:ring-2 focus:ring-[#64A8F0]/50 outline-none transition-all"
                placeholder="Enter ticket title..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Description</label>
              <textarea
                name="description"
                required
                rows={3}
                className="w-full px-4 py-3 bg-[#F5F5F5]/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-[#64A8F0] focus:ring-2 focus:ring-[#64A8F0]/50 outline-none transition-all resize-none"
                placeholder="Describe the issue..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Priority</label>
              <select
                name="priority"
                required
                className="w-full px-4 py-3 bg-[#F5F5F5]/5 border border-white/10 rounded-lg text-white focus:border-[#64A8F0] focus:ring-2 focus:ring-[#64A8F0]/50 outline-none transition-all"
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
          <div key={ticket._id} className="glass-strong p-6 rounded-xl border border-white/10 hover:border-[#64A8F0]/20 transition-all hover:shadow-glow group lg:max-w-lg">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-xl font-bold text-white group-hover:text-gray-300 transition-colors">{ticket.title}</h3>
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
                  <FiTrash2 />
                </button>
              </div>
            </div>
            <p className="text-gray-400 mb-4 leading-relaxed">{ticket.description}</p>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <FiUsers className="text-gray-400" />
                Created by: <span className="text-gray-300">{ticket.createdBy}</span>
              </span>
              {ticket.technician && (
                <span className="flex items-center gap-2">
                  <FiUsers className="text-gray-400" />
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
            <FiTicket className="text-6xl mb-4 mx-auto text-gray-600" />
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
                  <FiActivity />
                </button>
                <button
                  onClick={() => deleteTechnician({ technicianId: tech._id })}
                  className="text-red-600 hover:text-red-800 text-sm"
                  title="Delete technician"
                >
                  <FiTrash2 />
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
  const cameras = useQuery(api.cameras.listCameras, { activeOnly: false });
  const tickets = useQuery(api.tickets.listTickets, {});
  const createCamera = useMutation(api.cameras.createCamera);
  const deleteCamera = useMutation(api.cameras.deleteCamera);
  const fixCameraModes = useMutation(api.cameras.fixCameraModes);
  const syncCamerasToTechnicians = useMutation(api.cameras.syncAllCamerasToTechnicians);
  const [showForm, setShowForm] = useState(false);
  const [selectedCameraId, setSelectedCameraId] = useState<Id<"cameraFeeds"> | null>(null);
  const [viewingCameraId, setViewingCameraId] = useState<Id<"cameraFeeds"> | null>(null);
  const [editingCameraId, setEditingCameraId] = useState<Id<"cameraFeeds"> | null>(null);

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

  const handleFixCameraModes = async () => {
    try {
      const result = await fixCameraModes({});
      console.log('✅ Fixed camera modes:', result);
      alert(`Updated ${result.updated} cameras:\n${result.cameras.map((c: any) => `${c.name} → ${c.mode}`).join('\n')}`);
    } catch (error) {
      console.error('❌ Error fixing camera modes:', error);
      alert('Failed to fix camera modes. Check console for details.');
    }
  };

  const handleSyncCamerasToTechnicians = async () => {
    try {
      const result = await syncCamerasToTechnicians({});
      console.log('✅ Synced cameras to technicians:', result);
      alert(`Synced ${result.synced} cameras to technicians:\n${result.technicians.map((t: any) => `${t.name} - ${t.skills.join(', ')}`).join('\n')}`);
    } catch (error) {
      console.error('❌ Error syncing cameras to technicians:', error);
      alert('Failed to sync cameras to technicians. Check console for details.');
    }
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-3xl font-bold text-white">Camera Feeds</h2>
        <div className="flex gap-2">
          <button
            onClick={handleSyncCamerasToTechnicians}
            className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 rounded-lg font-semibold text-sm transition-all hover:shadow-glow"
            title="Sync all cameras to create/update technicians with skills"
          >
            🔄 Sync Technicians
          </button>
          <button
            onClick={handleFixCameraModes}
            className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-300 rounded-lg font-semibold text-sm transition-all hover:shadow-glow"
            title="Fix camera modes based on names (names with '2' become AI mode)"
          >
            🔧 Fix Camera Modes
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cameras?.map((camera) => {
          // Find tickets assigned to this camera/employee
          const assignedTickets = tickets?.filter(ticket => 
            ticket.metadata?.cameraId === camera._id || 
            ticket.technician?.name === camera.name
          ) || [];
          
          return (
            <div 
              key={camera._id} 
              onClick={() => setViewingCameraId(camera._id)}
              className="glass-strong p-6 rounded-xl border border-white/10 hover:border-[#64A8F0]/20 transition-all hover:shadow-glow group cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <FiUser className="text-blue-400 text-xl" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">{camera.name}'s Feed</h3>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">{camera._id.slice(0, 12)}...</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <div className="flex gap-2 items-center">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCameraId(camera._id);
                      }}
                      className="text-blue-400 hover:text-blue-300 text-lg transition-colors" 
                      title="Edit camera"
                    >
                      <FiEdit2 />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCameraId(camera._id);
                      }}
                      className="text-blue-400 hover:text-blue-300 text-lg transition-colors" 
                      title="View analysis"
                    >
                      <FiBarChart2 />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCamera({ cameraId: camera._id });
                      }}
                      className="text-red-400 hover:text-red-300 text-lg transition-colors" 
                      title="Delete"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      camera.isActive 
                        ? "bg-green-500/20 text-green-300 border border-green-500/30" 
                        : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                    }`}>
                      {camera.isActive ? "● On Duty" : "○ Off Duty"}
                    </span>
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                      camera.engineerAvailable 
                        ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" 
                        : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    }`}>
                      {camera.engineerAvailable ? (
                        <><FiUsers className="text-sm" /> Live Call</>
                      ) : (
                        <><FiCpu className="text-sm" /> AI Mode</>
                      )}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 text-sm mb-4">
                <div className="flex items-start gap-2">
                  <FiMapPin className="text-gray-400 mt-0.5" />
                  <div>
                    <span className="font-semibold text-gray-400">Location:</span>
                    <span className="text-gray-300 ml-2">{camera.location}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className={`px-3 py-2 rounded-lg border ${
                    camera.engineerAvailable 
                      ? "bg-blue-500/10 border-blue-500/30" 
                      : "bg-blue-500/10 border-blue-500/30"
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      {camera.engineerAvailable ? (
                        <><FiUsers className="text-blue-400 text-sm" /><p className="text-xs font-semibold text-gray-300">Engineer Available</p></>
                      ) : (
                        <><FiCpu className="text-blue-400 text-sm" /><p className="text-xs font-semibold text-gray-300">Engineer Unavailable</p></>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      {camera.engineerAvailable 
                        ? "Live video call with engineer" 
                        : "Talk to Kramtron.ai assistant"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Assigned Tickets */}
              <div className="glass p-4 rounded-lg border border-white/10">
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <FiTicket className="text-blue-400" />
                  Assigned Tickets ({assignedTickets.length})
                </h4>
                {assignedTickets.length > 0 ? (
                  <div className="space-y-2">
                    {assignedTickets.slice(0, 3).map((ticket) => (
                      <div key={ticket._id} className="p-2 bg-white/5 rounded border border-white/10">
                        <div className="flex items-start justify-between mb-1">
                          <span className="text-xs font-medium text-white">{ticket.title}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            ticket.status === "pending" ? "bg-gray-500/20 text-gray-300" :
                            ticket.status === "in_progress" ? "bg-blue-500/20 text-blue-300" :
                            ticket.status === "completed" ? "bg-green-500/20 text-green-300" :
                            "bg-gray-500/20 text-gray-300"
                          }`}>
                            {ticket.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 line-clamp-1">{ticket.description}</p>
                      </div>
                    ))}
                    {assignedTickets.length > 3 && (
                      <p className="text-xs text-gray-500 text-center">
                        +{assignedTickets.length - 3} more tickets
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 text-center py-2">No tickets assigned</p>
                )}
              </div>
            </div>
          );
        })}
        {cameras?.length === 0 && (
          <div className="col-span-3 glass p-12 rounded-xl border border-white/10 text-center">
            <FiVideo className="text-6xl mb-4 mx-auto text-gray-600" />
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

      {viewingCameraId && (
        <CameraFeedViewer 
          cameraId={viewingCameraId} 
          onClose={() => setViewingCameraId(null)} 
        />
      )}

      {editingCameraId && (
        <EditCameraModal 
          cameraId={editingCameraId} 
          onClose={() => setEditingCameraId(null)} 
        />
      )}
    </div>
  );
}

function EditCameraModal({ cameraId, onClose }: { cameraId: Id<"cameraFeeds">; onClose: () => void }) {
  const cameras = useQuery(api.cameras.listCameras, { activeOnly: false });
  const camera = cameras?.find(c => c._id === cameraId);
  const updateCamera = useMutation(api.cameras.updateCamera);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const name = formData.get("name") as string;
    const location = formData.get("location") as string;

    console.log("Submitting update:", { cameraId, name, location });

    try {
      await updateCamera({
        cameraId,
        name,
        streamUrl: "http://10.48.94.214:8080/video_feed",
        location,
      });
      console.log("Camera updated successfully");
      onClose();
    } catch (error: any) {
      console.error("Error updating camera:", error);
      console.error("Error details:", error?.message, error?.data);
      alert(`Failed to update camera: ${error?.message || "Please try again."}`);
    }
  };

  if (!camera) {
    console.log("Camera not found:", cameraId);
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="glass-strong rounded-2xl border border-white/20 max-w-md w-full p-6">
          <p className="text-white text-center">Loading camera data...</p>
        </div>
      </div>
    );
  }

  console.log("Editing camera:", camera);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-strong rounded-2xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Edit Camera Feed</h2>
            <p className="text-sm text-gray-400 mt-1">Update camera information and criteria</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl transition-colors">
            <FiX />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Employee Name</label>
              <input
                name="name"
                type="text"
                required
                defaultValue={camera.name}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 outline-none transition-all"
                placeholder="e.g., Joe Doe1, Jane Smith2..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Location</label>
              <input
                name="location"
                type="text"
                required
                defaultValue={camera.location}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 outline-none transition-all"
                placeholder="Camera location..."
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 glass border border-white/20 text-white rounded-lg hover:bg-white/10 transition-all font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-gradient-primary text-white rounded-lg hover:shadow-glow transition-all font-semibold transform hover:scale-[1.02]"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConversationHistoryModal({ cameraId, onClose }: { cameraId: Id<"cameraFeeds">; onClose: () => void }) {
  const history = useQuery(api.conversationHistory.getCameraConversationHistory, { cameraId });

  if (!history) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]" onClick={onClose}>
        <div className="glass-strong p-8 rounded-xl border border-white/20 max-w-2xl w-full mx-4">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-400 border-t-transparent"></div>
            <span className="text-white">Loading conversation history...</span>
          </div>
        </div>
      </div>
    );
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getSpeakerLabel = (role: string) => {
    if (role === 'assistant' || role === 'kramtron') return 'Kramtron';
    if (role === 'technician') return 'Technician';
    if (role === 'engineer') return 'Engineer';
    return 'Speaker';
  };

  const getSpeakerIcon = (role: string) => {
    if (role === 'assistant' || role === 'kramtron') return <FiCpu className="text-blue-400" />;
    if (role === 'technician') return <FiUser className="text-green-400" />;
    if (role === 'engineer') return <FiUser className="text-purple-400" />;
    return <FiUser className="text-gray-400" />;
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]" onClick={onClose}>
      <div className="glass-strong p-6 rounded-xl border border-white/20 max-w-3xl w-full mx-4 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FiMessageSquare className="text-blue-400" />
              <h2 className="text-xl font-bold text-white">Conversation History</h2>
            </div>
            <p className="text-sm text-gray-400">{history.cameraName} • {history.location}</p>
            <p className="text-xs text-gray-500 mt-1">
              {history.totalMessages} messages • Last updated: {history.lastUpdated ? formatTimestamp(history.lastUpdated) : 'N/A'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full glass-strong border border-white/20 text-white hover:text-red-400 transition-all"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {history.conversationHistory.length === 0 ? (
            <div className="text-center py-12">
              <FiMessageSquare className="text-4xl text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No conversation history yet</p>
              <p className="text-xs text-gray-500 mt-1">Messages will appear here once conversations start</p>
            </div>
          ) : (
            history.conversationHistory.map((msg, idx) => (
              <div key={idx} className="glass-strong p-4 rounded-lg border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getSpeakerIcon(msg.role)}
                    <span className="text-sm font-semibold text-white">{getSpeakerLabel(msg.role)}</span>
                  </div>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <FiClock className="text-[10px]" />
                    {formatTimestamp(msg.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{msg.content}</p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-lg bg-gradient-primary text-white font-semibold hover:shadow-glow transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function CameraFeedViewer({ cameraId, onClose }: { cameraId: Id<"cameraFeeds">; onClose: () => void }) {
  const cameras = useQuery(api.cameras.listCameras, { activeOnly: false });
  const camera = cameras?.find(c => c._id === cameraId);
  const [isMuted, setIsMuted] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [showHistory, setShowHistory] = useState(false);
  
  // Check if engineer is available
  const isLiveCallMode = camera?.engineerAvailable === true;
  
  // Debug logging
  console.log('📹 Camera Feed Viewer:', {
    cameraName: camera?.name,
    engineerAvailable: camera?.engineerAvailable,
    mode: camera?.mode,
    isLiveCallMode,
  });

  // Access user's webcam ONLY in live call mode
  useEffect(() => {
    if (!isLiveCallMode) {
      // Don't access webcam in AI mode
      return;
    }

    const getWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: false 
        });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    };
    getWebcam();

    // Cleanup function to stop webcam when component unmounts
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isLiveCallMode]);

  // Update video element when stream changes
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const getYouTubeEmbedUrl = (url: string): string => {
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
    if (videoIdMatch) {
      return `https://www.youtube.com/embed/${videoIdMatch[1]}?autoplay=1${isMuted ? '&mute=1' : ''}`;
    }
    return url;
  };

  if (!camera) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50" onClick={onClose}>
      <div className="relative w-full h-full" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-3 rounded-full glass-strong border border-white/20 text-white hover:text-red-400 transition-all hover:shadow-glow"
        >
          <FiX className="text-2xl" />
        </button>

        {/* Camera info */}
        <div className="absolute top-4 left-4 z-10 glass-strong p-4 rounded-xl border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <FiUser className="text-blue-400" />
            <h3 className="text-lg font-semibold text-white">{camera.name}'s Feed</h3>
          </div>
          <p className="text-xs text-gray-400 mb-2">
            <FiMapPin className="inline mr-1" />
            {camera.location}
          </p>
          <div className="flex items-center gap-2 mb-2">
            <div className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1.5 ${
              isLiveCallMode 
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" 
                : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
            }`}>
              {isLiveCallMode ? (
                <><FiUsers className="text-sm" /> Live Call Mode</>
              ) : (
                <><FiCpu className="text-sm" /> AI Assistant Mode</>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowHistory(true)}
            className="w-full px-3 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <FiClock className="text-sm" /> View History
          </button>
        </div>

        {/* Main video feed - Technician's external webcam */}
        <div className="w-full h-full flex items-center justify-center p-4">
          <div className="aspect-video bg-black rounded-lg overflow-hidden w-full h-full">
            <iframe
              src="http://10.48.94.214:8080/video_feed"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>

        {/* Conditional UI based on mode */}
        {isLiveCallMode ? (
          <>
            {/* Live Call Mode: Show engineer webcam in bottom-left */}
            <div className="absolute bottom-8 left-8 z-20 w-72 aspect-video bg-black rounded-lg overflow-hidden border-2 border-white/20 shadow-2xl">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
              />
              {!localStream && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                  <div className="text-center text-white">
                    <FiVideo className="text-4xl mb-2 mx-auto text-gray-600" />
                    <p className="text-sm text-gray-400">Accessing webcam...</p>
                  </div>
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white">
                👨‍💼 Engineer
              </div>
            </div>

            {/* Live Call Chat Panel - RIGHT SIDE */}
            <LiveCallChat cameraId={cameraId} />
          </>
        ) : (
          <>
            {/* AI Assistant Mode: Show "Talk to Kramtron.ai" */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 glass-strong p-4 rounded-xl border border-blue-500/30 bg-blue-500/10">
              <div className="flex items-center gap-3">
                <FiCpu className="text-blue-400 text-3xl" />
                <div>
                  <p className="text-white font-semibold text-sm">Engineer Unavailable</p>
                  <p className="text-gray-400 text-xs">Talk to Kramtron.ai for assistance</p>
                </div>
              </div>
            </div>

            {/* Voice Chat for technician (AI mode) */}
            <VoiceChat cameraId={cameraId} speaker="technician" />
          </>
        )}
      </div>

      {/* Conversation History Modal */}
      {showHistory && (
        <ConversationHistoryModal cameraId={cameraId} onClose={() => setShowHistory(false)} />
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
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <iframe
                    src={camera.streamUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
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

function ActivityView() {
  const tickets = useQuery(api.tickets.listTickets, {});
  const cameras = useQuery(api.cameras.listCameras, {});
  const activityLogs = useQuery(api.activityLog.getActivityLogs, { limit: 100 });

  // Combine all activity into a single feed
  const activities: Array<{
    id: string;
    type: "ticket" | "camera" | "activity";
    timestamp: number;
    title: string;
    description: string;
    status?: string;
    priority?: string;
    actor?: string;
    activityType?: string;
  }> = [];

  // Add activity logs (including all Nemotron/Kramtron actions)
  activityLogs?.forEach((log) => {
    activities.push({
      id: log._id,
      type: "activity",
      timestamp: log.timestamp,
      title: log.title,
      description: log.description,
      actor: log.actor,
      activityType: log.type,
    });
  });

  // Add ticket activities
  tickets?.forEach((ticket) => {
    activities.push({
      id: ticket._id,
      type: "ticket",
      timestamp: ticket._creationTime,
      title: `Ticket: ${ticket.title}`,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
    });
  });

  // Add camera activities
  cameras?.forEach((camera) => {
    activities.push({
      id: camera._id,
      type: "camera",
      timestamp: camera._creationTime,
      title: `Camera Added: ${camera.name}`,
      description: `Location: ${camera.location}`,
      status: camera.isActive ? "active" : "inactive",
    });
  });

  // Sort by timestamp (most recent first)
  activities.sort((a, b) => b.timestamp - a.timestamp);

  const getActivityIcon = (type: string, actor?: string) => {
    if (type === "activity") {
      if (actor === "kramtron") {
        return <FiCpu className="text-3xl text-blue-400" />;
      }
      return <FiActivity className="text-3xl" />;
    }
    return type === "ticket" ? <FiTicket className="text-3xl" /> : <FiVideo className="text-3xl" />;
  };

  const getStatusColor = (status?: string) => {
    const colors: Record<string, string> = {
      open: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      "in-progress": "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      resolved: "bg-green-500/20 text-green-300 border-green-500/30",
      closed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      active: "bg-green-500/20 text-green-300 border-green-500/30",
      inactive: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    };
    return colors[status || ""] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  const getPriorityColor = (priority?: string) => {
    const colors: Record<string, string> = {
      low: "bg-gray-500/20 text-gray-300",
      medium: "bg-blue-500/20 text-blue-300",
      high: "bg-orange-500/20 text-orange-300",
      critical: "bg-red-500/20 text-red-300",
    };
    return colors[priority || ""] || "bg-gray-500/20 text-gray-300";
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white mb-2">Activity Feed</h2>
        <p className="text-gray-400">Recent system activity and updates</p>
      </div>

      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="glass p-12 rounded-xl border border-white/10 text-center">
            <FiActivity className="text-6xl mb-4 mx-auto text-gray-600" />
            <p className="text-xl text-gray-400">No activity yet</p>
            <p className="text-gray-500 mt-2">Activity will appear here as you use the system</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="glass-strong p-6 rounded-xl border border-white/10 hover:border-[#64A8F0]/20 transition-all">
              <div className="flex items-start gap-4">
                <div>{getActivityIcon(activity.type, activity.actor)}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white">{activity.title}</h3>
                    <span className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-400 mb-3">{activity.description}</p>
                  <div className="flex gap-2 flex-wrap">
                    {activity.actor && (
                      <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                        activity.actor === "kramtron" 
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" 
                          : activity.actor === "user"
                          ? "bg-green-500/20 text-green-300 border border-green-500/30"
                          : "bg-gray-500/20 text-gray-300 border border-gray-500/30"
                      }`}>
                        {activity.actor === "kramtron" ? "🤖 KRAMTRON" : activity.actor.toUpperCase()}
                      </span>
                    )}
                    {activity.activityType && (
                      <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {activity.activityType.replace('_', ' ').toUpperCase()}
                      </span>
                    )}
                    {activity.status && (
                      <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(activity.status)}`}>
                        {activity.status.toUpperCase()}
                      </span>
                    )}
                    {activity.priority && (
                      <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${getPriorityColor(activity.priority)}`}>
                        {activity.priority.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
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
                <button onClick={() => deleteDocument({ documentId: doc._id })} className="text-red-600 hover:text-red-800 text-sm" title="Delete"><FiTrash2 /></button>
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

function InventoryView() {
  const inventory = useQuery(api.inventory.listInventory, {});
  const updateQuantity = useMutation(api.inventory.updateInventoryQuantity);
  const orderPart = useMutation(api.inventory.orderPart);
  const seedInventory = useMutation(api.inventory.seedInventory);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = [
    { value: "all", label: "All Items", icon: <FiPackage /> },
    { value: "servers", label: "Servers", icon: <FiBarChart2 /> },
    { value: "networking", label: "Networking", icon: <FiLink /> },
    { value: "storage", label: "Storage", icon: <FiPackage /> },
    { value: "power", label: "Power", icon: <FiActivity /> },
    { value: "cooling", label: "Cooling", icon: <FiActivity /> },
    { value: "cables", label: "Cables", icon: <FiLink /> },
  ];

  const filteredInventory = selectedCategory === "all" 
    ? inventory 
    : inventory?.filter(item => item.category === selectedCategory);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_stock": return "bg-green-500/20 text-green-300 border-green-500/30";
      case "low_stock": return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case "out_of_stock": return "bg-red-500/20 text-red-300 border-red-500/30";
      case "on_order": return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      default: return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  const handleSeedInventory = async () => {
    try {
      await seedInventory({});
      console.log("✅ Inventory seeded successfully");
    } catch (error) {
      console.error("❌ Failed to seed inventory:", error);
    }
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Inventory</h2>
          <p className="text-gray-400 text-sm">Data Center Parts & Equipment</p>
        </div>
        <button
          onClick={handleSeedInventory}
          className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 rounded-lg font-semibold text-sm transition-all hover:shadow-glow"
        >
          <FiPlus className="inline mr-2" />
          Seed Inventory
        </button>
      </div>

      {/* Category Filter */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
              selectedCategory === cat.value
                ? "bg-gradient-primary text-white shadow-glow"
                : "glass-strong border border-white/10 text-gray-300 hover:border-blue-400/40"
            }`}
          >
            {cat.icon}
            {cat.label}
          </button>
        ))}
      </div>

      {/* Inventory Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredInventory?.map((item) => (
          <div key={item._id} className="glass-strong p-6 rounded-xl border border-white/10 hover:border-[#64A8F0]/20 transition-all hover:shadow-glow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">{item.name}</h3>
                <p className="text-xs text-gray-500 font-mono">{item.partNumber}</p>
              </div>
              <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(item.status)}`}>
                {item.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Quantity:</span>
                <span className={`font-bold ${item.quantity <= item.minQuantity ? 'text-yellow-300' : 'text-white'}`}>
                  {item.quantity}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Min Stock:</span>
                <span className="text-gray-300">{item.minQuantity}</span>
              </div>
              <div className="flex items-start gap-2">
                <FiMapPin className="text-gray-400 mt-0.5" />
                <span className="text-gray-300 text-xs">{item.location}</span>
              </div>
              {item.notes && (
                <div className="p-2 bg-white/5 rounded border border-white/10">
                  <p className="text-xs text-gray-400">{item.notes}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => orderPart({ partNumber: item.partNumber, quantity: 10 })}
                disabled={item.status === "on_order"}
                className="flex-1 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Order More
              </button>
            </div>
          </div>
        ))}
        {filteredInventory?.length === 0 && (
          <div className="col-span-3 glass p-12 rounded-xl border border-white/10 text-center">
            <FiPackage className="text-6xl mb-4 mx-auto text-gray-600" />
            <p className="text-xl text-gray-400">No inventory items</p>
            <p className="text-gray-500 mt-2">Click "Seed Inventory" to add mock data</p>
          </div>
        )}
      </div>
    </div>
  );
}
