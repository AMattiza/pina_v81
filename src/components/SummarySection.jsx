// src/components/SummarySection.jsx
import React from 'react';

function SummaryWidget({ title, value, info }) {
  return (
    <div className="p-4 bg-gray-100 rounded-xl text-center">
      <h3 className="font-medium">{title}</h3>
      <p className="text-sm text-gray-500 mb-2">{info}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export default function SummarySection({
  totalNew,
  reorders,
  avgUnits,
  avgRevenue,
  deckungsbeitragPerUnit,
  license1Gross,
  license2,
}) {
  const fmt = v =>
    new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(v) + ' €';
  const fmtNum = v =>
    new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(v);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <SummaryWidget
        title="Gesamt Neukunden"
        value={fmtNum(totalNew)}
        info="Summe aller Neukunden"
      />
      <SummaryWidget
        title="Kunden mit ≥1 Nachbestellung"
        value={fmtNum(reorders)}
        info="Kunden, die mindestens eine Nachbestellung getätigt haben"
      />
      <SummaryWidget
        title="Ø VE pro Händler/Jahr"
        value={fmtNum(avgUnits)}
        info="Ø VE pro Kunde in den ersten 12 Monaten (inkl. Erstbestellung)"
      />
      <SummaryWidget
        title="Ø Umsatz pro Händler/Jahr"
        value={fmt(avgRevenue)}
        info="Ø Umsatz pro Kunde in den ersten 12 Monaten"
      />
      <SummaryWidget
        title="Gewinn vor Steuern je VE (€)"
        value={fmt(deckungsbeitragPerUnit - license1Gross - license2)}
        info="Deckungsbeitrag II pro VE minus Lizenzkosten"
      />
    </div>
  );
}
