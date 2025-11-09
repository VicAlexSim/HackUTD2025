import {
  Authenticated,
  Unauthenticated,
  useAction,
  useMutation,
  useQuery,
} from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster, toast } from "sonner";
import { FormEvent, useRef, useState } from "react";
import { Id } from "../convex/_generated/dataModel";
import { ChatModal } from "./ChatModal";
import { SupervisorDashboard } from "./SupervisorDashboard";

type IssueWithDetails = NonNullable<
  ReturnType<typeof useQuery<typeof api.issues.getIssues>>
>[0];

export default function App() {
  const [viewMode, setViewMode] = useState<"technician" | "supervisor">("technician");

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md h-16 flex justify-between items-center border-b border-slate-200 shadow-sm px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">N</span>
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-800 bg-clip-text text-transparent">
            Nemotron DataCenter AI
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <Authenticated>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("technician")}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  viewMode === "technician"
                    ? "bg-blue-500 text-white"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
              >
                👷 Technician
              </button>
              <button
                onClick={() => setViewMode("supervisor")}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  viewMode === "supervisor"
                    ? "bg-green-500 text-white"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
              >
                🎯 Supervisor
              </button>
            </div>
          </Authenticated>
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1 p-6 md:p-8">
        <div className="w-full max-w-7xl mx-auto">
          {viewMode === "supervisor" ? <SupervisorDashboard /> : <Content />}
        </div>
      </main>
      <Toaster position="top-right" />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center py-8">
        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-green-600 via-blue-700 to-blue-800 bg-clip-text text-transparent mb-4">
          NVIDIA Nemotron AI Assistant
        </h1>
        <Authenticated>
          <p className="text-xl text-slate-600">
            Welcome back, <span className="font-semibold">{loggedInUser?.name ?? "Technician"}</span>!
          </p>
          <p className="text-sm text-slate-500 mt-2">
            AI-powered collaboration for data center operations • Multimodal analysis • Agentic ticketing
          </p>
        </Authenticated>
        <Unauthenticated>
          <p className="text-xl text-slate-600">Sign in to access the AI-powered platform</p>
        </Unauthenticated>
      </div>

      <Unauthenticated>
        <div className="max-w-md mx-auto">
          <SignInForm />
        </div>
      </Unauthenticated>
      <Authenticated>
        <IssueForm />
        <IssueFeed />
      </Authenticated>
    </div>
  );
}

function IssueForm() {
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const imageInput = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.issues.generateUploadUrl);
  const createIssue = useAction(api.ai.createIssue);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!image || !description || !location) {
      toast.error("Please fill out all fields and select an image.");
      return;
    }

    const toastId = toast.loading("Analyzing with Nemotron AI...");

    try {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": image.type },
        body: image,
      });
      const { storageId } = await result.json();

      await createIssue({
        storageId,
        description,
        location,
      });

      setDescription("");
      setLocation("");
      setImage(null);
      if (imageInput.current) {
        imageInput.current.value = "";
      }
      toast.success("Issue reported & AI ticket created!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Failed to report issue.", { id: toastId });
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-slate-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <span className="text-2xl">📝</span>
        </div>
        <h3 className="text-2xl font-bold text-slate-800">Report New Issue</h3>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Issue Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue in detail..."
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all shadow-sm"
            rows={3}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Zone B, Rack 12, Server 5"
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Equipment Photo
          </label>
          <input
            type="file"
            accept="image/*"
            ref={imageInput}
            onChange={(e) => setImage(e.target.files?.[0] ?? null)}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all shadow-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        <button
          type="submit"
          className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-blue-600 text-white font-semibold hover:from-green-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit Issue (AI Analysis)
        </button>
      </form>
    </div>
  );
}

