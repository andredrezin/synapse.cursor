import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
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
          Política de Privacidade
        </h1>
        <p className="text-gray-400 mb-10">
          Última atualização: 10 de fevereiro de 2026
        </p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              1. Introdução
            </h2>
            <p>
              A <strong>Synapse Automações</strong> ("nós", "nosso") opera a
              plataforma SynapseWhats ("Serviço"), uma solução SaaS de automação
              de vendas e atendimento via WhatsApp com inteligência artificial.
              Esta Política de Privacidade descreve como coletamos, usamos,
              armazenamos e protegemos suas informações pessoais.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              2. Dados que Coletamos
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Dados de Cadastro:</strong> nome, e-mail, telefone,
                empresa e cargo ao criar sua conta.
              </li>
              <li>
                <strong>Dados de Integração WhatsApp:</strong> número de
                telefone vinculado, tokens de acesso da Meta API,
                identificadores do WhatsApp Business Account (WABA).
              </li>
              <li>
                <strong>Dados de Conversas:</strong> mensagens trocadas entre
                você/sua equipe e seus leads/clientes via WhatsApp, processadas
                pela nossa IA.
              </li>
              <li>
                <strong>Dados de Uso:</strong> informações sobre como você
                utiliza o Serviço, incluindo logs de acesso, páginas visitadas e
                funcionalidades utilizadas.
              </li>
              <li>
                <strong>Dados de Leads:</strong> informações dos contatos
                comerciais cadastrados na plataforma, como nome, telefone,
                estágio no funil e histórico de interações.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              3. Como Usamos seus Dados
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Fornecer, operar e manter o Serviço.</li>
              <li>Processar mensagens via WhatsApp Business API da Meta.</li>
              <li>Treinar e personalizar agentes de IA para seu negócio.</li>
              <li>Classificar e qualificar leads automaticamente.</li>
              <li>Gerar relatórios e análises de desempenho comercial.</li>
              <li>Enviar notificações relacionadas ao serviço.</li>
              <li>Melhorar e otimizar a plataforma.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              4. Compartilhamento de Dados
            </h2>
            <p>Seus dados podem ser compartilhados com:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>
                <strong>Meta Platforms (WhatsApp):</strong> para processamento
                de mensagens via WhatsApp Cloud API.
              </li>
              <li>
                <strong>Provedores de IA:</strong> OpenAI e Google para
                processamento de linguagem natural, de forma anonimizada.
              </li>
              <li>
                <strong>Supabase:</strong> como infraestrutura de banco de dados
                e autenticação.
              </li>
              <li>
                <strong>Autoridades legais:</strong> quando exigido por lei ou
                ordem judicial.
              </li>
            </ul>
            <p className="mt-3">
              <strong>Nunca vendemos seus dados pessoais a terceiros.</strong>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              5. Segurança dos Dados
            </h2>
            <p>
              Implementamos medidas de segurança técnicas e organizacionais,
              incluindo: criptografia em trânsito (TLS/SSL), controle de acesso
              baseado em roles (RLS), isolamento de dados por workspace
              (multi-tenant), e backups regulares. Tokens de acesso são
              armazenados de forma segura e criptografada.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              6. Retenção de Dados
            </h2>
            <p>
              Seus dados são mantidos enquanto sua conta estiver ativa. Após a
              exclusão da conta, removemos seus dados pessoais em até 30 dias,
              exceto quando a retenção for exigida por obrigações legais ou
              regulatórias.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              7. Seus Direitos (LGPD)
            </h2>
            <p>
              De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem
              direito a:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Acessar seus dados pessoais.</li>
              <li>Corrigir dados incompletos ou desatualizados.</li>
              <li>Solicitar a exclusão dos seus dados.</li>
              <li>Revogar consentimento a qualquer momento.</li>
              <li>Solicitar portabilidade dos dados.</li>
              <li>Obter informações sobre compartilhamento.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              8. Integração com Meta/WhatsApp
            </h2>
            <p>
              Ao conectar seu WhatsApp via Embedded Signup, você autoriza a
              Synapse a acessar seu WhatsApp Business Account para envio e
              recebimento de mensagens em seu nome. Seguimos todas as políticas
              da Meta Platform, incluindo a Política de Uso de Dados e os Termos
              da Plataforma WhatsApp Business.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              9. Contato
            </h2>
            <p>
              Para dúvidas sobre esta política ou para exercer seus direitos:
            </p>
            <p className="mt-2">
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
