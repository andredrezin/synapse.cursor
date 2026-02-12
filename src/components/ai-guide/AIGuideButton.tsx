import { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AIGuideChat from './AIGuideChat';
import { cn } from '@/lib/utils';

// Owl mascot SVG component
const OwlMascot = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    {/* Owl body */}
    <ellipse cx="12" cy="14" rx="7" ry="8" />
    {/* Left ear tuft */}
    <path d="M7 6 L5 3 L8 5" />
    {/* Right ear tuft */}
    <path d="M17 6 L19 3 L16 5" />
    {/* Left eye */}
    <circle cx="9" cy="11" r="2.5" />
    <circle cx="9" cy="11" r="1" fill="currentColor" />
    {/* Right eye */}
    <circle cx="15" cy="11" r="2.5" />
    <circle cx="15" cy="11" r="1" fill="currentColor" />
    {/* Beak */}
    <path d="M12 13 L10.5 15 L12 16 L13.5 15 Z" fill="currentColor" />
    {/* Chest pattern */}
    <path d="M9 17 Q12 20 15 17" />
    {/* Feet */}
    <path d="M9 21 L8 22 M10 21 L10 22 M14 21 L14 22 M15 21 L16 22" />
  </svg>
);

const AIGuideButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg transition-all duration-300",
          "bg-gradient-to-r from-primary to-chart-purple hover:scale-110",
          "flex items-center justify-center",
          isOpen && "rotate-90"
        )}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <div className="relative">
            <OwlMascot className="h-7 w-7" />
            <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-chart-yellow" />
          </div>
        )}
      </Button>

      {/* Chat Panel */}
      <div
        className={cn(
          "fixed bottom-24 right-6 z-40 w-96 h-[600px] bg-card border border-border rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden",
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        <AIGuideChat onClose={() => setIsOpen(false)} />
      </div>
    </>
  );
};

export default AIGuideButton;
