import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useRef } from "react";
import { toast } from "sonner";

export function CameraFeedPanel() {
  const feeds = useQuery(api.cameraFeeds.list, {});
  const technicians = useQuery(api.technicians.list);
  const generateUploadUrl = useMutation(api.cameraFeeds.generateUploadUrl);
  const createFeed = useMutation(api.cameraFeeds.create);
  const analyzeImage = useAction(api.agents.analyzeImage);
  
  const [selectedTechnicianId, setSelectedTechnicianId] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const imageInput = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImage || !selectedTechnicianId) return;

    setIsUploading(true);
    try {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": selectedImage.type },
        body: selectedImage,
      });

      const json = await result.json();
      if (!result.ok) {
        throw new Error(`Upload failed: ${JSON.stringify(json)}`);
      }

      const { storageId } = json;
      const feedId = await createFeed({
        technicianId: selectedTechnicianId,
        imageStorageId: storageId,
      });

      toast.success("Image uploaded successfully");
      setSelectedImage(null);
      setSelectedTechnicianId("");
      if (imageInput.current) imageInput.current.value = "";

      // Trigger analysis
      setIsAnalyzing(true);
      const imageUrl = URL.createObjectURL(selectedImage);
      await analyzeImage({ feedId, imageUrl });
      setIsAnalyzing(false);
      toast.success("Image analysis complete");
    } catch (error) {
      toast.error("Failed to upload image");
      console.error(error);
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Camera Feeds</h2>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Upload Camera Feed</h3>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Technician</label>
            <select
              value={selectedTechnicianId}
              onChange={(e) => setSelectedTechnicianId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select technician...</option>
              {technicians?.map((tech) => (
                <option key={tech._id} value={tech._id}>
                  {tech.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
            <input
              type="file"
              accept="image/*"
              ref={imageInput}
              onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isUploading || isAnalyzing || !selectedImage || !selectedTechnicianId}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? "Uploading..." : isAnalyzing ? "Analyzing..." : "Upload & Analyze"}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {feeds?.map((feed) => (
          <div key={feed._id} className="bg-white rounded-lg shadow-sm overflow-hidden">
            {feed.imageUrl && (
              <img src={feed.imageUrl} alt="Camera feed" className="w-full h-48 object-cover" />
            )}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">
                  Technician: {feed.technicianId}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(feed._creationTime).toLocaleString()}
                </span>
              </div>
              {feed.analysis && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs font-medium text-blue-900 mb-1">AI Analysis</p>
                  <p className="text-xs text-blue-800">{feed.analysis.substring(0, 150)}...</p>
                  {feed.confidence && (
                    <p className="text-xs text-blue-600 mt-2">
                      Confidence: {(feed.confidence * 100).toFixed(0)}%
                    </p>
                  )}
                </div>
              )}
              {feed.detectedIssues && feed.detectedIssues.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-red-900 mb-1">Detected Issues</p>
                  <div className="space-y-1">
                    {feed.detectedIssues.map((issue, idx) => (
                      <p key={idx} className="text-xs text-red-700 bg-red-50 px-2 py-1 rounded">
                        {issue}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
