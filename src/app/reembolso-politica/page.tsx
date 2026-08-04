import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Reembolso - ShopPix",
  description: "Política de reembolso e devolução da ShopPix",
};

export default function ReembolsoPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">Política de Reembolso</h1>
      <p className="mt-2 text-sm text-gray-500">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>

      <div className="prose mt-8 max-w-none space-y-6 text-gray-700">
        <section>
          <h2 className="text-xl font-semibold text-gray-900">1. Direito de Arrependimento</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Conforme o Código de Defesa do Consumidor (Lei nº 8.078/1990, Art. 49), você tem o direito de se arrepender da compra em até <strong>7 dias corridos</strong> contados da confirmação do pagamento.
          </p>
          <p className="mt-2 text-sm leading-relaxed">
            Para exercer este direito, acesse a página do pedido em <a href="/pedidos" className="text-brand-600 hover:underline">Meus Pedidos</a> e solicite o reembolso, informando sua chave PIX para receber a devolução.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">2. Produtos Digitais</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Para produtos digitais, o direito de arrependimento de 7 dias se aplica <strong>apenas se o link de download ainda não tiver sido acessado</strong>. Após o primeiro download, o reembolso não é garantido, pois o produto foi entregue e utilizado.
          </p>
          <p className="mt-2 text-sm leading-relaxed">
            Casos excepcionais serão analisados individualmente pela nossa equipe.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">3. Produtos com Defeito</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Se um produto digital apresentar defeito ou não corresponder à descrição, você tem direito a:
          </p>
          <ul className="mt-2 list-disc pl-6 text-sm space-y-1">
            <li>Reparo ou substituição do arquivo</li>
            <li>Reembolso integral caso o problema não seja resolvido em até 7 dias</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">4. Como Solicitar Reembolso</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Para solicitar um reembolso:
          </p>
          <ol className="mt-2 list-decimal pl-6 text-sm space-y-1">
            <li>Acesse <a href="/pedidos" className="text-brand-600 hover:underline">Meus Pedidos</a></li>
            <li>Encontre o pedido e clique em &ldquo;Solicitar Reembolso&rdquo;</li>
            <li>Informe o motivo e sua chave PIX</li>
            <li>Aguarde a análise da nossa equipe (até 5 dias úteis)</li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">5. Processamento do Reembolso</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Após a aprovação do reembolso:
          </p>
          <ul className="mt-2 list-disc pl-6 text-sm space-y-1">
            <li>O reembolso é processado via <strong>PIX</strong> para a chave informada</li>
            <li>O valor é depositado em até <strong>2 dias úteis</strong></li>
            <li>Você receberá uma confirmação por email</li>
          </ul>
          <p className="mt-2 text-sm leading-relaxed">
            O valor reembolsado será igual ao valor pago, sem descontos.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">6. Reembolsos Não Aceitos</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Não aceitamos solicitações de reembolso nas seguintes situações:
          </p>
          <ul className="mt-2 list-disc pl-6 text-sm space-y-1">
            <li>Produto digital já acessado/baixado (após 7 dias do arrependimento)</li>
            <li>Solicitação fora do prazo de 7 dias (para arrependimento)</li>
            <li>Produto utilizado de forma indevida ou violação de direitos autorais</li>
            <li>Compras feitas por engano após o acesso ao produto</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">7. Estorno via Cartão de Crédito</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Para pagamentos realizados via cartão de crédito (Stripe), o reembolso será processado como estorno na fatura do cartão. O prazo para o estorno aparecer na fatura pode variar de <strong>5 a 30 dias</strong>, dependendo da operadora do cartão.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">8. Cancelamento de Pedido</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Pedidos pendentes (não pagos) podem ser cancelados a qualquer momento sem custos. Após o pagamento, aplica-se a política de reembolso descrita acima.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">9. Contato</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Em caso de dúvidas sobre nossa política de reembolso: <a href="mailto:contato@shoppix.com.br" className="text-brand-600 hover:underline">contato@shoppix.com.br</a>
          </p>
        </section>
      </div>
    </div>
  );
}
