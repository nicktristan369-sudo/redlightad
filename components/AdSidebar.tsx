interface AdSidebarProps {
  age: number;
  gender: string;
  category: string;
  city: string;
  country: string;
  languages: string[];
  rates: { duration: string; price: string }[];
}

export default function AdSidebar({
  age,
  gender,
  category,
  city,
  country,
  languages,
  rates,
}: AdSidebarProps) {
  const infoRows = [
    { icon: "🎂", label: "Age", value: String(age) },
    { icon: "♀️", label: "Gender", value: gender },
    { icon: "📁", label: "Category", value: category },
    { icon: "📍", label: "Location", value: `${city}, ${country}` },
    { icon: "🗣️", label: "Languages", value: languages.join(", ") },
  ];

  return (
    <div className="rounded-xl bg-white p-6 shadow-md">
      {/* Profile Info */}
      <h3 className="mb-4 text-lg font-bold text-gray-900">Profile Info</h3>
      <div className="space-y-3">
        {infoRows.map((row) => (
          <div key={row.label} className="flex items-center gap-3">
            <span className="text-lg">{row.icon}</span>
            <span className="text-sm text-gray-500">{row.label}</span>
            <span className="ml-auto text-sm font-medium text-gray-900">{row.value}</span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="my-5 h-px bg-gray-200" />

      {/* Rates */}
      <h3 className="mb-4 text-lg font-bold text-gray-900">Rates</h3>
      <div className="overflow-hidden rounded-lg">
        {rates.map((rate, i) => (
          <div
            key={rate.duration}
            className={`flex items-center justify-between px-3 py-2.5 ${
              i % 2 === 0 ? "bg-gray-50" : "bg-white"
            }`}
          >
            <span className="text-sm text-gray-700">{rate.duration}</span>
            <span className="text-sm font-bold text-red-600">{rate.price}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
