import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso - ShopPix",
  description: "Termos e condições de uso da plataforma ShopPix",
};

export default function TermosPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">Termos de Uso</h1>
      <p className="mt-2 text-sm text-gray-500">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>

      <div className="prose mt-8 max-w-none space-y-6 text-gray-700">
        <section>
          <h2 className="text-xl font-semibold text-gray-900">1. Aceitação dos Termos</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Ao acessar e utilizar a plataforma ShopPix (aqui &ldquo;Plataforma&rdquo;), você concorda com estes Termos de Uso e com nossa Política de Privacidade. Caso não concorde com qualquer um dos termos, não utilize a Plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">2. Cadastro e Conta</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Para realizar compras, você deve criar uma conta fornecendo informações verdadeiras, completas e atualizadas. Você é responsável por manter a confidencialidade de sua senha e por todas as atividades realizadas em sua conta.
          </p>
          <p className="mt-2 text-sm leading-relaxed">
            Usuários com menos de 18 anos devem ter autorização dos pais ou responsáveis legais para utilizar a Plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">3. Produtos e Preços</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Os produtos oferecidos podem ser físicos ou digitais. Os preços exibidos estão em Reais (R$) e incluem todos os impostos aplicáveis. Nos reservamos o direito de alterar preços e disponibilidade de produtos a qualquer momento, sem aviso prévio.
          </p>
          <p className="mt-2 text-sm leading-relaxed">
            Para produtos digitais, o acesso é concedido após a confirmação do pagamento, através de link temporário de download enviado por email e disponível em sua conta.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">4. Pagamentos</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Aceitamos as seguintes formas de pagamento:
          </p>
          <ul className="mt-2 list-disc pl-6 text-sm space-y-1">
            <li><strong>PIX</strong> &mdash; pagamento instantâneo via QR Code ou código copia e cola</li>
            <li><strong>Cartão de Crédito</strong> &mdash; processado via Stripe com criptografia de ponta a ponta</li>
            <li><strong>Mercado Pago</strong> &mdash; checkout completo via Mercado Pago</li>
          </ul>
          <p className="mt-2 text-sm leading-relaxed">
            O processamento dos pagamentos é realizado por gateways de pagamento seguros e certificados. Não armazenamos dados de cartão de crédito em nossos servidores.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">5. Produtos Digitais</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Ao adquirir um produto digital, você recebe um link de download temporário com número limitado de acessos. O link expira após o período estabelecido ou após o número máximo de downloads.
          </p>
          <p className="mt-2 text-sm leading-relaxed">
            É proibido compartilhar, revender, distribuir ou utilizar os produtos digitais para fins comerciais sem autorização expressa. O descumprimento pode resultar em revogação do acesso e medidas legais.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">6. Responsabilidades do Usuário</h2>
          <p className="mt-2 text-sm leading-relaxed">Você concorda em:</p>
          <ul className="mt-2 list-disc pl-6 text-sm space-y-1">
            <li>Utilizar a Plataforma apenas para fins legais</li>
            <li>Não tentar acessar áreas restritas sem autorização</li>
            <li>Não utilizar sistemas automatizados para coletar dados da Plataforma</li>
            <li>Fornecer informações verdadeiras em seu cadastro</li>
            <li>Respeitar os direitos de propriedade intelectual dos produtos</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">7. Limitação de Responsabilidade</h2>
          <p className="mt-2 text-sm leading-relaxed">
            A ShopPix não se responsabiliza por danos indiretos, incidentais ou consequenciais decorrentes do uso da Plataforma. A responsabilidade da empresa está limitada ao valor da compra realizada.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">8. Modificações</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Podemos modificar estes Termos de Uso a qualquer momento. As alterações entram em vigor imediatamente após sua publicação na Plataforma. Recomendamos que você revise periodicamente esta página.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">9. Lei Aplicável</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Estes Termos são regidos pelas leis da República Federativa do Brasil. Qualquer disputa será resolvida no foro da comarca do usuário, salvo disposição legal em contrário.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">10. Contato</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Em caso de dúvidas sobre estes Termos de Uso, entre em contato pelo email: <a href="mailto:contato@shoppix.com.br" className="text-brand-600 hover:underline">contato@shoppix.com.br</a>
          </p>
        </section>
      </div>
    </div>
  );
}
