"use client";

import PhotoGallery from "@/components/PhotoGallery";
import VoicePlayer from "@/components/VoicePlayer";

interface AdDetailClientProps {
  images: string[];
  totalPhotos: number;
  name: string;
  hasVoiceMessage: boolean;
}

export default function AdDetailClient({
  images,
  totalPhotos,
  name,
  hasVoiceMessage,
}: AdDetailClientProps) {
  return (
    <>
      <PhotoGallery images={images} totalPhotos={totalPhotos} name={name} />
      {hasVoiceMessage && (
        <div className="mt-6">
          <VoicePlayer />
        </div>
      )}
    </>
  );
}
