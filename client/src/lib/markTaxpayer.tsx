import { Fragment, type ReactNode } from "react";

const TAXPAYER_WORD = /(\btaxpayers?\b)/gi;

export function markTaxpayer(text: string): ReactNode {
  const parts = text.split(TAXPAYER_WORD);
  if (parts.length === 1) return text;
  return parts.map((part, index) =>
    /^taxpayers?$/i.test(part) ? (
      <span key={`${index}-${part}`} className="taxpayer-word">
        {part}
      </span>
    ) : (
      <Fragment key={`${index}-text`}>{part}</Fragment>
    ),
  );
}
