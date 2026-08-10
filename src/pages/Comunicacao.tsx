import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import {
  Bell, Check, ChevronDown, Clock3, FileText, History, MessageSquare,
  Plus, Search, Send, Smartphone, UserRound, Users, X,
} from "lucide-react";

type Recipient = { id: string; name: string; phone?: string; registration: string };
type Template = { id: string; title: string; description: string; text: string; icon: typeof Bell };

const recipients: Recipient[] = [
  { id: "1", name: "Maria da Silva", phone: "(11) 98888-1234", registration: "Matrícula 123456" },
  { id: "2", name: "João Oliveira", phone: "(11) 97777-4567", registration: "Matrícula 234567" },
  { id: "3", name: "Ana Costa", registration: "Matrícula 345678" },
];
const templates: Template[] = [
  { id: "welcome", title: "Boas-vindas", description: "Mensagem de boas-vindas ao novo beneficiário.", text: "Olá, {{primeiro_nome}}! Seja bem-vindo(a) à UniOdonto.", icon: Users },
  { id: "due", title: "Aviso de vencimento", description: "Aviso sobre vencimento de boleto ou mensalidade.", text: "Olá, {{primeiro_nome}}! Identificamos um vencimento próximo para o plano {{plano}}.", icon: Bell },
  { id: "service", title: "Confirmação de atendimento", description: "Confirmação de atendimento ou solicitação registrada.", text: "Olá, {{nome}}! Seu atendimento foi registrado com sucesso. Protocolo: {{protocolo}}.", icon: Check },
  { id: "appointment", title: "Lembrete de consulta", description: "Lembrete de consulta ou procedimento agendado.", text: "Olá, {{primeiro_nome}}! Lembramos sua consulta em {{data}}, às {{hora}}.", icon: Clock3 },
  { id: "followup", title: "Retorno / acompanhamento", description: "Mensagem de retorno ou acompanhamento do beneficiário.", text: "Olá, {{primeiro_nome}}! Estamos entrando em contato para acompanhar seu atendimento.", icon: MessageSquare },
  { id: "free", title: "Mensagem sem template", description: "Criar uma mensagem livre.", text: "", icon: FileText },
];
const variables = ["{{nome}}", "{{primeiro_nome}}", "{{matricula}}", "{{cpf}}", "{{telefone}}", "{{plano}}", "{{data}}", "{{hora}}", "{{protocolo}}", "{{link_boleto}}"];

const initials = (name: string) => name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
const validPhone = (phone: string) => phone.replace(/\D/g, "").length >= 10;
const exampleData: Record<string, string> = { "{{nome}}": "Maria da Silva", "{{primeiro_nome}}": "Maria", "{{matricula}}": "123456", "{{cpf}}": "000.000.000-00", "{{telefone}}": "(11) 98888-1234", "{{plano}}": "UniOdonto Essencial", "{{data}}": "05/08/2026", "{{hora}}": "14:30", "{{protocolo}}": "#20260804", "{{link_boleto}}": "uniodonto.com/boleto" };

function renderMessage(text: string, recipient?: Recipient) {
  return text.replace(/{{[^}]+}}/g, (variable) => variable === "{{nome}}" && recipient ? recipient.name : variable === "{{primeiro_nome}}" && recipient ? recipient.name.split(" ")[0] : exampleData[variable] || variable);
}