function IssueFeed() {
  const issues = useQuery(api.issues.getIssues);
  const [chatState, setChatState] = useState<{
    issue: IssueWithDetails;
    techToChatWith: { techId: Id<"users">; techName: string };
  } | null>(null);

  const getStatusBadge = (status: string) => {
    const styles = {
      open: "bg-yellow-100 text-yellow-800 border-yellow-200",
      in_progress: "bg-blue-100 text-blue-800 border-blue-200",
      resolved: "bg-green-100 text-green-800 border-green-200",
    };
    return styles[status as keyof typeof styles] || styles.open;
  };

  return (
    <>
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <span className="text-2xl">📋</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800">Issue Feed</h3>
        </div>
        <div className="flex flex-col gap-6">
          {issues === undefined ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          ) : issues.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 text-lg">No issues reported yet.</p>
              <p className="text-slate-400 text-sm mt-2">
                Be the first to report an issue!
              </p>
            </div>
          ) : (
            issues.map((issue) => (
              <div
                key={issue._id}
                className="border border-slate-200 p-6 rounded-xl hover:shadow-md transition-shadow bg-slate-50"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(issue.status)}`}
                    >
                      {issue.status.replace("_", " ").toUpperCase()}
                    </span>
                    {issue.agenticTicketId && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                        🤖 {issue.agenticTicketId}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(issue._creationTime).toLocaleString()}
                  </span>
                </div>

                {issue.patternDetected && (
                  <div className="p-4 mb-4 bg-red-50 text-red-800 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">⚠️</span>
                      <p className="font-bold">
                        Pattern Detected: Multiple similar issues reported recently
                      </p>
                    </div>
                  </div>
                )}

                {issue.nextStepSuggestions && issue.nextStepSuggestions.length > 0 && (
                  <div className="p-4 mb-4 bg-green-50 text-green-900 rounded-lg border border-green-200">
                    <h4 className="font-bold flex items-center gap-2 mb-2">
                      <span>🤖</span> Nemotron AI Next Steps
                    </h4>
                    <ul className="space-y-1 text-sm">
                      {issue.nextStepSuggestions.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-green-600">•</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {issue.rootCauseAnalysis && (
                  <div className="p-4 mb-4 bg-amber-50 text-amber-900 rounded-lg border border-amber-200">
                    <h4 className="font-bold flex items-center gap-2 mb-2">
                      <span>🔍</span> AI Root Cause Analysis
                    </h4>
                    <p className="whitespace-pre-wrap text-sm">
                      {issue.rootCauseAnalysis}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Technician</p>
                    <p className="text-sm font-semibold text-slate-800">{issue.techName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Location</p>
                    <p className="text-sm font-semibold text-slate-800">{issue.location}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Asset Tag</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {issue.assetTag ?? "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Error Code</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {issue.errorCode ?? "N/A"}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-slate-500 font-medium mb-2">Description</p>
                  <p className="whitespace-pre-wrap text-sm text-slate-700">
                    {issue.description}
                  </p>
                </div>

                {issue.troubleshootingGuide && (
                  <div className="mt-4 p-4 bg-blue-50 text-blue-900 rounded-lg border border-blue-200">
                    <h4 className="font-bold flex items-center gap-2 mb-2">
                      <span>🛠️</span> AI Troubleshooting Guide
                    </h4>
                    <p className="whitespace-pre-wrap text-sm">
                      {issue.troubleshootingGuide}
                    </p>
                  </div>
                )}

                {issue.imageUrl && (
                  <img
                    src={issue.imageUrl}
                    alt="Issue"
                    className="max-w-full h-auto rounded-lg mt-4 border border-slate-200"
                  />
                )}

                {issue.solution ? (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs text-green-700 font-medium mb-1">Solution</p>
                    <p className="text-sm text-green-900 font-semibold">{issue.solution}</p>
                  </div>
                ) : (
                  <SolutionForm issueId={issue._id} />
                )}

                {issue.similarIssues && issue.similarIssues.length > 0 && (
                  <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                      <span>🔗</span> Similar Past Issues
                    </h4>
                    <ul className="space-y-3">
                      {issue.similarIssues.map((similar) => (
                        <li key={similar.issueId} className="text-sm">
                          <p className="text-slate-700 mb-1">"{similar.solution}"</p>
                          <button
                            onClick={() =>
                              setChatState({
                                issue,
                                techToChatWith: {
                                  techId: similar.techId,
                                  techName: similar.techName,
                                },
                              })
                            }
                            className="text-blue-600 hover:text-blue-800 hover:underline font-medium flex items-center gap-1"
                          >
                            <span>💬</span> Connect with {similar.techName}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      {chatState && (
        <ChatModal
          issue={chatState.issue}
          techToChatWith={chatState.techToChatWith}
          onClose={() => setChatState(null)}
        />
      )}
    </>
  );
}

function SolutionForm({ issueId }: { issueId: Id<"issues"> }) {
  const [solution, setSolution] = useState("");
  const addSolution = useMutation(api.issues.addSolution);
  const user = useQuery(api.auth.loggedInUser);
  const issue = useQuery(api.issues.getIssues)?.find((i) => i._id === issueId);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!solution) return;
    try {
      await addSolution({ issueId, solution });
      setSolution("");
      toast.success("Solution added!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to add solution.");
    }
  };

  if (user?._id !== issue?.techId) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
      <input
        type="text"
        value={solution}
        onChange={(e) => setSolution(e.target.value)}
        placeholder="Add a solution..."
        className="flex-grow px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all shadow-sm"
      />
      <button
        type="submit"
        className="px-6 py-2 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors shadow-sm"
      >
        Save Solution
      </button>
    </form>
  );
}
