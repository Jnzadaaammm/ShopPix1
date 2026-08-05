"use client";

import { useState, useMemo } from "react";
import { Search, HelpCircle, CreditCard, Package, Headphones, User, Shield, Mail } from "lucide-react";

const categories = [
  { key: "all", label: "Todas", icon: HelpCircle },
  { key: "compras", label: "Compras e Pagamentos", icon: CreditCard },
  { key: "entrega", label: "Entrega e Produtos", icon: Package },
  { key: "suporte", label: "Suporte e Garantia", icon: Headphones },
  { key: "conta", label: "Conta e Privacidade", icon: User },
];

const faqs = [
  { q: "Quais métodos de pagamento são aceitos?", a: "Aceitamos cartão de crédito/débito via Stripe, PayPal e PIX manual.", category: "compras" },
  { q: "É seguro comprar na ShopPix?", a: "Sim. Os pagamentos são processados por gateways certificados com criptografia de ponta a ponta. Não armazenamos dados de cartão.", category: "compras" },
  { q: "Posso parcelar minha compra?", a: "Cartão via Stripe permite parcelamento conforme a bandeira e o estabelecimento.", category: "compras" },
  { q: "Quanto tempo leva para receber meu produto digital?", a: "A entrega é imediata após a confirmação do pagamento. Para cartão, em até 2 minutos.", category: "entrega" },
  { q: "Onde encontro meu produto digital?", a: "Após a compra, acesse Meus Downloads ou o email de confirmação.", category: "entrega" },
  { q: "Os produtos são originais?", a: "Sim. Todos os produtos são licenças digitais legítimas e entregues conforme a descrição.", category: "entrega" },
  { q: "Posso usar o produto em mais de um dispositivo?", a: "Depende do produto. As especificações estão na descrição de cada item.", category: "entrega" },
  { q: "Qual é a política de reembolso?", a: "Você tem 7 dias para se arrepender (CDC Art. 49). Para produtos digitais, o reembolso é garantido se o link não foi acessado.", category: "suporte" },
  { q: "Como entro em contato com o suporte?", a: "Pelo email contato@shoppix.com.br ou abrindo um ticket na área Suporte.", category: "suporte" },
  { q: "Quanto tempo leva para responder?", a: "Respondemos em até 24 horas em dias úteis.", category: "suporte" },
  { q: "Vocês oferecem suporte técnico?", a: "Sim. Oferecemos suporte para ativação e dúvidas sobre os produtos.", category: "suporte" },
  { q: "Preciso criar uma conta para comprar?", a: "Sim. É necessário fazer login para acessar produtos, pedidos e downloads.", category: "conta" },
  { q: "Meus dados estão seguros?", a: "Sim. Utilizamos criptografia e não vendemos ou compartilhamos seus dados.", category: "conta" },
  { q: "Posso mudar meu email?", a: "Entre em contato pelo suporte para atualizar seus dados.", category: "conta" },
];

export default function FAQPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [open, setOpen] = useState<Record<number, boolean>>({});

  const filtered = useMemo(() => {
    return faqs
      .filter((f) => activeCategory === "all" || f.category === activeCategory)
      .filter((f) => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase()));
  }, [search, activeCategory]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof faqs> = {};
    for (const f of filtered) {
      if (!groups[f.category]) groups[f.category] = [];
      groups[f.category].push(f);
    }
    return groups;
  }, [filtered]);

  const toggle = (idx: number) => setOpen((prev) => ({ ...prev, [idx]: !prev[idx] }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white">Central de Ajuda</h1>
        <p className="mt-2 text-slate-400">Encontre respostas para as principais dúvidas sobre nossa loja</p>
      </div>

      <div className="mt-8 relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar perguntas..."
          className="w-full rounded-2xl border border-slate-800 bg-slate-900 py-4 pl-12 pr-4 text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const active = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                active
                  ? "border-brand-500 bg-brand-600/10 text-brand-400"
                  : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-slate-200"
              }`}
            >
              <Icon className="h-4 w-4" /> {cat.label}
            </button>
          );
        })}
      </div>

      <div className="mt-10 space-y-8">
        {activeCategory === "all"
          ? categories
              .filter((c) => c.key !== "all")
              .map((cat) =>
                grouped[cat.key]?.length > 0 ? (
                  <section key={cat.key}>
                    <h2 className="mb-4 text-lg font-semibold text-slate-100">{cat.label}</h2>
                    <div className="space-y-3">
                      {grouped[cat.key].map((faq, i) => {
                        const globalIdx = faqs.indexOf(faq);
                        const isOpen = open[globalIdx];
                        return (
                          <div
                            key={globalIdx}
                            className="rounded-xl border border-slate-800 bg-slate-900 p-5 transition-all hover:border-slate-700"
                          >
                            <button
                              onClick={() => toggle(globalIdx)}
                              className="flex w-full items-center justify-between text-left font-medium text-slate-100"
                            >
                              {faq.q}
                              <span
                                className={`ml-4 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-950 text-slate-400 transition-transform ${
                                  isOpen ? "rotate-45" : ""
                                }`}
                              >
                                +
                              </span>
                            </button>
                            {isOpen && <p className="mt-3 text-sm text-slate-400">{faq.a}</p>}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ) : null
              )
          : (
              <div className="space-y-3">
                {filtered.map((faq) => {
                  const globalIdx = faqs.indexOf(faq);
                  const isOpen = open[globalIdx];
                  return (
                    <div
                      key={globalIdx}
                      className="rounded-xl border border-slate-800 bg-slate-900 p-5 transition-all hover:border-slate-700"
                    >
                      <button
                        onClick={() => toggle(globalIdx)}
                        className="flex w-full items-center justify-between text-left font-medium text-slate-100"
                      >
                        {faq.q}
                        <span
                          className={`ml-4 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-950 text-slate-400 transition-transform ${
                            isOpen ? "rotate-45" : ""
                          }`}
                        >
                          +
                        </span>
                      </button>
                      {isOpen && <p className="mt-3 text-sm text-slate-400">{faq.a}</p>}
                    </div>
                  );
                })}
              </div>
            )}
      </div>

      {filtered.length === 0 && (
        <p className="mt-8 text-center text-slate-400">Nenhuma pergunta encontrada.</p>
      )}

      <div className="mt-12 flex flex-col items-center rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-600/10 text-brand-400">
          <Mail className="h-6 w-6" />
        </div>
        <p className="mt-4 text-lg font-semibold text-slate-100">Ainda tem dúvidas?</p>
        <p className="mt-1 text-sm text-slate-400">Nossa equipe está pronta para ajudar.</p>
        <a href="mailto:contato@shoppix.com.br" className="btn-primary mt-4">
          Entre em contato
        </a>
      </div>
    </div>
  );
}
