import Image from "next/image";
import Link from "next/link";

interface AdCardProps {
  id: number;
  title: string;
  image: string;
  verified: boolean;
  description: string;
  hasVoice: boolean;
  age: number;
  gender: string;
  category: string;
  country?: string;
  city?: string;
  location?: string;
  language: string;
}

export default function AdCard({
  id,
  title,
  image,
  verified,
  description,
  hasVoice,
  age,
  gender,
  category,
  country,
  city,
  location,
  language,
}: AdCardProps) {
  const locationDisplay = city && country
    ? `${city}, ${country}`
    : city || country || location || "";

  const tags = [
    `${age} yrs`,
    gender,
    category,
    locationDisplay,
    language,
  ].filter(Boolean);

  return (
    <Link href={`/ads/${id}`} className="block">
    <div className="flex gap-4 rounded-xl bg-white p-4 shadow-md transition-shadow hover:shadow-lg">
      <div className="relative h-[200px] w-[200px] flex-shrink-0 overflow-hidden rounded-lg">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
          unoptimized
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h3 className="truncate text-lg font-bold text-gray-900">{title}</h3>
            {verified && (
              <span className="whitespace-nowrap text-sm font-medium text-green-600">
                ✓ Verified
              </span>
            )}
          </div>
          <p className="mb-2 line-clamp-2 text-sm text-gray-600">{description}</p>
          {hasVoice && (
            <p className="text-xs text-gray-500">🎙️ Voice message available</p>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
    </Link>
  );
}
