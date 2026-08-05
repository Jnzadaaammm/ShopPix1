import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Envio e Entrega - ShopPix",
  description: "Política de envio e entrega de produtos da ShopPix",
};

export default function EnvioPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-100">Política de Envio e Entrega</h1>
      <p className="mt-2 text-sm text-slate-400">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>

      <div className="prose mt-8 max-w-none space-y-6 text-slate-300">
        <section>
          <h2 className="text-xl font-semibold text-slate-100">1. Produtos Digitais</h2>
          <p className="mt-2 text-sm leading-relaxed">
            A entrega de produtos digitais é <strong>imediata</strong> após a confirmação do pagamento. Você receberá:
          </p>
          <ul className="mt-2 list-disc pl-6 text-sm space-y-1">
            <li>Um email com o link de download temporário</li>
            <li>Acesso à área <a href="/downloads" className="text-brand-600 hover:underline">Meus Downloads</a> em sua conta</li>
          </ul>
          <p className="mt-2 text-sm leading-relaxed">
            O link de download tem validade limitada e número máximo de acessos, conforme especificado em cada produto.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-100">2. Confirmação de Pagamento</h2>
          <p className="mt-2 text-sm leading-relaxed">
            O prazo de entrega começa a contar após a confirmação do pagamento:
          </p>
          <ul className="mt-2 list-disc pl-6 text-sm space-y-1">
            <li><strong>PIX:</strong> confirmação imediata (instantânea)</li>
            <li><strong>Cartão de Crédito (Stripe):</strong> confirmação em até 2 minutos</li>
            <li><strong>Mercado Pago:</strong> conforme processamento do gateway</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-100">3. Problemas com Entrega Digital</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Se você não recebeu o email de entrega ou não consegue acessar o download:
          </p>
          <ul className="mt-2 list-disc pl-6 text-sm space-y-1">
            <li>Verifique sua caixa de spam/lixo eletrônico</li>
            <li>Acesse a página <a href="/downloads" className="text-brand-600 hover:underline">Meus Downloads</a> diretamente</li>
            <li>Entre em contato: <a href="mailto:contato@shoppix.com.br" className="text-brand-600 hover:underline">contato@shoppix.com.br</a></li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-100">4. Reenvio de Link</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Caso o link de download expire, você pode solicitar um novo reenvio pelo email de contato, sujeito a análise e disponibilidade do produto.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-100">5. Compatibilidade</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Os produtos digitais são entregues nos formatos especificados em cada página de produto. Verifique os requisitos de sistema e compatibilidade antes da compra. Não nos responsabilizamos por incompatibilidades de software ou hardware.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-100">6. Contato</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Dúvidas sobre entrega: <a href="mailto:contato@shoppix.com.br" className="text-brand-600 hover:underline">contato@shoppix.com.br</a>
          </p>
        </section>
      </div>
    </div>
  );
}
