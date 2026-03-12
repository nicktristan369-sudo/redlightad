interface ContactSectionProps {
  contact: {
    phone: string;
    whatsapp: string;
    telegram: string;
    email: string;
  };
}

export default function ContactSection({ contact }: ContactSectionProps) {
  const buttons = [
    { icon: "📞", label: "Phone", value: contact.phone, bg: "bg-gray-900" },
    { icon: "💬", label: "WhatsApp", value: contact.whatsapp, bg: "bg-[#25D366]" },
    { icon: "✈️", label: "Telegram", value: contact.telegram, bg: "bg-[#0088cc]" },
    { icon: "📧", label: "Email", value: contact.email, bg: "bg-red-600" },
  ];

  return (
    <div className="mt-6">
      <h3 className="mb-4 text-lg font-bold text-gray-900">Contact</h3>
      <div className="flex flex-col gap-3">
        {buttons.map((btn) => (
          <button
            key={btn.label}
            className={`${btn.bg} flex items-center gap-3 rounded-xl px-4 py-3 text-white transition-opacity hover:opacity-90`}
          >
            <span className="text-lg">{btn.icon}</span>
            <span className="text-sm font-medium">{btn.value}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
