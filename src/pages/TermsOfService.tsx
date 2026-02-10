import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-gray-200">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao início
        </Link>

        <h1 className="text-4xl font-bold text-white mb-2">
          Termos de Serviço
        </h1>
        <p className="text-gray-400 mb-10">
          Última atualização: 10 de fevereiro de 2026
        </p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              1. Aceitação dos Termos
            </h2>
            <p>
              Ao acessar ou utilizar a plataforma <strong>SynapseWhats</strong>{" "}
              ("Serviço"), operada pela <strong>Synapse Automações</strong>{" "}
              ("nós"), você concorda com estes Termos de Serviço. Se não
              concordar, não utilize o Serviço.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              2. Descrição do Serviço
            </h2>
            <p>O SynapseWhats é uma plataforma SaaS que oferece:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Automação de vendas e atendimento via WhatsApp com IA.</li>
              <li>
                Agentes inteligentes de qualificação e classificação de leads.
              </li>
              <li>Integração com WhatsApp Business API (Meta Cloud API).</li>
              <li>
                Gestão de equipe, catálogo de produtos e base de conhecimento.
              </li>
              <li>Envio de mensagens interativas, listas e carrosséis.</li>
              <li>Relatórios e análises de desempenho comercial.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              3. Conta e Registro
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Você deve ter pelo menos 18 anos para utilizar o Serviço.</li>
              <li>
                Forneça informações verdadeiras e atualizadas ao se registrar.
              </li>
              <li>
                Você é responsável por manter a confidencialidade suas
                credenciais.
              </li>
              <li>Cada workspace é associado a uma empresa/negócio.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              4. Uso Aceitável
            </h2>
            <p>Ao utilizar o Serviço, você se compromete a:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>
                Cumprir todas as leis e regulamentações aplicáveis, incluindo
                LGPD.
              </li>
              <li>
                Respeitar as{" "}
                <a
                  href="https://www.whatsapp.com/legal/business-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300"
                >
                  Políticas do WhatsApp Business
                </a>{" "}
                e da Meta.
              </li>
              <li>
                Obter consentimento dos seus leads/clientes antes de enviar
                mensagens.
              </li>
              <li>
                Não enviar spam, mensagens não solicitadas ou conteúdo proibido.
              </li>
              <li>
                Não utilizar o Serviço para atividades ilegais ou fraudulentas.
              </li>
              <li>Não tentar acessar dados de outros workspaces/clientes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              5. Integração WhatsApp (Meta API)
            </h2>
            <p>Ao conectar seu número via Embedded Signup, você:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>
                Autoriza a Synapse a enviar e receber mensagens em seu nome via
                WhatsApp Cloud API.
              </li>
              <li>
                Reconhece que a Meta pode aplicar limites de envio, custos e
                restrições.
              </li>
              <li>
                Concorda que é responsável pelo conteúdo das mensagens enviadas.
              </li>
              <li>
                Entende que conversas são processadas por IA para fins de
                qualificação.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              6. Planos e Pagamentos
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Os planos e preços estão disponíveis na página de preços.</li>
              <li>
                A cobrança é mensal ou anual, conforme o plano selecionado.
              </li>
              <li>
                Cancelamentos podem ser feitos a qualquer momento, com efeito ao
                final do período pago.
              </li>
              <li>Não oferecemos reembolso para períodos já iniciados.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              7. Propriedade Intelectual
            </h2>
            <p>
              A plataforma SynapseWhats, incluindo código, design, marca e
              documentação, é propriedade da Synapse Automações. Você mantém a
              propriedade dos seus dados e conteúdos. Ao usar o Serviço, você
              nos concede licença limitada para processar seus dados conforme
              necessário para a prestação do Serviço.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              8. Limitação de Responsabilidade
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>O Serviço é fornecido "como está" (as-is).</li>
              <li>
                Não garantimos disponibilidade ininterrupta ou livre de erros.
              </li>
              <li>
                Não nos responsabilizamos por decisões tomadas com base na IA.
              </li>
              <li>
                Nossa responsabilidade total é limitada ao valor pago nos
                últimos 12 meses.
              </li>
              <li>
                Não nos responsabilizamos por bloqueios aplicados pela
                Meta/WhatsApp.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              9. Rescisão
            </h2>
            <p>
              Podemos suspender ou encerrar sua conta caso haja violação destes
              Termos, uso abusivo do Serviço, ou descumprimento das políticas do
              WhatsApp/Meta. Você pode cancelar sua conta a qualquer momento nas
              configurações do Serviço.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              10. Alterações nos Termos
            </h2>
            <p>
              Podemos atualizar estes Termos periodicamente. Alterações
              significativas serão comunicadas via e-mail ou notificação na
              plataforma. O uso continuado do Serviço após as alterações
              constitui aceitação dos novos Termos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              11. Foro e Legislação
            </h2>
            <p>
              Estes Termos são regidos pela legislação brasileira. Qualquer
              disputa será resolvida no foro da comarca de São Paulo/SP.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              12. Contato
            </h2>
            <p>
              📧 E-mail:{" "}
              <a
                href="mailto:andredomingos456@outlook.com"
                className="text-purple-400 hover:text-purple-300"
              >
                andredomingos456@outlook.com
              </a>
            </p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} Synapse Automações. Todos os direitos
          reservados.
        </div>
      </div>
    </div>
  );
}