export function Comunicacao() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState("Enviar mensagem");
  useEffect(() => {
    const requested = searchParams.get("tab");
    const tabs: Record<string, string> = { enviar: "Enviar mensagem", avisos: "Avisos e lembretes", templates: "Templates", historico: "Histórico de envios" };
    if (requested && tabs[requested]) setTab(tabs[requested]);
  }, [searchParams]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Recipient>();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("welcome");
  const [message, setMessage] = useState(templates[0].text);
  const [phone, setPhone] = useState("");
  const [variableOpen, setVariableOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [scheduled, setScheduled] = useState(false);
  const filtered = useMemo(() => recipients.filter((item) => `${item.name} ${item.phone || ""} ${item.registration}`.toLowerCase().includes(search.toLowerCase())), [search]);
  const activeRecipient = selected;
  const activePhone = phone || selected?.phone || "";
  const chooseTemplate = (template: Template) => { setSelectedTemplate(template.id); setMessage(template.text); };
  const notify = (text: string) => { setToast(text); window.setTimeout(() => setToast(""), 3000); };
  const send = () => { if (!activeRecipient) return notify("Selecione um destinatário."); if (!validPhone(activePhone)) return notify("Informe um telefone válido."); if (!message.trim()) return notify("Digite ou selecione uma mensagem."); notify("Mensagem enviada em modo demonstração."); };

  return <div className="dashboard-content space-y-5">
    {tab === "Enviar mensagem" && <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <section className="glass-card min-w-0 p-5"><SectionTitle number="1" title="Selecionar destinatário" icon={Users} /><div className="relative mt-4"><Search className="absolute left-3 top-3 h-4 w-4 text-text-secondary" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome, CPF, matrícula ou telefone" className="w-full rounded-xl border border-border bg-white py-2.5 pl-9 pr-3 text-xs outline-none focus:border-[#CD176D]" /></div><div className="mt-3 space-y-2">{filtered.map((item) => <button key={item.id} onClick={() => { setSelected(item); setPhone(item.phone || ""); }} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left ${selected?.id === item.id ? "border-[#CD176D] bg-pink-50" : "border-border"}`}><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#CD176D] text-xs font-black text-white">{initials(item.name)}</span><span className="min-w-0 flex-1"><strong className="block truncate text-xs text-text-primary">{item.name}</strong><small className="text-[10px] text-text-secondary">{item.registration}</small></span>{!item.phone && <small className="text-[9px] font-bold text-amber-600">Sem telefone</small>}</button>)}{!filtered.length && <p className="py-5 text-center text-xs text-text-secondary">Nenhum beneficiário encontrado.</p>}</div><button onClick={() => setManualOpen(true)} className="mt-4 flex items-center gap-2 text-xs font-black text-[#CD176D]"><Plus className="h-4 w-4" /> Contato não cadastrado</button><button className="mt-4 block text-xs font-bold text-text-secondary underline">Ver todos os beneficiários</button></section>
      <section className="glass-card min-w-0 p-5"><SectionTitle number="2" title="Escolher template (opcional)" icon={FileText} /><div className="mt-4 space-y-2">{templates.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => chooseTemplate(item)} className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left ${selectedTemplate === item.id ? "border-[#CD176D] bg-pink-50" : "border-border"}`}><Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#CD176D]" /><span><strong className="block text-xs text-text-primary">{item.title}</strong><small className="text-[10px] text-text-secondary">{item.description}</small></span></button>; })}</div><button onClick={() => setTab("Templates")} className="mt-4 text-xs font-bold text-text-secondary underline">Ver todos os templates</button></section>
      <section className="glass-card min-w-0 p-5"><SectionTitle number="3" title="Revisão e envio" icon={Send} /><div className="mt-4 space-y-3"><input value={activeRecipient?.name || ""} readOnly placeholder="Nome do destinatário" className="w-full rounded-xl border border-border bg-gray-50 px-3 py-2.5 text-xs" /><div><label className="mb-1 block text-[10px] font-black uppercase text-text-secondary">Telefone de destino</label><input value={activePhone} onChange={(event) => setPhone(event.target.value.replace(/[^0-9()+ -]/g, ""))} placeholder="(11) 99999-9999" className={`w-full rounded-xl border px-3 py-2.5 text-xs outline-none ${activePhone && !validPhone(activePhone) ? "border-red-400" : "border-border"}`} />{activePhone && !validPhone(activePhone) && <small className="text-[10px] text-red-500">Informe um telefone brasileiro válido.</small>}</div><div className="rounded-2xl bg-[#eaf8ee] p-3"><div className="mb-2 flex items-center gap-2 text-[10px] font-bold text-green-700"><Smartphone className="h-4 w-4" /> Pré-visualização</div><div className="ml-auto max-w-[90%] rounded-xl rounded-tr-sm bg-white p-3 text-xs text-text-primary shadow-sm">{renderMessage(message, activeRecipient) || "Sua mensagem aparecerá aqui."}<span className="mt-2 block text-right text-[9px] text-text-secondary">{new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span></div></div><textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={5} placeholder="Digite sua mensagem..." className="w-full resize-none rounded-xl border border-border px-3 py-2.5 text-xs outline-none focus:border-[#CD176D]" /><div className="flex items-center justify-between"><span className="text-[10px] text-text-secondary">{message.length}/1000 caracteres</span><div className="relative"><button onClick={() => setVariableOpen(!variableOpen)} className="flex items-center gap-1 text-[10px] font-black text-[#CD176D]">Inserir variável <ChevronDown className="h-3 w-3" /></button>{variableOpen && <div className="absolute bottom-6 right-0 z-10 grid w-48 gap-1 rounded-xl border border-border bg-white p-2 shadow-xl">{variables.map((item) => <button key={item} onClick={() => { setMessage((current) => `${current}${item}`); setVariableOpen(false); }} className="rounded p-1 text-left text-[10px] hover:bg-pink-50">{item}</button>)}</div>}</div></div><div className="flex gap-2"><button onClick={() => { setScheduled(true); notify("Aviso agendado em modo demonstração."); }} className="flex-1 rounded-xl border border-[#CD176D] px-3 py-2.5 text-xs font-black text-[#CD176D]">Agendar</button><button onClick={send} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#CD176D] px-3 py-2.5 text-xs font-black text-white"><Send className="h-4 w-4" /> Enviar WhatsApp</button></div>{scheduled && <p className="text-[10px] font-bold text-green-600">Comunicação agendada para demonstração.</p>}</div></section>
    </div>}
    {tab === "Avisos e lembretes" && <DemoList title="Avisos e lembretes" icon={Bell} rows={["Lembrete de consulta — Agendado", "Aviso de vencimento — Enviado", "Acompanhamento — Cancelado"]} action="Criar novo aviso" />}
    {tab === "Templates" && <DemoList title="Templates de comunicação" icon={FileText} rows={templates.map((item) => `${item.title} — Ativo`)} action="Novo template" />}
    {tab === "Histórico de envios" && <DemoList title="Histórico de envios" icon={History} rows={["04/08/2026 10:30 — Maria da Silva — Enviado", "03/08/2026 15:10 — João Oliveira — Entregue", "01/08/2026 09:00 — Ana Costa — Falhou"]} action="Exportar histórico" />}
    {toast && <div className="fixed bottom-5 right-5 z-50 rounded-xl bg-[#24202a] px-4 py-3 text-xs font-bold text-white shadow-xl">{toast}</div>}
    {manualOpen && <ManualContact onClose={() => setManualOpen(false)} onSave={(name, newPhone) => { const contact = { id: "manual", name, phone: newPhone, registration: "Contato manual" }; setSelected(contact); setPhone(newPhone); setManualOpen(false); notify("Contato adicionado para esta comunicação."); }} />}
  </div>;
}

function SectionTitle({ number, title, icon: Icon }: { number: string; title: string; icon: typeof Users }) { return <div className="flex items-center gap-2 border-b border-border pb-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-pink-50 text-[10px] font-black text-[#CD176D]">{number}</span><Icon className="h-4 w-4 text-[#CD176D]" /><h2 className="text-sm font-black text-text-primary">{title}</h2></div>; }
function DemoList({ title, icon: Icon, rows, action }: { title: string; icon: typeof Bell; rows: string[]; action: string }) { return <section className="glass-card p-6"><div className="flex items-center justify-between border-b border-border pb-4"><div className="flex items-center gap-3"><Icon className="h-5 w-5 text-[#CD176D]" /><h2 className="text-base font-black text-text-primary">{title}</h2></div><button className="rounded-xl bg-[#CD176D] px-4 py-2 text-xs font-black text-white"><Plus className="mr-1 inline h-3 w-3" />{action}</button></div><div className="mt-4 divide-y divide-border">{rows.map((row) => <div key={row} className="flex items-center justify-between py-4 text-xs font-bold text-text-primary"><span>{row}</span><button className="text-[#CD176D]">Detalhes</button></div>)}</div><p className="mt-4 text-[10px] text-text-secondary">Dados demonstrativos. A integração real será conectada após definição do serviço de comunicação.</p></section>; }
function ManualContact({ onClose, onSave }: { onClose: () => void; onSave: (name: string, phone: string) => void }) { const [name, setName] = useState(""); const [phone, setPhone] = useState(""); const valid = name.trim() && validPhone(phone); return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"><div className="flex items-center justify-between"><h2 className="font-black text-text-primary">Contato não cadastrado</h2><button onClick={onClose}><X className="h-5 w-5" /></button></div><div className="mt-5 space-y-3"><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome completo" className="w-full rounded-xl border border-border px-3 py-2.5 text-xs" /><input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Telefone com DDD" className="w-full rounded-xl border border-border px-3 py-2.5 text-xs" /><textarea placeholder="Observação opcional" rows={3} className="w-full rounded-xl border border-border px-3 py-2.5 text-xs" /></div><div className="mt-5 flex justify-end gap-2"><button onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-xs font-black">Cancelar</button><button disabled={!valid} onClick={() => onSave(name.trim(), phone)} className="rounded-xl bg-[#CD176D] px-4 py-2 text-xs font-black text-white disabled:opacity-40">Adicionar contato</button></div></div></div>; }
