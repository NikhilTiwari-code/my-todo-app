// 📍 PASTE YOUR UPLOAD PAGE CODE HERE
// Upload page for creating new reels

"use client";

import { useRouter } from "next/navigation";
import { ReelUpload } from "@/components/reels/ReelUpload";
import toast, { Toaster } from "react-hot-toast";

export default function ReelUploadPage() {
  const router = useRouter();

  const handleUpload = async (data: {
    videoUrl: string;
    thumbnailUrl: string;
    caption: string;
    duration: number;
    cloudinaryPublicId: string;
  }) => {
    try {
      const response = await fetch("/api/reels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create reel");
      }

      const result = await response.json();

      toast.success("Reel uploaded successfully!");

      // Redirect to the reels feed after a short delay
      setTimeout(() => {
        router.push("/reels");
      }, 1000);

    } catch (error) {
      console.error("Error creating reel:", error);
      toast.error("Failed to post your reel. Please try again.");
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <>
      <Toaster position="top-center" />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <ReelUpload onUpload={handleUpload} onCancel={handleCancel} />
        </div>
      </div>
    </>
  );
}
