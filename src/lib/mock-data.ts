// Utility functions for data formatting
// Note: All actual data comes from Supabase, these are just helper functions

export interface Lead {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  source: 'ads' | 'organic' | 'referral' | 'landing' | 'direct' | 'pixel';
  score: number;
  temperature: 'cold' | 'warm' | 'hot';
  status: 'new' | 'in_progress' | 'converted' | 'lost';
  lastMessage: string;
  lastMessageTime: Date;
  sentiment: 'positive' | 'neutral' | 'negative';
  assignedTo: string;
  objections: string[];
  responseTime: number;
  messagesCount: number;
  createdAt: Date;
}

export interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'seller' | 'owner' | 'member';
  conversions: number;
  responseTime: number;
  qualityScore: number;
  activeConversations: number;
  status: 'online' | 'away' | 'offline';
}

export interface Alert {
  id: string;
  type: 'hot_lead' | 'slow_response' | 'objection' | 'conversion' | 'risk';
  title: string;
  description: string;
  leadId?: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  read: boolean;
}

export interface ConversionData {
  date: string;
  conversions: number;
  leads: number;
  ads: number;
  organic: number;
}

// Utility functions
export const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-primary';
  if (score >= 50) return 'text-chart-orange';
  return 'text-chart-red';
};

export const getScoreBg = (score: number): string => {
  if (score >= 80) return 'bg-primary/20';
  if (score >= 50) return 'bg-chart-orange/20';
  return 'bg-chart-red/20';
};

export const getTemperatureLabel = (temp: Lead['temperature']): string => {
  const labels = { cold: 'Frio', warm: 'Morno', hot: 'Quente' };
  return labels[temp];
};

export const getTemperatureColor = (temp: Lead['temperature']): string => {
  const colors = { 
    cold: 'bg-chart-blue/20 text-chart-blue',
    warm: 'bg-chart-orange/20 text-chart-orange',
    hot: 'bg-primary/20 text-primary'
  };
  return colors[temp];
};

export const getStatusLabel = (status: Lead['status']): string => {
  const labels = { 
    new: 'Novo',
    in_progress: 'Em andamento',
    converted: 'Convertido',
    lost: 'Perdido'
  };
  return labels[status];
};

export const getSentimentIcon = (sentiment: Lead['sentiment']): string => {
  const icons = { positive: '😊', neutral: '😐', negative: '😟' };
  return icons[sentiment];
};

export const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (minutes < 60) return `${minutes}min`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
};

export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 13) {
    return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
  }
  return phone;
};

export const getSourceLabel = (source: Lead['source']): string => {
  const labels = {
    ads: 'Anúncios',
    organic: 'Orgânico',
    referral: 'Indicação',
    landing: 'Landing Page',
    direct: 'Direto',
    pixel: 'Pixel'
  };
  return labels[source] || source;
};

export const getSourceColor = (source: Lead['source']): string => {
  const colors = {
    ads: 'bg-chart-purple/20 text-chart-purple',
    organic: 'bg-primary/20 text-primary',
    referral: 'bg-chart-blue/20 text-chart-blue',
    landing: 'bg-chart-orange/20 text-chart-orange',
    direct: 'bg-muted text-muted-foreground',
    pixel: 'bg-chart-yellow/20 text-chart-yellow'
  };
  return colors[source] || 'bg-muted text-muted-foreground';
};
