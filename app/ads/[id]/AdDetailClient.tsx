"use client";

import PhotoGallery from "@/components/PhotoGallery";
import VoicePlayer from "@/components/VoicePlayer";

interface AdDetailClientProps {
  images: string[];
  totalPhotos: number;
  name: string;
  hasVoiceMessage: boolean;
  isLoggedIn?: boolean;
}

export default function AdDetailClient({
  images,
  totalPhotos,
  name,
  hasVoiceMessage,
  isLoggedIn = false,
}: AdDetailClientProps) {
  return (
    <>
      <PhotoGallery images={images} totalPhotos={totalPhotos} name={name} isLoggedIn={isLoggedIn} />
      {hasVoiceMessage && (
        <div className="mt-6">
          <VoicePlayer />
        </div>
      )}
    </>
  );
}
