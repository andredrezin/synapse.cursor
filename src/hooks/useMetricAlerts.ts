import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface MetricThresholds {
  conversionRate: number;
  hotLeadsPercent: number;
  negativeSentimentPercent: number;
  aiResponseRate: number;
}

interface MetricValues {
  conversionRate: number;
  hotLeadsPercent: number;
  negativeSentimentPercent: number;
  aiResponseRate: number;
}

interface Alert {
  id: string;
  metric: string;
  message: string;
  severity: 'warning' | 'critical';
  value: number;
  threshold: number;
  timestamp: Date;
}

const DEFAULT_THRESHOLDS: MetricThresholds = {
  conversionRate: 10, // Alert if below 10%
  hotLeadsPercent: 5, // Alert if below 5%
  negativeSentimentPercent: 30, // Alert if above 30%
  aiResponseRate: 20, // Alert if below 20%
};

const STORAGE_KEY = 'metric_alert_thresholds';

export const useMetricAlerts = (metrics: MetricValues | null) => {
  const [thresholds, setThresholds] = useState<MetricThresholds>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_THRESHOLDS;
  });
  
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  const updateThresholds = useCallback((newThresholds: Partial<MetricThresholds>) => {
    setThresholds(prev => {
      const updated = { ...prev, ...newThresholds };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const checkAlerts = useCallback(() => {
    if (!metrics) return;

    const newAlerts: Alert[] = [];

    // Check conversion rate
    if (metrics.conversionRate < thresholds.conversionRate) {
      const severity = metrics.conversionRate < thresholds.conversionRate / 2 ? 'critical' : 'warning';
      newAlerts.push({
        id: 'conversion_rate',
        metric: 'Taxa de Conversão',
        message: `Taxa de conversão está em ${metrics.conversionRate.toFixed(1)}% (limite: ${thresholds.conversionRate}%)`,
        severity,
        value: metrics.conversionRate,
        threshold: thresholds.conversionRate,
        timestamp: new Date(),
      });
    }

    // Check hot leads
    if (metrics.hotLeadsPercent < thresholds.hotLeadsPercent) {
      const severity = metrics.hotLeadsPercent < thresholds.hotLeadsPercent / 2 ? 'critical' : 'warning';
      newAlerts.push({
        id: 'hot_leads',
        metric: 'Leads Quentes',
        message: `Apenas ${metrics.hotLeadsPercent.toFixed(1)}% de leads quentes (limite: ${thresholds.hotLeadsPercent}%)`,
        severity,
        value: metrics.hotLeadsPercent,
        threshold: thresholds.hotLeadsPercent,
        timestamp: new Date(),
      });
    }

    // Check negative sentiment (higher is worse)
    if (metrics.negativeSentimentPercent > thresholds.negativeSentimentPercent) {
      const severity = metrics.negativeSentimentPercent > thresholds.negativeSentimentPercent * 1.5 ? 'critical' : 'warning';
      newAlerts.push({
        id: 'negative_sentiment',
        metric: 'Sentimento Negativo',
        message: `${metrics.negativeSentimentPercent.toFixed(1)}% de mensagens negativas (limite: ${thresholds.negativeSentimentPercent}%)`,
        severity,
        value: metrics.negativeSentimentPercent,
        threshold: thresholds.negativeSentimentPercent,
        timestamp: new Date(),
      });
    }

    // Check AI response rate
    if (metrics.aiResponseRate < thresholds.aiResponseRate) {
      const severity = metrics.aiResponseRate < thresholds.aiResponseRate / 2 ? 'critical' : 'warning';
      newAlerts.push({
        id: 'ai_response',
        metric: 'Taxa de Resposta IA',
        message: `IA respondendo apenas ${metrics.aiResponseRate.toFixed(1)}% das mensagens (limite: ${thresholds.aiResponseRate}%)`,
        severity,
        value: metrics.aiResponseRate,
        threshold: thresholds.aiResponseRate,
        timestamp: new Date(),
      });
    }

    // Filter out dismissed alerts
    const filteredAlerts = newAlerts.filter(a => !dismissedAlerts.has(a.id));
    setAlerts(filteredAlerts);

    // Show toast for new critical alerts
    filteredAlerts.forEach(alert => {
      if (alert.severity === 'critical') {
        toast.error(alert.message, {
          duration: 5000,
        });
      }
    });
  }, [metrics, thresholds, dismissedAlerts]);

  const dismissAlert = useCallback((alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  }, []);

  const clearDismissed = useCallback(() => {
    setDismissedAlerts(new Set());
  }, []);

  useEffect(() => {
    checkAlerts();
  }, [checkAlerts]);

  return {
    alerts,
    thresholds,
    updateThresholds,
    dismissAlert,
    clearDismissed,
    hasAlerts: alerts.length > 0,
    criticalCount: alerts.filter(a => a.severity === 'critical').length,
  };
};
