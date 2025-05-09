import React from 'react';

// Einzelnes Summary-Widget
const SummaryWidget = ({ title, value, info }) => (
  <div className="p-4 bg-gray-100 rounded-xl text-center">
    <h3 className="font-medium flex items-center justify-center">
      {title}
      <abbr title={info} className="ml-2 text-gray-400 cursor-help" style={{ textDecoration: 'none' }}>
        ?
      </abbr>
    </h3>
    <p className="mt-2 text-2xl font-semibold">{value}</p>
  </div>
);

/**
 * SummarySection kompaktiert alle Übersichts-Widgets
 * Props:
 * - totalNew: Gesamtzahl Neukunden
 * - reorders: Anzahl Nachbesteller
 * - avgUnits: Ø VE pro Händler/Jahr
 * - avgRevenue: Ø Umsatz pro Händler/Jahr
 * - deckungsbeitragPerUnit: Deckungsbeitrag II pro VE
 * - license1Gross: Lizenz1-Brutto pro VE
 * - license2: Lizenz2-Brutto pro VE
 */
export default function SummarySection({
  totalNew,
  reorders,
  avgUnits,
  avgRevenue,
  deckungsbeitragPerUnit,
  license1Gross,
  license2
}) {
  const fmtNum = v => new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
  const fmtCurr = v => fmtNum(v) + ' €';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <SummaryWidget title="Gesamt Neukunden" value={fmtNum(totalNew)} info="Summe aller Neukunden" />
      <SummaryWidget title="Kunden mit ≥1 Nachbestellung" value={fmtNum(reorders)} info="Kunden mit Nachbestellung" />
      <SummaryWidget title="Ø VE pro Händler/Jahr" value={fmtNum(avgUnits)} info="Ø VE je Kunde in 12 Monaten" />
      <SummaryWidget title="Ø Umsatz pro Händler/Jahr" value={fmtCurr(avgRevenue)} info="Ø Umsatz je Kunde in 12 Monaten" />
      <SummaryWidget
        title="Gewinn vor Steuern je VE (€)"
        value={fmtCurr(deckungsbeitragPerUnit - license1Gross - license2)}
        info="Deckungsbeitrag II pro VE minus Lizenzkosten"
      />
    </div>
  );
}
