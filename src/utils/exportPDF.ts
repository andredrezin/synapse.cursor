import jsPDF from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface AnalyticsData {
  conversionRate: number;
  totalLeads: number;
  convertedLeads: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  totalMessages: number;
  aiMessages: number;
  positiveMessages: number;
  neutralMessages: number;
  negativeMessages: number;
  messagesAnalyzed: number;
  faqsDetected: number;
  patternsLearned: number;
}

interface ComparisonData {
  leads: { current: number; previous: number };
  conversions: { current: number; previous: number };
  hotLeads: { current: number; previous: number };
  aiResponses: { current: number; previous: number };
}

export const exportAnalyticsPDF = (
  data: AnalyticsData,
  comparison: ComparisonData,
  workspaceName: string = 'LeadFlux'
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(24);
  doc.setTextColor(99, 102, 241); // Primary color
  doc.text('Relatório de Analytics IA', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(workspaceName, pageWidth / 2, 28, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, pageWidth / 2, 35, { align: 'center' });

  // Divider
  doc.setDrawColor(200);
  doc.line(20, 40, pageWidth - 20, 40);

  // KPIs Section
  doc.setFontSize(16);
  doc.setTextColor(50);
  doc.text('Métricas Principais', 20, 50);

  doc.autoTable({
    startY: 55,
    head: [['Métrica', 'Valor', 'Período Anterior', 'Variação']],
    body: [
      [
        'Taxa de Conversão',
        `${data.conversionRate.toFixed(1)}%`,
        `${comparison.conversions.previous > 0 ? ((comparison.conversions.previous / data.totalLeads) * 100).toFixed(1) : 0}%`,
        formatChange(comparison.conversions.current, comparison.conversions.previous)
      ],
      [
        'Total de Leads',
        data.totalLeads.toString(),
        comparison.leads.previous.toString(),
        formatChange(comparison.leads.current, comparison.leads.previous)
      ],
      [
        'Leads Convertidos',
        data.convertedLeads.toString(),
        comparison.conversions.previous.toString(),
        formatChange(comparison.conversions.current, comparison.conversions.previous)
      ],
      [
        'Leads Quentes',
        data.hotLeads.toString(),
        comparison.hotLeads.previous.toString(),
        formatChange(comparison.hotLeads.current, comparison.hotLeads.previous)
      ],
      [
        'Respostas da IA',
        data.aiMessages.toString(),
        comparison.aiResponses.previous.toString(),
        formatChange(comparison.aiResponses.current, comparison.aiResponses.previous)
      ],
    ],
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] },
    styles: { fontSize: 10 },
  });

  // Temperature Distribution
  const tempY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(16);
  doc.text('Distribuição de Temperatura', 20, tempY);

  doc.autoTable({
    startY: tempY + 5,
    head: [['Temperatura', 'Quantidade', 'Porcentagem']],
    body: [
      ['Quentes 🔥', data.hotLeads.toString(), `${((data.hotLeads / data.totalLeads) * 100 || 0).toFixed(1)}%`],
      ['Mornos 🌡️', data.warmLeads.toString(), `${((data.warmLeads / data.totalLeads) * 100 || 0).toFixed(1)}%`],
      ['Frios ❄️', data.coldLeads.toString(), `${((data.coldLeads / data.totalLeads) * 100 || 0).toFixed(1)}%`],
    ],
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] },
    styles: { fontSize: 10 },
  });

  // Sentiment Analysis
  const sentimentY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(16);
  doc.text('Análise de Sentimento', 20, sentimentY);

  const totalSentiment = data.positiveMessages + data.neutralMessages + data.negativeMessages;
  doc.autoTable({
    startY: sentimentY + 5,
    head: [['Sentimento', 'Mensagens', 'Porcentagem']],
    body: [
      ['Positivo ✅', data.positiveMessages.toString(), `${((data.positiveMessages / totalSentiment) * 100 || 0).toFixed(1)}%`],
      ['Neutro ➖', data.neutralMessages.toString(), `${((data.neutralMessages / totalSentiment) * 100 || 0).toFixed(1)}%`],
      ['Negativo ❌', data.negativeMessages.toString(), `${((data.negativeMessages / totalSentiment) * 100 || 0).toFixed(1)}%`],
    ],
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] },
    styles: { fontSize: 10 },
  });

  // AI Training Status
  const trainingY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(16);
  doc.text('Status do Treinamento IA', 20, trainingY);

  doc.autoTable({
    startY: trainingY + 5,
    head: [['Métrica', 'Valor']],
    body: [
      ['Mensagens Analisadas', data.messagesAnalyzed.toString()],
      ['FAQs Detectadas', data.faqsDetected.toString()],
      ['Padrões Aprendidos', data.patternsLearned.toString()],
      ['Total de Mensagens', data.totalMessages.toString()],
    ],
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] },
    styles: { fontSize: 10 },
  });

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('Relatório gerado automaticamente por LeadFlux AI Analytics', pageWidth / 2, pageHeight - 10, { align: 'center' });

  // Save
  doc.save(`analytics-report-${new Date().toISOString().split('T')[0]}.pdf`);
};

function formatChange(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? '+100%' : '0%';
  const change = ((current - previous) / previous) * 100;
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
}
