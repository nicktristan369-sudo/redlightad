"use client"
import { useState } from "react"
import { X, Bot, Edit2 } from "lucide-react"

interface PersonaConfig {
  persona_name?: string; persona_age?: string; persona_gender?: string; persona_location?: string
  persona_nationality?: string; persona_height?: string; persona_personality?: string; persona_description?: string
  persona_availability?: string; persona_address?: string
  ai_enabled?: boolean; ai_style?: string; ai_language?: string; dashboard_language?: string
  ai_response_delay_min?: string; ai_response_delay_max?: string
  telegram_enabled?: boolean; telegram_bot_token?: string; telegram_channel?: string
  snapchat?: string; onlyfans?: string; instagram?: string
  rates?: { service: string; incall: string; outcall: string }[]
  services?: string[]; custom_services?: string[]
  custom_qa?: { q: string; a: string }[]
  ai_rules?: string[]
  avatar_url?: string
}

interface Props {
  accountId: string; accountName: string; phoneNumber: string | null; avatarUrl?: string | null
  config: PersonaConfig; onClose: () => void; onSave: (config: PersonaConfig) => Promise<void>
}

const STANDARD_SERVICES = ["Blowjob","69","Cum in mouth","Cum in face","Anal","Kiss","GFE","Erotic massage","Oil massage","Escort service","Lesbian","Domina","Goldenshower","Handjob","All positions","Bondage","Strap on","Video call","Roleplay","Facesitting","Couples"]

