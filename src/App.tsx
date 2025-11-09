import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState } from "react";
import { Id } from "../convex/_generated/dataModel";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <h2 className="text-xl font-semibold text-primary">Technician Vision AI</h2>
        <SignOutButton />
      </header>
      <main className="flex-1 p-8">
        <Content />
      </main>
      <Toaster />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <Authenticated>
        <Dashboard />
      </Authenticated>
      <Unauthenticated>
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-4">Multi-Agent Maintenance System</h1>
            <p className="text-xl text-secondary">Sign in to access the dashboard</p>
          </div>
          <SignInForm />
        </div>
      </Unauthenticated>
    </div>
  );
}

function Dashboard() {
  const [activeTab, setActiveTab] = useState<"tickets" | "technicians" | "cameras" | "docs">("tickets");

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">Maintenance Control Center</h1>
        <p className="text-secondary">Multi-agent system with vision AI, voice guidance, and autonomous ticket management</p>
      </div>

      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab("tickets")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "tickets"
              ? "text-primary border-b-2 border-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Tickets
        </button>
        <button
          onClick={() => setActiveTab("technicians")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "technicians"
              ? "text-primary border-b-2 border-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Technicians
        </button>
        <button
          onClick={() => setActiveTab("cameras")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "cameras"
              ? "text-primary border-b-2 border-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Cameras
        </button>
        <button
          onClick={() => setActiveTab("docs")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "docs"
              ? "text-primary border-b-2 border-primary"
              : "text-gray-500 hover:text-gray-700"
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
      low: "bg-blue-100 text-blue-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      critical: "bg-red-100 text-red-800",
    };
    return colors[priority] || "bg-gray-100 text-gray-800";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-gray-100 text-gray-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      blocked: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Tickets</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-hover transition-colors"
        >
          {showForm ? "Cancel" : "Create Ticket"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreateTicket} className="bg-white p-6 rounded-lg shadow mb-6">
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
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                name="description"
                required
                rows={3}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <select
                name="priority"
                required
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primary"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-primary text-white rounded hover:bg-primary-hover transition-colors"
            >
              Create
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4">
        {tickets?.map((ticket) => (
          <div key={ticket._id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold">{ticket.title}</h3>
              <div className="flex gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                  {ticket.priority}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(ticket.status)}`}>
                  {ticket.status}
                </span>
              </div>
            </div>
            <p className="text-gray-600 mb-3">{ticket.description}</p>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>Created by: {ticket.createdBy}</span>
              {ticket.technician && (
                <span>Assigned to: {ticket.technician.name}</span>
              )}
            </div>
            {ticket.metadata?.detectedIssue && (
              <div className="mt-3 p-3 bg-yellow-50 rounded border border-yellow-200">
                <p className="text-sm font-medium text-yellow-800">AI Detected Issue</p>
                <p className="text-sm text-yellow-700 mt-1">{ticket.metadata.detectedIssue}</p>
              </div>
            )}
          </div>
        ))}
        {tickets?.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No tickets yet. Create one to get started.
          </div>
        )}
      </div>
    </div>
  );
}

function TechniciansView() {
  const technicians = useQuery(api.technicians.listTechnicians, {});
  const createTechnician = useMutation(api.technicians.createTechnician);
  const [showForm, setShowForm] = useState(false);

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
              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(tech.status)}`}>
                {tech.status}
              </span>
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
    </div>
  );
}

function CamerasView() {
  const cameras = useQuery(api.cameras.listCameras, {});
  const createCamera = useMutation(api.cameras.createCamera);
  const [showForm, setShowForm] = useState(false);

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
        <h2 className="text-2xl font-bold">Camera Feeds</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-hover transition-colors"
        >
          {showForm ? "Cancel" : "Add Camera"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreateCamera} className="bg-white p-6 rounded-lg shadow mb-6">
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
              <label className="block text-sm font-medium mb-1">Stream URL</label>
              <input
                name="streamUrl"
                type="text"
                required
                placeholder="rtsp://... or http://..."
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <input
                name="location"
                type="text"
                required
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cameras?.map((camera) => (
          <div key={camera._id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-semibold">{camera.name}</h3>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                camera.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
              }`}>
                {camera.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div>
                <span className="font-medium">Location:</span> {camera.location}
              </div>
              <div className="text-xs break-all">
                <span className="font-medium">Stream:</span> {camera.streamUrl}
              </div>
            </div>
          </div>
        ))}
        {cameras?.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-500">
            No cameras yet. Add one to get started.
          </div>
        )}
      </div>
    </div>
  );
}

function DocumentsView() {
  const documents = useQuery(api.documents.listDocuments, {});
  const createDocument = useMutation(api.documents.createDocument);
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
              <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(doc.category)}`}>
                {doc.category}
              </span>
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
