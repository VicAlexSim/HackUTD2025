import { useState } from "react";
import logo from "./logo.jpg";

export function LandingPage({ onGetStarted, onLogin }: { onGetStarted: () => void; onLogin: () => void }) {
  const [activeTab, setActiveTab] = useState<"demo" | "start">("demo");
  
  const date = new Date()
  
  date.setDate(date.getDate()-2)

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-800 via-gray-900 to-gray-950">
      {/* Transparent Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/5 border-b border-white/10">
        <div className="w-full px-6 py-2 flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <img src={logo} alt="Kramhtron.ai" className="h-16 w-auto rounded-lg" />
            <span className="text-2xl font-bold glassy-text">Kramhtron.ai</span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <a href="#home" className="glassy-text hover:text-white transition-colors font-medium text-sm">
              Home
            </a>
            <a href="#features" className="glassy-text hover:text-white transition-colors font-medium text-sm">
              Our Features
            </a>
            <a href="#about" className="glassy-text hover:text-white transition-colors font-medium text-sm">
              About Us
            </a>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onLogin}
              className="px-4 py-1.5 glassy-text hover:text-white font-semibold transition-colors text-sm rounded-full"
            >
              Login
            </button>
            <button
              onClick={onGetStarted}
              className="px-4 py-1.5 bg-gradient-primary text-dark rounded-full font-semibold hover:shadow-glow transition-all transform hover:scale-105 text-sm"
            >
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section with top padding for navbar */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 pt-20">
      {/* Hero Section */}
      <div className="max-w-4xl w-full text-center mb-8">
        {/* Logo */}
        <div className="mb-4 flex justify-center">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-primary rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
            <div className="relative bg-gradient-primary rounded-2xl shadow-glow-lg overflow-hidden w-32 h-32">
              <img src={logo} alt="Kramhtron.ai" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Brand Name */}
        <div className="mb-3 inline-block">
          <div className="glass-strong px-6 py-2 rounded-xl border border-white/20">
            <h1 className="text-3xl font-bold glassy-text flex items-center gap-2">
              Kramhtron.ai
              <span className="text-lg">✨</span>
            </h1>
          </div>
        </div>

        {/* Tagline */}
        <div className="w-full flex justify-center mb-3">
          <h2 className="text-2xl md:text-3xl font-bold glassy-text leading-tight whitespace-nowrap">
            Your Personal AI-Powered <span className="gradient-text">Technician Assistant</span>
          </h2>
        </div>

        {/* Catchy Phrase */}
        <p className="text-lg glassy-text mb-6 italic">
          "Where <span className="font-semibold">YOU</span> can talk to your AI Copilot for Data Center Ops"
        </p>

        {/* CTA Buttons */}
        <div className="flex justify-center mb-6">
          <div className="glass-strong p-1.5 rounded-full inline-flex gap-2 border border-white/10">
            <button
              onClick={() => setActiveTab("demo")}
              className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all ${
                activeTab === "demo"
                  ? "bg-gradient-primary text-dark shadow-glow border-2 border-[#64A8F0]"
                  : "glassy-text hover:text-white hover:bg-white/5 border border-white/20"
              }`}
            >
              Try Demo
            </button>
            <button
              onClick={() => {
                setActiveTab("start");
                onGetStarted();
              }}
              className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all ${
                activeTab === "start"
                  ? "bg-gradient-primary text-dark shadow-glow border-2 border-[#64A8F0]"
                  : "glassy-text hover:text-white hover:bg-white/5 border border-white/20"
              }`}
            >
              Start Now
            </button>
          </div>
        </div>
      </div>

      {/* Preview Image/Dashboard */}
      <div className="max-w-5xl w-full">
        <div className="relative group">
          {/* Glow effect behind */}
          <div className="absolute -inset-2 bg-gradient-primary rounded-2xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
          
          {/* Main preview container */}
          <div className="relative glass-strong rounded-xl border border-white/20 overflow-hidden shadow-glow-lg">
            {/* Mock Dashboard Header */}
            <div className="bg-gradient-dark border-b border-white/10 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={logo} alt="Kramhtron.ai" className="h-5 w-auto rounded-sm" />
                <span className="text-base font-bold glassy-text">Kramhtron.ai</span>
              </div>
              <div className="flex items-center gap-3">
                <button className="glassy-text hover:text-white text-xs transition-colors">
                  Help
                </button>
                <button className="px-3 py-1 bg-gradient-primary text-dark rounded-full font-semibold text-xs">
                  Sign Out
                </button>
              </div>
            </div>

            {/* Mock Dashboard Content */}
            <div className="grid md:grid-cols-3 gap-4 p-4">
              {/* User Information Panel */}
              <div className="glass p-4 rounded-lg border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold glassy-text flex items-center gap-1.5">
                    <span>👤</span> Rack Intelligence
                  </h3>
                  <button className="text-blue-400 text-xs">Show</button>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <p className="text-gray-500">Rack Identifier</p>
                    <p className="glassy-text font-mono">DFW-H21-R02</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Primary Workload</p>
                    <p className="glassy-text">Storage</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Server Models</p>
                    <p className="glassy-text font-mono">Dell R650 [4] <i>(103 more in DFW-H21 - <a className="underline" href="#">monitor similar servers</a>)</i></p>
                  </div>
                  <div>
                    <p className="text-gray-500">Last Issue Reported</p>
                    <p className="glassy-text font-mono">{date.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Chat Transcript Panel */}
              <div className="md:col-span-2 glass p-4 rounded-lg border border-white/10">
                <h3 className="text-sm font-semibold glassy-text mb-3 flex items-center gap-1.5">
                  <span>💬</span> Live Camera Feed & Analysis
                </h3>
                <div className="space-y-3">
                  {/* User Message */}
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs">
                      👤
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-semibold glassy-text">Technician</span>
                        <span className="text-[10px] text-gray-500">10:30 AM</span>
                      </div>
                      <div className="glass-strong p-2 rounded-lg border border-white/10">
                        <p className="text-xs glassy-text">High temps detected on DFW-H21-R02-S2321, DFW-H21-R02-S2322, and 1 more server...</p>
                      </div>
                    </div>
                  </div>

                  {/* AI Response */}
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-primary flex items-center justify-center text-xs">
                      🤖
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-semibold gradient-text">AI Agent</span>
                        <span className="text-[10px] text-gray-500">10:30 AM</span>
                      </div>
                      <div className="glass-strong p-2 rounded-lg border border-white/10">
                        <p className="text-xs glassy-text">
                          Analysis complete. Creating ticket and dispatching nearest technician...
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status Update */}
                  <div className="glass p-2 rounded-lg border border-green-500/30 bg-green-500/10">
                    <p className="text-xs text-green-300 flex items-center gap-1.5">
                      <span>✅</span> Ticket #TK-2847 created • Technician assigned • ETA: 15 minutes
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      </div>
    </div>
  );
}