export default function PhoneSettingsModal({ accountId, accountName, phoneNumber, avatarUrl, config, onClose, onSave }: Props) {
  const [form, setForm] = useState({
    persona_name: config.persona_name || "", persona_age: config.persona_age || "",
    persona_gender: config.persona_gender || "female", persona_location: config.persona_location || "",
    persona_nationality: config.persona_nationality || "", persona_height: config.persona_height || "",
    persona_personality: config.persona_personality || "", persona_description: config.persona_description || "",
    persona_availability: config.persona_availability || "", persona_address: config.persona_address || "",
    ai_enabled: config.ai_enabled ?? false, ai_style: config.ai_style || "flirty",
    ai_language: config.ai_language || "da", dashboard_language: config.dashboard_language || "none",
    ai_response_delay_min: config.ai_response_delay_min || "30", ai_response_delay_max: config.ai_response_delay_max || "90",
    telegram_enabled: config.telegram_enabled || false, telegram_bot_token: config.telegram_bot_token || "",
    telegram_channel: config.telegram_channel || "", snapchat: config.snapchat || "",
    onlyfans: config.onlyfans || "", instagram: config.instagram || "",
  })
  const [rates, setRates] = useState(config.rates?.length ? config.rates : [
    { service: "0.5 time", incall: "", outcall: "" }, { service: "1 time", incall: "", outcall: "" },
    { service: "2 timer", incall: "", outcall: "" }, { service: "3 timer", incall: "", outcall: "" },
    { service: "Hel nat", incall: "", outcall: "" },
  ])
  const [selectedServices, setSelectedServices] = useState<string[]>(config.services || [])
  const [customServices, setCustomServices] = useState<string[]>(config.custom_services || [])
  const [newService, setNewService] = useState("")
  const [customQA, setCustomQA] = useState<{q:string;a:string}[]>(config.custom_qa || [])
  const [aiRules, setAiRules] = useState<string[]>(config.ai_rules || [])
  const [newRule, setNewRule] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    await onSave({ ...form, rates: rates.filter(r => r.incall || r.outcall || r.service), services: selectedServices, custom_services: customServices, custom_qa: customQA.filter(qa => qa.q && qa.a), ai_rules: aiRules.filter(r => r.trim()) })
    setLoading(false); onClose()
  }

  const inp = "w-full bg-[#1f2c34] border border-[#2a3942] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00a884]"
  const lbl = "block text-xs text-gray-400 mb-1"
  const section = "text-xs text-gray-400 font-medium uppercase tracking-wider mb-3"

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#111b21] border border-[#2a3942] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2a3942] sticky top-0 bg-[#111b21] z-10">
          <h2 className="text-lg font-bold">📱 Phone Settings</h2>
          <button onClick={onClose} className="p-1 hover:bg-[#2a3942] rounded"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-6">
          {/* Avatar + Info */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#1f2c34] rounded-full flex items-center justify-center overflow-hidden shrink-0">
              {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-2xl font-bold text-gray-500">{(accountName || "?")[0]}</span>}
            </div>
            <div>
              <p className="font-semibold">{phoneNumber || accountName}</p>
              <p className="text-[10px] text-gray-500 font-mono">ID: {accountId.slice(0,8)}…</p>
            </div>
          </div>

          {/* ═══ PERSONA ═══ */}
          <div>
            <p className={section}>👤 Persona</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Name</label><input type="text" value={form.persona_name} onChange={e => setForm({...form, persona_name: e.target.value})} className={inp} /></div>
              <div><label className={lbl}>Age</label><input type="number" value={form.persona_age} onChange={e => setForm({...form, persona_age: e.target.value})} className={inp} /></div>
              <div><label className={lbl}>Gender</label><select value={form.persona_gender} onChange={e => setForm({...form, persona_gender: e.target.value})} className={inp}><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option></select></div>
              <div><label className={lbl}>Location</label><input type="text" value={form.persona_location} onChange={e => setForm({...form, persona_location: e.target.value})} placeholder="København" className={inp} /></div>
              <div><label className={lbl}>Nationality</label><input type="text" value={form.persona_nationality} onChange={e => setForm({...form, persona_nationality: e.target.value})} className={inp} /></div>
              <div><label className={lbl}>Height</label><input type="text" value={form.persona_height} onChange={e => setForm({...form, persona_height: e.target.value})} placeholder="170cm" className={inp} /></div>
            </div>
            <div className="mt-3"><label className={lbl}>Personality</label><input type="text" value={form.persona_personality} onChange={e => setForm({...form, persona_personality: e.target.value})} placeholder="Flirty, playful" className={inp} /></div>
            <div className="mt-3"><label className={lbl}>Description</label><textarea value={form.persona_description} onChange={e => setForm({...form, persona_description: e.target.value})} rows={3} placeholder="Beskriv personaen..." className={inp+" resize-none"} /></div>
          </div>

          {/* ═══ AI SETTINGS ═══ */}
          <div>
            <p className={section}>🤖 AI Settings</p>
            <div className="flex items-center justify-between p-3 bg-[#1f2c34] rounded-lg mb-3">
              <div className="flex items-center gap-2"><Bot size={16} className="text-blue-400" /><span className="text-sm">AI Auto-Reply</span></div>
              <button onClick={() => setForm({...form, ai_enabled: !form.ai_enabled})} className={`w-10 h-5 rounded-full transition-colors ${form.ai_enabled ? "bg-[#00a884]" : "bg-gray-600"}`}>
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${form.ai_enabled ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>💬 Besked-sprog</label><select value={form.ai_language} onChange={e => setForm({...form, ai_language: e.target.value})} className={inp}>
                <option value="da">🇩🇰 Dansk</option><option value="en">🇬🇧 English</option><option value="de">🇩🇪 Deutsch</option><option value="sv">🇸🇪 Svenska</option><option value="no">🇳🇴 Norsk</option><option value="nl">🇳🇱 Nederlands</option><option value="fr">🇫🇷 Français</option><option value="es">🇪🇸 Español</option><option value="it">🇮🇹 Italiano</option><option value="pt">🇵🇹 Português</option><option value="pl">🇵🇱 Polski</option><option value="ru">🇷🇺 Русский</option><option value="tr">🇹🇷 Türkçe</option><option value="th">🇹🇭 ไทย</option>
              </select></div>
              <div><label className={lbl}>👁️ Dashboard-sprog</label><select value={form.dashboard_language} onChange={e => setForm({...form, dashboard_language: e.target.value})} className={inp}>
                <option value="none">❌ Ingen oversættelse</option><option value="da">🇩🇰 Dansk</option><option value="en">🇬🇧 English</option><option value="de">🇩🇪 Deutsch</option><option value="sv">🇸🇪 Svenska</option>
              </select></div>
            </div>
          </div>

          {/* ═══ TELEGRAM ═══ */}
          <div>
            <p className={section}>✈️ Telegram Integration</p>
            <div className="flex items-center justify-between p-3 bg-[#1f2c34] rounded-lg mb-3">
              <div className="flex items-center gap-2"><span>✈️</span><span className="text-sm">Telegram Bot aktiv</span></div>
              <button onClick={() => setForm({...form, telegram_enabled: !form.telegram_enabled})} className={`w-10 h-5 rounded-full transition-colors ${form.telegram_enabled ? "bg-blue-500" : "bg-gray-600"}`}>
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${form.telegram_enabled ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
            <div><label className={lbl}>Bot Token</label><input type="text" value={form.telegram_bot_token} onChange={e => setForm({...form, telegram_bot_token: e.target.value})} placeholder="123456789:ABCdef..." className={inp+" font-mono"} /></div>
            {form.telegram_enabled && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div><label className="block text-[10px] text-gray-500 mb-1">📺 Telegram Kanal</label><input type="text" value={form.telegram_channel} onChange={e => setForm({...form, telegram_channel: e.target.value})} placeholder="https://t.me/din_kanal" className={inp} /></div>
                <div><label className="block text-[10px] text-gray-500 mb-1">👻 Snapchat</label><input type="text" value={form.snapchat} onChange={e => setForm({...form, snapchat: e.target.value})} className={inp} /></div>
                <div><label className="block text-[10px] text-gray-500 mb-1">🔥 OnlyFans</label><input type="text" value={form.onlyfans} onChange={e => setForm({...form, onlyfans: e.target.value})} className={inp} /></div>
                <div><label className="block text-[10px] text-gray-500 mb-1">📷 Instagram</label><input type="text" value={form.instagram} onChange={e => setForm({...form, instagram: e.target.value})} className={inp} /></div>
              </div>
            )}
          </div>

          {/* ═══ TIMING ═══ */}
          <div>
            <p className={section}>⏱️ Timing</p>
            <div className="grid grid-cols-3 gap-3">
              <div><label className={lbl}>Style</label><select value={form.ai_style} onChange={e => setForm({...form, ai_style: e.target.value})} className={inp}><option value="flirty">😏 Flirty</option><option value="friendly">😊 Friendly</option><option value="professional">💼 Professional</option><option value="casual">😎 Casual</option></select></div>
              <div><label className={lbl}>Min Delay (s)</label><input type="number" value={form.ai_response_delay_min} onChange={e => setForm({...form, ai_response_delay_min: e.target.value})} className={inp} /></div>
              <div><label className={lbl}>Max Delay (s)</label><input type="number" value={form.ai_response_delay_max} onChange={e => setForm({...form, ai_response_delay_max: e.target.value})} className={inp} /></div>
            </div>
            <p className="text-xs text-[#00a884] mt-2">AI will wait between {form.ai_response_delay_min}-{form.ai_response_delay_max} seconds before replying</p>
          </div>

          {/* ═══ PRISLISTE ═══ */}
          <div>
            <p className={section}>💰 Prisliste</p>
            <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 mb-2 text-[10px] text-gray-500 font-medium"><span>SERVICE</span><span className="text-center">INCALL</span><span className="text-center">OUTCALL</span><span></span></div>
            {rates.map((r, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 mb-1.5">
                <input type="text" value={r.service} onChange={e => { const n=[...rates]; n[i].service=e.target.value; setRates(n) }} className={inp} />
                <input type="text" value={r.incall} onChange={e => { const n=[...rates]; n[i].incall=e.target.value; setRates(n) }} placeholder="Pris / X" className={inp+" text-center"} />
                <input type="text" value={r.outcall} onChange={e => { const n=[...rates]; n[i].outcall=e.target.value; setRates(n) }} placeholder="Pris / X" className={inp+" text-center"} />
                <button onClick={() => setRates(rates.filter((_,j) => j!==i))} className="text-red-400 hover:text-red-300 px-1">×</button>
              </div>
            ))}
            <button onClick={() => setRates([...rates, {service:"",incall:"",outcall:""}])} className="mt-1 w-full py-1.5 border border-dashed border-[#2a3942] rounded text-xs text-gray-400 hover:border-gray-500">+ Add price</button>
          </div>

          {/* ═══ SERVICES ═══ */}
          <div>
            <p className={section}>✨ Services</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {[...STANDARD_SERVICES, ...customServices].map(s => (
                <button key={s} onClick={() => setSelectedServices(selectedServices.includes(s) ? selectedServices.filter(x=>x!==s) : [...selectedServices, s])}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${selectedServices.includes(s) ? "bg-[#00a884] text-white" : "bg-[#1f2c34] text-gray-400 hover:bg-[#2a3942]"}`}>{s}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newService} onChange={e => setNewService(e.target.value)} placeholder="Custom service..." className={inp} onKeyDown={e => { if(e.key==="Enter"&&newService.trim()){setCustomServices([...customServices,newService.trim()]);setSelectedServices([...selectedServices,newService.trim()]);setNewService("")}}} />
              <button onClick={() => {if(newService.trim()){setCustomServices([...customServices,newService.trim()]);setSelectedServices([...selectedServices,newService.trim()]);setNewService("")}}} className="px-3 py-2 bg-[#2a3942] hover:bg-[#3a4a52] rounded-lg text-sm shrink-0">Tilføj</button>
            </div>
          </div>

          {/* ═══ ADRESSE ═══ */}
          <div>
            <p className={section}>📍 Adresse / Lokation</p>
            <input type="text" value={form.persona_address} onChange={e => setForm({...form, persona_address: e.target.value})} placeholder="Vesterbrogade 45, 1620 København V" className={inp} />
            <p className="text-xs text-gray-600 mt-1">AI bruger denne adresse når kunder spørger</p>
          </div>

          {/* ═══ AVAILABILITY ═══ */}
          <div>
            <p className={section}>🕐 Availability</p>
            <input type="text" value={form.persona_availability} onChange={e => setForm({...form, persona_availability: e.target.value})} placeholder="Man-Fre 18-22, Weekend hele dagen" className={inp} />
          </div>

          {/* ═══ Q&A ═══ */}
          <div>
            <p className={section}>❓ Custom Q&A (Auto-svar)</p>
            <div className="space-y-3">
              {customQA.map((qa, i) => (
                <div key={i} className="bg-[#1f2c34] rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2"><span className="text-[10px] text-gray-500">Regel #{i+1}</span><button onClick={() => setCustomQA(customQA.filter((_,j)=>j!==i))} className="text-red-400 text-xs">Slet</button></div>
                  <input type="text" value={qa.q} onChange={e => {const n=[...customQA];n[i].q=e.target.value;setCustomQA(n)}} placeholder="Hvis de spørger om..." className={"mb-2 "+inp} />
                  <textarea value={qa.a} onChange={e => {const n=[...customQA];n[i].a=e.target.value;setCustomQA(n)}} placeholder="Svar med..." rows={2} className={inp+" resize-none"} />
                </div>
              ))}
              <button onClick={() => setCustomQA([...customQA, {q:"",a:""}])} className="w-full py-2 border border-dashed border-[#2a3942] rounded-lg text-sm text-gray-400 hover:border-gray-500">+ Add Q&A rule</button>
            </div>
          </div>

          {/* ═══ AI RULES ═══ */}
          <div>
            <p className={section}>⛔ Rules / AI must never...</p>
            <div className="space-y-2">
              {aiRules.map((r, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="text-red-400">⛔</span>
                  <input type="text" value={r} onChange={e => {const n=[...aiRules];n[i]=e.target.value;setAiRules(n)}} className={"flex-1 "+inp} />
                  <button onClick={() => setAiRules(aiRules.filter((_,j)=>j!==i))} className="text-red-400 hover:text-red-300 px-2">×</button>
                </div>
              ))}
              <div className="flex gap-2">
                <input type="text" value={newRule} onChange={e => setNewRule(e.target.value)} placeholder="Must never give address..." className={"flex-1 "+inp} onKeyDown={e => {if(e.key==="Enter"&&newRule.trim()){setAiRules([...aiRules,newRule.trim()]);setNewRule("")}}} />
                <button onClick={() => {if(newRule.trim()){setAiRules([...aiRules,newRule.trim()]);setNewRule("")}}} className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm">Tilføj</button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#2a3942] flex gap-3 sticky bottom-0 bg-[#111b21]">
          <button onClick={onClose} className="flex-1 py-2.5 border border-[#2a3942] rounded-lg text-sm font-medium hover:bg-[#1f2c34]">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="flex-1 py-2.5 bg-[#00a884] hover:bg-[#00c49a] disabled:bg-gray-700 rounded-lg text-sm font-medium">{loading ? "Saving..." : "Save Changes"}</button>
        </div>
      </div>
    </div>
  )
}
