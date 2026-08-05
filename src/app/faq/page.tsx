import { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ - Perguntas Frequentes - ShopPix",
  description: "Perguntas frequentes sobre a ShopPix",
};

const faqs = [
  {
    q: "Como faço uma compra?",
    a: "Selecione o produto desejado, adicione ao carrinho, vá para o checkout e pague com cartão via Stripe. Após o pagamento, você recebe o produto por email e na área Meus Downloads.",
  },
  {
    q: "Quanto tempo leva para receber meu produto digital?",
    a: "A entrega é imediata após a confirmação do pagamento. Para cartão de crédito/débito via Stripe, em até 2 minutos. Você recebe um email com o link e também pode acessar pela página Meus Downloads.",
  },
  {
    q: "Quantas vezes posso baixar meu produto?",
    a: "Cada produto tem um número máximo de downloads (geralmente 5) e um prazo de validade do link. Após esgotar, você pode solicitar reenvio pelo nosso email de contato.",
  },
  {
    q: "Posso pedir reembolso?",
    a: "Sim. Você tem 7 dias para se arrepender da compra (CDC Art. 49). Para produtos digitais, o reembolso é garantido se o link de download ainda não foi acessado. Acesse Meus Pedidos e solicite o reembolso.",
  },
  {
    q: "Como recebo o reembolso?",
    a: "Para pagamentos com cartão, o estorno é feito na fatura do cartão (5 a 30 dias)."
  },
  {
    q: "Quais formas de pagamento são aceitas?",
    a: "Aceitamos cartão de crédito/débito via Stripe."
  },
  {
    q: "É seguro comprar na ShopPix?",
    a: "Sim. Os pagamentos são processados por gateway certificado (Stripe) com criptografia de ponta a ponta. Não armazenamos dados de cartão em nossos servidores.",
  },
  {
    q: "Esqueci minha senha, como recupero?",
    a: "Fazemos login via Google (OAuth), então não há senha para esquecer. Basta clicar em Entrar e autenticar com sua conta Google.",
  },
  {
    q: "Posso compartilhar os produtos digitais?",
    a: "Não. Os produtos são licenciados para uso pessoal. É proibido compartilhar, revender ou distribuir. O descumprimento pode resultar em revogação do acesso.",
  },
  {
    q: "Como entro em contato?",
    a: "Pelo email: contato@shoppix.com.br. Respondemos em até 24 horas em dias úteis.",
  },
];

export default function FAQPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-100">Perguntas Frequentes</h1>
      <p className="mt-2 text-sm text-slate-400">Tire suas dúvidas sobre a ShopPix</p>

      <div className="mt-8 space-y-4">
        {faqs.map((faq, i) => (
          <details key={i} className="group rounded-xl border bg-slate-950 p-5 shadow-sm">
            <summary className="flex cursor-pointer items-center justify-between font-semibold text-slate-100">
              {faq.q}
              <span className="ml-4 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-slate-400 transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">{faq.a}</p>
          </details>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
        <p className="text-slate-300">Ainda tem dúvidas?</p>
        <a
          href="mailto:contato@shoppix.com.br"
          className="btn-primary mt-4"
        >
          Entre em contato
        </a>
      </div>
    </div>
  );
}
