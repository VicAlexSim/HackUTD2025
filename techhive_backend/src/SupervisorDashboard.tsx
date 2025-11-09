import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { useState, useRef, FormEvent } from "react";
import { toast } from "sonner";

export function SupervisorDashboard() {
  const activeFeeds = useQuery(api.videoFeeds.getActiveFeeds);
  const allTickets = useQuery(api.agenticTickets.getAllTickets);
  const [selectedFeed, setSelectedFeed] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
          🎯 Supervisor Dashboard
        </h1>
        <p className="text-slate-300">
          Real-time monitoring powered by NVIDIA Nemotron AI
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-700">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span>📹</span> Live Technician POV Feeds
          </h2>
          {activeFeeds === undefined ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-500 border-t-transparent"></div>
            </div>
          ) : activeFeeds.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-lg">No active feeds</p>
              <p className="text-sm mt-2">Waiting for technicians to connect...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {activeFeeds.map((feed) => (
                <div
                  key={feed._id}
                  className="bg-slate-900/50 rounded-xl p-4 border border-slate-600 hover:border-green-500 transition-colors cursor-pointer"
                  onClick={() => setSelectedFeed(feed._id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="font-bold">{feed.techName}</span>
                    </div>
                    <span className="text-xs text-slate-400">LIVE</span>
                  </div>
                  {feed.frameUrl && (
                    <img
                      src={feed.frameUrl}
                      alt="POV Feed"
                      className="w-full h-48 object-cover rounded-lg mb-3"
                    />
                  )}
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-slate-400">Activity:</span>{" "}
                      <span className="text-green-400">{feed.currentActivity || "Idle"}</span>
                    </div>
                    {feed.detectedAssets && feed.detectedAssets.length > 0 && (
                      <div>
                        <span className="text-slate-400">Assets:</span>{" "}
                        <span className="text-blue-400">{feed.detectedAssets.join(", ")}</span>
                      </div>
                    )}
                    {feed.detectedComponents && feed.detectedComponents.length > 0 && (
                      <div>
                        <span className="text-slate-400">Components:</span>{" "}
                        <span className="text-purple-400">{feed.detectedComponents.join(", ")}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-700">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span>🤖</span> Agentic Ticket System
          </h2>
          {allTickets === undefined ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          ) : allTickets.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-lg">No active tickets</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {allTickets.map((ticket) => (
                <div
                  key={ticket._id}
                  className="bg-slate-900/50 rounded-xl p-4 border border-slate-600"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-sm text-green-400">{ticket.ticketId}</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        ticket.priority === "high"
                          ? "bg-red-500/20 text-red-400 border border-red-500"
                          : ticket.priority === "medium"
                          ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500"
                          : "bg-blue-500/20 text-blue-400 border border-blue-500"
                      }`}
                    >
                      {ticket.priority.toUpperCase()}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm mb-3">
                    <div>
                      <span className="text-slate-400">Tech:</span>{" "}
                      <span className="font-semibold">{ticket.techName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Location:</span>{" "}
                      <span>{ticket.issueLocation}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Issue:</span>{" "}
                      <span className="text-slate-300">{ticket.issueDescription}</span>
                    </div>
                  </div>
                  {ticket.suggestedActions.length > 0 && (
                    <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/30">
                      <p className="text-xs font-bold text-blue-400 mb-2">AI SUGGESTED ACTIONS:</p>
                      <ul className="space-y-1 text-xs">
                        {ticket.suggestedActions.map((action, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-blue-400">•</span>
                            <span className="text-slate-300">{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {ticket.autoUpdates.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs font-bold text-slate-400">AUTO UPDATES:</p>
                      {ticket.autoUpdates.slice(-3).map((update, idx) => (
                        <div key={idx} className="text-xs text-slate-400 flex items-start gap-2">
                          <span>→</span>
                          <span>{update.update}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <SimulatedTechnicianControls />
    </div>
  );
}

function SimulatedTechnicianControls() {
  const [image, setImage] = useState<File | null>(null);
  const [issueId, setIssueId] = useState<string>("");
  const imageInput = useRef<HTMLInputElement>(null);
  const generateUploadUrl = useMutation(api.videoFeeds.generateUploadUrl);
  const uploadFrame = useMutation(api.videoFeeds.uploadFrame);
  const user = useQuery(api.auth.loggedInUser);

  const handleUploadFrame = async (e: FormEvent) => {
    e.preventDefault();
    if (!image || !user) {
      toast.error("Please select an image and ensure you're logged in");
      return;
    }

    const toastId = toast.loading("Uploading POV frame...");

    try {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": image.type },
        body: image,
      });
      const { storageId } = await result.json();

      await uploadFrame({
        storageId,
        issueId: issueId ? (issueId as any) : undefined,
      });

      setImage(null);
      if (imageInput.current) imageInput.current.value = "";
      toast.success("Frame uploaded and analyzed!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload frame", { id: toastId });
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-700">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <span>🎮</span> Simulate Technician POV (Smart Glasses)
      </h2>
      <form onSubmit={handleUploadFrame} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Upload POV Frame (simulating camera glasses)
          </label>
          <input
            type="file"
            accept="image/*"
            ref={imageInput}
            onChange={(e) => setImage(e.target.files?.[0] ?? null)}
            className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-900 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-500 file:text-white hover:file:bg-green-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Issue ID (optional)
          </label>
          <input
            type="text"
            value={issueId}
            onChange={(e) => setIssueId(e.target.value)}
            placeholder="Leave blank for general monitoring"
            className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-900 text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={!image}
          className="px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold hover:from-green-600 hover:to-blue-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Upload & Analyze Frame
        </button>
      </form>
    </div>
  );
}
