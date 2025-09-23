"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  items: FAQItem[];
}

export function FAQ({ items }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="border border-warm-gray rounded-lg overflow-hidden">
          <button
            onClick={() => toggleItem(index)}
            className="w-full text-left p-6 hover:bg-warm-gray/5 transition-colors"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-foreground">{item.question}</h3>
              {openIndex === index ? (
                <ChevronUp className="w-5 h-5 text-primary" />
              ) : (
                <ChevronDown className="w-5 h-5 text-primary" />
              )}
            </div>
          </button>
          {openIndex === index && (
            <div className="px-6 pb-6">
              <p className="text-foreground/70 leading-relaxed">{item.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
