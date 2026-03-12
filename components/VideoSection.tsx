import Image from "next/image";

export default function VideoSection() {
  return (
    <div className="relative overflow-hidden rounded-xl shadow-md">
      {/* Blurred background image */}
      <div className="relative aspect-video">
        <Image
          src="https://picsum.photos/800/600?random=40"
          alt="Video preview"
          fill
          className="object-cover blur-xl scale-110"
          unoptimized
        />
        {/* Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
          {/* Lock icon */}
          <svg
            className="mb-3 h-12 w-12 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <p className="mb-4 text-sm font-medium text-white">
            Video available for registered users
          </p>
          <button className="rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-700">
            Create Free Account
          </button>
        </div>
      </div>
    </div>
  );
}
