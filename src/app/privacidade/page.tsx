import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade - ShopPix",
  description: "Política de privacidade e proteção de dados da ShopPix",
};

export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-100">Política de Privacidade</h1>
      <p className="mt-2 text-sm text-slate-400">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>

      <div className="prose mt-8 max-w-none space-y-6 text-slate-300">
        <section>
          <h2 className="text-xl font-semibold text-slate-100">1. Introdução</h2>
          <p className="mt-2 text-sm leading-relaxed">
            A ShopPix leva sua privacidade a sério. Esta Política de Privacidade descreve como coletamos, usamos, compartilhamos e protegemos seus dados pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD &mdash; Lei nº 13.709/2018).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-100">2. Dados Coletados</h2>
          <p className="mt-2 text-sm leading-relaxed">Coletamos os seguintes dados:</p>
          <ul className="mt-2 list-disc pl-6 text-sm space-y-1">
            <li><strong>Dados de cadastro:</strong> nome, email, imagem de perfil (ao autenticar via Google)</li>
            <li><strong>Dados de pedido:</strong> produtos comprados, valor, método de pagamento, status</li>
            <li><strong>Dados de pagamento:</strong> processados diretamente pelos gateways (Stripe, Mercado Pago) &mdash; não armazenamos dados de cartão</li>
            <li><strong>Dados de reembolso:</strong> chave PIX informada para processamento de reembolso</li>
            <li><strong>Dados de navegação:</strong> endereço IP, tipo de navegador, páginas visitadas (via cookies)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-100">3. Finalidade do Tratamento</h2>
          <p className="mt-2 text-sm leading-relaxed">Seus dados são utilizados para:</p>
          <ul className="mt-2 list-disc pl-6 text-sm space-y-1">
            <li>Processar e gerenciar seus pedidos</li>
            <li>Entregar produtos digitais via email e link de download</li>
            <li>Processar pagamentos e reembolsos</li>
            <li>Comunicar atualizações sobre seus pedidos</li>
            <li>Garantir a segurança da Plataforma</li>
            <li>Cumprir obrigações legais e fiscais</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-100">4. Base Legal</h2>
          <p className="mt-2 text-sm leading-relaxed">
            O tratamento dos seus dados pessoais é realizado com base nas seguintes hipóteses legais previstas na LGPD:
          </p>
          <ul className="mt-2 list-disc pl-6 text-sm space-y-1">
            <li><strong>Consentimento</strong> &mdash; ao criar conta e utilizar a Plataforma</li>
            <li><strong>Execução de contrato</strong> &mdash; para processar suas compras e entregas</li>
            <li><strong>Obrigação legal</strong> &mdash; para cumprimento de exigências fiscais e regulatórias</li>
            <li><strong>Legítimo interesse</strong> &mdash; para segurança e melhoria da Plataforma</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-100">5. Compartilhamento de Dados</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Seus dados podem ser compartilhados com:
          </p>
          <ul className="mt-2 list-disc pl-6 text-sm space-y-1">
            <li><strong>Gateways de pagamento</strong> (Stripe, Mercado Pago) &mdash; exclusivamente para processar pagamentos</li>
            <li><strong>Provedores de email</strong> &mdash; para envio de emails de entrega e notificações</li>
            <li><strong>Autoridades competentes</strong> &mdash; quando exigido por lei ou ordem judicial</li>
          </ul>
          <p className="mt-2 text-sm leading-relaxed">
            Não vendemos seus dados pessoais a terceiros.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-100">6. Cookies</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Utilizamos cookies para manter sua sessão ativa, lembrar preferências e analisar o tráfego da Plataforma. Você pode gerenciar cookies nas configurações do seu navegador.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-100">7. Segurança</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo criptografia, controle de acesso e monitoramento. Apesar dos esforços, nenhum sistema é 100% seguro, e não garantimos segurança absoluta.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-100">8. Seus Direitos (LGPD)</h2>
          <p className="mt-2 text-sm leading-relaxed">Como titular dos dados, você tem direito a:</p>
          <ul className="mt-2 list-disc pl-6 text-sm space-y-1">
            <li>Confirmar a existência de tratamento dos seus dados</li>
            <li>Acessar seus dados</li>
            <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
            <li>Anonimizar, bloquear ou eliminar dados desnecessários</li>
            <li>Portabilidade dos dados a outro fornecedor</li>
            <li>Revogar o consentimento a qualquer momento</li>
            <li>Obter informação sobre o compartilhamento de dados</li>
          </ul>
          <p className="mt-2 text-sm leading-relaxed">
            Para exercer seus direitos, entre em contato pelo email: <a href="mailto:contato@shoppix.com.br" className="text-brand-400 hover:underline">contato@shoppix.com.br</a>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-100">9. Retenção de Dados</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Mantemos seus dados pelo tempo necessário para cumprir as finalidades descritas, ou conforme exigido por obrigações legais. Após esse período, os dados são anonimizados ou excluídos.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-100">10. Alterações</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Esta política pode ser atualizada a qualquer momento. Recomendamos revisar periodicamente esta página para se manter informado.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-100">11. Contato com o Encarregado (DPO)</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Para questões relacionadas à privacidade e proteção de dados: <a href="mailto:contato@shoppix.com.br" className="text-brand-400 hover:underline">contato@shoppix.com.br</a>
          </p>
        </section>
      </div>
    </div>
  );
}
