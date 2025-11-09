import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { FormEvent, useState, useEffect, useRef } from "react";

type IssueWithDetails = NonNullable<
  ReturnType<typeof useQuery<typeof api.issues.getIssues>>
>[0];

export function ChatModal({
  issue,
  techToChatWith,
  onClose,
}: {
  issue: IssueWithDetails;
  techToChatWith: { techId: Id<"users">; techName: string };
  onClose: () => void;
}) {
  const messages = useQuery(api.chat.listMessages, { issueId: issue._id });
  const sendMessage = useMutation(api.chat.sendMessage);
  const [body, setBody] = useState("");
  const currentUser = useQuery(api.auth.loggedInUser);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    await sendMessage({
      to: techToChatWith.techId,
      issueId: issue._id,
      body,
    });
    setBody("");
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col">
        <header className="p-6 border-b border-slate-200 flex justify-between items-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-2xl">
          <div>
            <h3 className="font-bold text-xl text-slate-800">
              Chat with {techToChatWith.techName}
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Issue #{issue._id.slice(-6)} • {issue.location}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-slate-200 transition-colors flex items-center justify-center text-slate-600 hover:text-slate-800 font-bold text-2xl"
          >
            ×
          </button>
        </header>
        <div className="flex-1 p-6 overflow-y-auto bg-slate-50">
          {messages === undefined ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <span className="text-6xl mb-4">💬</span>
              <p className="text-slate-500 text-lg">No messages yet</p>
              <p className="text-slate-400 text-sm mt-2">
                Start the conversation!
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message._id}
                className={`flex mb-4 ${
                  message.from === currentUser?._id
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`rounded-2xl p-4 max-w-xs shadow-sm ${
                    message.from === currentUser?._id
                      ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                      : "bg-white text-slate-800 border border-slate-200"
                  }`}
                >
                  <strong className="font-bold block text-sm mb-1">
                    {message.fromName}
                  </strong>
                  <p className="text-sm">{message.body}</p>
                  <span
                    className={`text-xs mt-2 block ${
                      message.from === currentUser?._id
                        ? "text-blue-100"
                        : "text-slate-500"
                    }`}
                  >
                    {new Date(message._creationTime).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        <footer className="p-6 border-t border-slate-200 bg-white rounded-b-2xl">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type a message..."
              className="flex-grow px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all shadow-sm"
            />
            <button
              type="submit"
              disabled={!body.trim()}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
}
