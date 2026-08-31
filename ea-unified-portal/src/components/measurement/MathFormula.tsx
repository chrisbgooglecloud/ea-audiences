'use client';

import React, { useMemo } from 'react';
import katex from 'katex';

interface MathFormulaProps {
  math: string;
  block?: boolean;
  className?: string;
}

export function MathFormula({ math, block = false, className = '' }: MathFormulaProps) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, {
        displayMode: block,
        throwOnError: false,
      });
    } catch {
      return math;
    }
  }, [math, block]);

  return (
    <span
      className={`inline-math ${block ? 'block my-2 text-center' : 'inline'} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * FormattedText parses strings containing inline LaTeX ($...$) or block LaTeX ($$...$$)
 * while preserving standard text and dollar signs used for currency.
 */
interface FormattedTextProps {
  text: string;
  className?: string;
}

export function FormattedText({ text, className = '' }: FormattedTextProps) {
  const elements = useMemo(() => {
    if (!text) return null;

    // Matches $$...$$ or $...$ where the content inside is a formula (contains LaTeX or math operators)
    const regex = /(\$\$[\s\S]+?\$\$|\$(?:\\.|[^\$\n])+\$)/g;
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (part.startsWith('$$') && part.endsWith('$$') && part.length > 4) {
        const math = part.slice(2, -2).trim();
        try {
          const html = katex.renderToString(math, {
            displayMode: true,
            throwOnError: false,
          });
          return (
            <span
              key={index}
              className="block my-2 text-center"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return <span key={index}>{part}</span>;
        }
      } else if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
        const math = part.slice(1, -1).trim();
        try {
          const html = katex.renderToString(math, {
            displayMode: false,
            throwOnError: false,
          });
          return (
            <span
              key={index}
              className="inline-math px-0.5"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return <span key={index}>{part}</span>;
        }
      }
      return <span key={index}>{part}</span>;
    });
  }, [text]);

  return <span className={className}>{elements}</span>;
}

export default MathFormula;
