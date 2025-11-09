// Test script for ElevenLabs voice alerts
const CONVEX_SITE_URL = "https://accurate-marlin-326.convex.site";

async function testVoiceAlert() {
  console.log("🎤 Testing ElevenLabs Voice Alert System\n");

  // Step 1: Check system health
  console.log("1️⃣ Checking system health...");
  try {
    const healthResponse = await fetch(`${CONVEX_SITE_URL}/api/health`);
    const health = await healthResponse.json();
    console.log("✅ System Status:", health.status);
    console.log("📊 Environment:");
    console.log("   - OpenRouter:", health.environment.openRouterConfigured ? "✅" : "❌");
    console.log("   - ElevenLabs:", health.environment.elevenLabsConfigured ? "✅" : "❌");
    console.log();

    if (!health.environment.elevenLabsConfigured) {
      console.log("❌ ElevenLabs API key not configured!");
      console.log("Run: npx convex env set ELEVENLABS_API_KEY your_key_here");
      return;
    }
  } catch (error) {
    console.error("❌ Health check failed:", error.message);
    console.log("\n💡 Make sure 'npx convex dev' is running!");
    return;
  }

  // Step 2: Create a test technician
  console.log("2️⃣ Creating test technician...");
  const testTechnicianId = "test_tech_" + Date.now();
  console.log("   Technician ID:", testTechnicianId);
  console.log();

  // Step 3: Send test voice alert
  console.log("3️⃣ Sending test voice alert...");
  const testMessage = "Safety alert: Hard hat not detected in work zone. Please put on your safety equipment immediately.";
  
  try {
    const response = await fetch(`${CONVEX_SITE_URL}/api/test-voice`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        technicianId: testTechnicianId,
        message: testMessage,
      }),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log("✅ Voice alert sent successfully!");
      console.log("📝 Message:", testMessage);
      console.log("🔊 Spoken:", result.result.spoken ? "Yes" : "No");
      if (result.result.audioUrl) {
        console.log("🎵 Audio URL:", result.result.audioUrl);
      }
      console.log();
      console.log("🎉 Test completed! ElevenLabs is working!");
    } else {
      console.error("❌ Failed to send voice alert");
      console.error("Error:", result.error);
      if (result.details) {
        console.error("Details:", result.details);
      }
    }
  } catch (error) {
    console.error("❌ Request failed:", error.message);
  }
}

// Run the test
testVoiceAlert().catch(console.error);

