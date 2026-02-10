"use client";

import { useState } from "react";
import type { LinkedInPack } from "@/lib/types";

interface Props {
  linkedInPack: LinkedInPack;
  onClose: () => void;
}

export default function LinkedInPackModal({ linkedInPack, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<"post" | "claims" | "image">("post");
  const [copied, setCopied] = useState(false);
  const [editedPost, setEditedPost] = useState(linkedInPack.linkedin_post.post_text);

  const handleCopy = async () => {
    const fullText = `${editedPost}\n\n${linkedInPack.linkedin_post.hashtags.map(tag => `#${tag.replace(/^#/, '')}`).join(' ')}${linkedInPack.linkedin_post.cta ? `\n\n${linkedInPack.linkedin_post.cta}` : ''}`;
    
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyPrompt = async () => {
    const promptText = `Prompt: ${linkedInPack.image_prompt.prompt}\n\nNegative Prompt: ${linkedInPack.image_prompt.negative_prompt}\n\nModel: ${linkedInPack.image_prompt.model_suggestion}`;
    await navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">💼 LinkedIn Launch Pack</h2>
            <p className="text-sm text-gray-500 mt-1">Ready-to-publish content for maximum impact</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("post")}
              className={`px-4 py-3 text-sm font-medium transition border-b-2 ${
                activeTab === "post"
                  ? "border-brand-600 text-brand-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              📝 LinkedIn Post
            </button>
            <button
              onClick={() => setActiveTab("claims")}
              className={`px-4 py-3 text-sm font-medium transition border-b-2 ${
                activeTab === "claims"
                  ? "border-brand-600 text-brand-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              ✅ Claims Check
            </button>
            <button
              onClick={() => setActiveTab("image")}
              className={`px-4 py-3 text-sm font-medium transition border-b-2 ${
                activeTab === "image"
                  ? "border-brand-600 text-brand-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              🎨 Image Prompt
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* LinkedIn Post Tab */}
          {activeTab === "post" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Post Content ({linkedInPack.linkedin_post.word_count} words)
                </label>
                <textarea
                  value={editedPost}
                  onChange={(e) => setEditedPost(e.target.value)}
                  className="w-full h-64 border rounded-lg p-3 text-sm font-sans resize-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  placeholder="Your LinkedIn post..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hashtags ({linkedInPack.linkedin_post.hashtags.length})
                </label>
                <div className="flex flex-wrap gap-2">
                  {linkedInPack.linkedin_post.hashtags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                    >
                      #{tag.replace(/^#/, '')}
                    </span>
                  ))}
                </div>
              </div>

              {linkedInPack.linkedin_post.cta && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Call-to-Action
                  </label>
                  <div className="bg-gradient-to-r from-brand-50 to-purple-50 border border-brand-200 rounded-lg p-3">
                    <p className="text-sm text-gray-800 font-medium">
                      {linkedInPack.linkedin_post.cta}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCopy}
                  className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-medium py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
                >
                  {copied ? "✓ Copied!" : "📋 Copy Full Post"}
                </button>
              </div>
            </div>
          )}

          {/* Claims Check Tab */}
          {activeTab === "claims" && (
            <div className="space-y-6">
              {/* Assessment Badge */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Overall Assessment:</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    linkedInPack.claims_check.overall_assessment === "LOW_RISK"
                      ? "bg-green-100 text-green-700"
                      : linkedInPack.claims_check.overall_assessment === "MEDIUM_RISK"
                      ? "bg-amber-100 text-amber-700"
                      : linkedInPack.claims_check.overall_assessment === "HIGH_RISK"
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {linkedInPack.claims_check.overall_assessment.replace(/_/g, " ")}
                </span>
              </div>

              {/* Safe Claims */}
              {linkedInPack.claims_check.safe_claims.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-2">
                    <span className="text-lg">✅</span> Safe Claims ({linkedInPack.claims_check.safe_claims.length})
                  </h3>
                  <ul className="space-y-2">
                    {linkedInPack.claims_check.safe_claims.map((claim, i) => (
                      <li key={i} className="bg-green-50 border-l-4 border-green-500 p-3 rounded text-sm text-gray-700">
                        {claim}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Risky Claims */}
              {linkedInPack.claims_check.risky_claims.length > 0 ? (
                <div>
                  <h3 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                    <span className="text-lg">⚠️</span> Risky Claims ({linkedInPack.claims_check.risky_claims.length})
                  </h3>
                  <div className="space-y-3">
                    {linkedInPack.claims_check.risky_claims.map((risky, i) => (
                      <div
                        key={i}
                        className="bg-red-50 border-l-4 border-red-500 p-4 rounded space-y-2"
                      >
                        <div>
                          <span className="text-xs font-semibold text-red-600 uppercase">
                            {risky.risk_type}
                          </span>
                          <p className="text-sm text-gray-800 font-medium mt-1">{risky.claim}</p>
                        </div>
                        <div className="bg-white rounded p-2 border border-red-200">
                          <span className="text-xs font-semibold text-gray-600">Safer Alternative:</span>
                          <p className="text-sm text-gray-700 mt-1">{risky.suggestion}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <p className="text-green-700 font-medium">
                    ✓ No risky claims detected. Content is ready for publishing!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Image Prompt Tab */}
          {activeTab === "image" && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
                <h3 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  <span>🎨</span> Main Prompt
                </h3>
                <p className="text-gray-800 leading-relaxed">
                  {linkedInPack.image_prompt.prompt}
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-xs font-semibold text-gray-600 uppercase mb-2">
                  Negative Prompt
                </h3>
                <p className="text-sm text-gray-700">
                  {linkedInPack.image_prompt.negative_prompt}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-xs font-semibold text-gray-600 uppercase mb-1">
                    Model
                  </h3>
                  <p className="text-sm font-medium text-gray-800">
                    {linkedInPack.image_prompt.model_suggestion}
                  </p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-xs font-semibold text-gray-600 uppercase mb-1">
                    Style
                  </h3>
                  <p className="text-sm font-medium text-gray-800">
                    {linkedInPack.image_prompt.style_notes}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>Coming Soon:</strong> Direct Hugging Face integration for instant image generation!
                  For now, copy this prompt to your favorite text-to-image tool.
                </p>
              </div>

              <button
                onClick={handleCopyPrompt}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
              >
                {copied ? "✓ Copied!" : "📋 Copy Prompt"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
