"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getRun, generateLinkedInPack, generateImage } from "@/lib/api";
import type { RunState, LinkedInPack } from "@/lib/types";
import LinkedInPackModal from "@/components/LinkedInPackModal";

export default function LinkedInPackPage() {
  const { runId } = useParams<{ runId: string }>();
  const router = useRouter();
  const [state, setState] = useState<RunState | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<"loading" | "generating" | "done" | "error">("loading");
  const [error, setError] = useState("");
  const [linkedInPack, setLinkedInPack] = useState<LinkedInPack | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);

  const fetchState = useCallback(async () => {
    try {
      const data = await getRun(runId);
      setState(data);
      
      // If LinkedIn pack already exists, show it immediately
      if (data.linkedin_pack) {
        setLinkedInPack(data.linkedin_pack);
        setStatus("done");
        
        // Extract LinkedIn-related logs if they exist
        if (data.logs) {
          const linkedInLogs = data.logs.filter(log => 
            log.includes("LinkedIn") || 
            log.includes("Claims") || 
            log.includes("Post") || 
            log.includes("Image") ||
            log.includes("Crew") ||
            log.includes("✓") ||
            log.includes("▶")
          );
          if (linkedInLogs.length > 0) {
            setLogs(linkedInLogs);
          } else {
            setLogs(["✅ LinkedIn Pack was previously generated successfully"]);
          }
        } else {
          setLogs(["✅ LinkedIn Pack was previously generated successfully"]);
        }
        
        return data;
      }
      
      return data;
    } catch (e: any) {
      setError(e.message);
      setStatus("error");
      return null;
    }
  }, [runId]);

  const startGeneration = useCallback(async () => {
    setStatus("generating");
    setLogs((prev) => [...prev, "🚀 Starting LinkedIn Pack generation..."]);
    
    try {
      // Call the API to start generation
      setLogs((prev) => [...prev, "▶ Step 1: Claims Agent - analyzing for risky claims..."]);
      await generateLinkedInPack(runId);
      
      // Poll for updates
      const pollInterval = setInterval(async () => {
        const updated = await fetchState();
        
        // Update logs from state
        if (updated?.logs) {
          const newLogs = updated.logs.filter(log => 
            log.includes("LinkedIn") || 
            log.includes("Claims") || 
            log.includes("Post") || 
            log.includes("Image")
          );
          setLogs(newLogs);
        }
        
        // Check if completed
        if (updated?.linkedin_pack) {
          clearInterval(pollInterval);
          setLinkedInPack(updated.linkedin_pack);
          setStatus("done");
          setLogs((prev) => [...prev, "✅ LinkedIn Pack generation complete!"]);
        }
      }, 2000);
      
      // Cleanup after 2 minutes
      setTimeout(() => clearInterval(pollInterval), 120000);
      
    } catch (e: any) {
      setError(e.message);
      setStatus("error");
      setLogs((prev) => [...prev, `❌ Error: ${e.message}`]);
    }
  }, [runId, fetchState]);

  const handleGenerateImage = useCallback(async () => {
    setGeneratingImage(true);
    setLogs((prev) => [...prev, "🎨 Generating image with Leonardo AI..."]);
    
    try {
      const result = await generateImage(runId);
      
      // Update the linkedInPack with the generated image
      if (linkedInPack) {
        setLinkedInPack({
          ...linkedInPack,
          generated_image: result
        });
      }
      
      // Refresh state
      await fetchState();
      
      setLogs((prev) => [...prev, `✅ Image generated successfully! ${result.images?.length || 0} image(s)`]);
    } catch (e: any) {
      setError(e.message);
      setLogs((prev) => [...prev, `❌ Image generation failed: ${e.message}`]);
    } finally {
      setGeneratingImage(false);
    }
  }, [runId, linkedInPack, fetchState]);

  useEffect(() => {
    const init = async () => {
      const data = await fetchState();
      
      // Check if Pipeline A is complete
      if (!data || (data.status !== "DONE" && data.status !== "DONE_WITH_WARNINGS")) {
        setError("Pipeline A must be completed before generating LinkedIn pack");
        setStatus("error");
        return;
      }
      
      // AUTO-START DISABLED - User must click "Generate" button manually
      // Uncomment below to re-enable auto-start
      /*
      if (!data.linkedin_pack) {
        await startGeneration();
      }
      */
    };
    
    init();
  }, [fetchState, startGeneration]);

  if (error && status === "error") {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-6 py-4">
            <h2 className="font-semibold">Error</h2>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={() => router.push(`/runs/${runId}`)}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg"
            >
              ← Back to Run
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">LinkedIn Pack Generation</h1>
            <p className="text-sm text-gray-500 mt-1">Run ID: {runId}</p>
          </div>
          <button
            onClick={() => router.push(`/runs/${runId}`)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            ← Back to Run
          </button>
        </div>

        {/* Status Banner */}
        {status === "loading" && !linkedInPack && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-blue-700 font-medium">Ready to generate LinkedIn Pack</span>
              <button
                onClick={startGeneration}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
              >
                🚀 Start Generation
              </button>
            </div>
          </div>
        )}

        {status === "generating" && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
              <span className="text-blue-700 font-medium">Generating LinkedIn Pack...</span>
            </div>
          </div>
        )}

        {status === "done" && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <span className="text-green-700 font-medium">LinkedIn Pack Ready!</span>
            </div>
          </div>
        )}

        {/* Live Logs */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
          <div className="border-b border-gray-200 px-4 py-3">
            <h2 className="font-semibold text-gray-900">Generation Process</h2>
          </div>
          <div className="p-4">
            <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-gray-400 text-sm">Waiting for logs...</p>
              ) : (
                <div className="space-y-1">
                  {logs.map((log, idx) => (
                    <div key={idx} className="text-green-400 text-sm font-mono">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results - Show when complete */}
        {status === "done" && linkedInPack && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="border-b border-gray-200 px-4 py-3">
              <h2 className="font-semibold text-gray-900">Results</h2>
            </div>
            <div className="p-6">
              {/* Embedded Modal Content */}
              <div className="space-y-6">
                {/* LinkedIn Post */}
                {linkedInPack.linkedin_post && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="text-blue-600">💼</span> LinkedIn Post
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <textarea
                      value={linkedInPack.linkedin_post.post_text}
                      readOnly
                      className="w-full bg-white border border-gray-300 rounded-lg p-3 text-sm resize-none"
                      rows={10}
                    />
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {linkedInPack.linkedin_post.word_count} words
                      </span>
                      <button
                        onClick={() => {
                          const fullPost = `${linkedInPack.linkedin_post.post_text}\n\n${linkedInPack.linkedin_post.hashtags.join(" ")}\n\n${linkedInPack.linkedin_post.cta}`;
                          navigator.clipboard.writeText(fullPost);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-md"
                      >
                        📋 Copy Full Post
                      </button>
                    </div>
                    {linkedInPack.linkedin_post.hashtags && linkedInPack.linkedin_post.hashtags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {linkedInPack.linkedin_post.hashtags.map((tag, idx) => (
                        <span key={idx} className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                    )}
                    {linkedInPack.linkedin_post.cta && (
                    <div className="mt-3 bg-gradient-to-r from-brand-50 to-purple-50 rounded-lg p-3 border border-brand-200">
                      <p className="text-sm font-medium text-gray-700">Call to Action:</p>
                      <p className="text-sm text-gray-600 mt-1">{linkedInPack.linkedin_post.cta}</p>
                    </div>
                    )}
                  </div>
                </div>
                )}

                {/* Claims Check */}
                {linkedInPack.claims_check && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="text-amber-600">⚖️</span> Claims Compliance Check
                  </h3>
                  <div className="space-y-3">
                    {/* Assessment */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Risk Assessment:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        linkedInPack.claims_check.overall_assessment === "LOW_RISK" 
                          ? "bg-green-100 text-green-700"
                          : linkedInPack.claims_check.overall_assessment === "MEDIUM_RISK"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {linkedInPack.claims_check.overall_assessment.replace("_", " ")}
                      </span>
                    </div>

                    {/* Safe Claims */}
                    {linkedInPack.claims_check.safe_claims && linkedInPack.claims_check.safe_claims.length > 0 && (
                      <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4">
                        <p className="text-sm font-medium text-green-900 mb-2">✅ Safe Claims ({linkedInPack.claims_check.safe_claims.length})</p>
                        <ul className="space-y-1">
                          {linkedInPack.claims_check.safe_claims.map((claim, idx) => (
                            <li key={idx} className="text-sm text-green-700">• {claim}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Risky Claims */}
                    {linkedInPack.claims_check.risky_claims && linkedInPack.claims_check.risky_claims.length > 0 ? (
                      <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                        <p className="text-sm font-medium text-red-900 mb-2">⚠️ Risky Claims ({linkedInPack.claims_check.risky_claims.length})</p>
                        <div className="space-y-3">
                          {linkedInPack.claims_check.risky_claims.map((claim, idx) => (
                            <div key={idx} className="bg-white rounded-lg p-3 border border-red-200">
                              <div className="flex items-start gap-2">
                                <span className="text-red-500 font-bold">!</span>
                                <div className="flex-1">
                                  <p className="text-sm text-red-700 font-medium">{claim.claim}</p>
                                  <span className="inline-block mt-1 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded">
                                    {claim.risk_type}
                                  </span>
                                  <div className="mt-2 bg-green-50 border border-green-200 rounded p-2">
                                    <p className="text-xs text-green-700">
                                      <strong>Suggestion:</strong> {claim.suggestion}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4">
                        <p className="text-sm text-green-700">✅ No risky claims detected</p>
                      </div>
                    )}
                  </div>
                </div>
                )}

                {/* Image Prompt */}
                {linkedInPack.image_prompt && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="text-purple-600">🎨</span> AI Image Prompt
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                      <p className="text-xs font-semibold text-purple-900 mb-2">Main Prompt</p>
                      <p className="text-sm text-gray-700">{linkedInPack.image_prompt.prompt}</p>
                    </div>
                    
                    {linkedInPack.image_prompt.negative_prompt && (
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Negative Prompt</p>
                        <p className="text-sm text-gray-600">{linkedInPack.image_prompt.negative_prompt}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <p className="text-xs font-semibold text-gray-600">Model</p>
                        <p className="text-sm text-gray-800 mt-1">{linkedInPack.image_prompt.model_suggestion}</p>
                      </div>
                      {linkedInPack.image_prompt.style_notes && (
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <p className="text-xs font-semibold text-gray-600">Style Notes</p>
                          <p className="text-sm text-gray-800 mt-1">{linkedInPack.image_prompt.style_notes}</p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        const promptText = `Main Prompt:\n${linkedInPack.image_prompt.prompt}\n\nNegative Prompt:\n${linkedInPack.image_prompt.negative_prompt}`;
                        navigator.clipboard.writeText(promptText);
                      }}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-lg"
                    >
                      📋 Copy Prompt
                    </button>

                    {/* Generated Image Display */}
                    {linkedInPack.generated_image && linkedInPack.generated_image.images && linkedInPack.generated_image.images.length > 0 ? (
                      <div className="space-y-3">
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                          <p className="text-sm font-medium text-green-900 mb-3">✅ Image Generated Successfully!</p>
                          {linkedInPack.generated_image.images.map((imageUrl, idx) => (
                            <div key={idx} className="space-y-2">
                              <img 
                                src={imageUrl} 
                                alt={`Generated image ${idx + 1}`}
                                className="w-full rounded-lg border border-gray-200 shadow-sm"
                              />
                              <a
                                href={imageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-md"
                              >
                                🔗 Open Full Size
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={handleGenerateImage}
                        disabled={generatingImage}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition flex items-center justify-center gap-2"
                      >
                        {generatingImage ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                            Generating Image...
                          </>
                        ) : (
                          <>🎨 Generate Image with Leonardo AI</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
