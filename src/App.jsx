import React, { useState, useEffect } from 'react';
import InputMask from './components/InputMask';
import LicenseChart from './components/LicenseChart';
import ReorderRatioChart from './components/ReorderRatioChart';

function CollapsibleSection({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="w-full border rounded-2xl bg-white mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 text-left font-semibold"
      >
        {title} <span>{open ? '−' : '+'}</span>
      </button>
      {open && <div className="p-6">{children}</div>}
    </div>
  );
}

// Wir definieren das Widget hier, damit der Info-Text immer sichtbar ist
function SummaryWidget({ title, value, info }) {
  return (
    <div className="p-4 bg-gray-100 rounded-xl text-center">
      <h3 className="font-medium">{title}</h3>
      <p className="text-sm text-gray-500 mb-2">{info}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState({
    months: 120,
    startDate: '2025-07',
    costPrice: 6.9,
    sellPrice: 12.9,
    uvp: 19.9,
    salesCost: 0,
    logisticsCost: 0,
    marginPerUnit: 6.0,
    deckungsbeitragPerUnit: 2.0,
    unitsPerDisplay: 32,
    newPartners: 4,
    increaseInterval: 12,
    increaseAmount: 2,
    reorderRate: 50,
    reorderCycle: 1,
    license1Gross: 1.2,
    postcardCost: 0.1,
    graphicShare: 0.2,
    license2: 1.3,
    license2Threshold: 3
  });

  // Auto-Update von marginPerUnit & deckungsbeitragPerUnit
  useEffect(() => {
    const { sellPrice, costPrice, salesCost, logisticsCost } = data;
    const margin = parseFloat((sellPrice - costPrice).toFixed(2));
    const deck = parseFloat((margin - salesCost - logisticsCost).toFixed(2));
    setData(d => ({ ...d, marginPerUnit: margin, deckungsbeitragPerUnit: deck }));
  }, [data.sellPrice, data.costPrice, data.salesCost, data.logisticsCost]);

  const {
    months,
    startDate,
    unitsPerDisplay,
    newPartners,
    increaseInterval,
    increaseAmount,
    reorderRate,
    reorderCycle,
    sellPrice
  } = data;

  const [startYear, startMonth] = startDate.split('-').map(Number);

  // 1) Neukunden pro Monat
  const newPartnersPerMonth = Array.from(
    { length: months },
    (_, j) =>
      newPartners +
      (increaseInterval > 0
        ? Math.floor(j / increaseInterval) * increaseAmount
        : 0)
  );

  // 2) Summary-Gesamtwerte
  const totalNew = newPartnersPerMonth.reduce((a, b) => a + b, 0);
  const reorders = Math.round(
    newPartnersPerMonth
      .slice(0, months - reorderCycle)
      .reduce((sum, c) => sum + c * (reorderRate / 100), 0)
  );

  // 3) Ø VE pro Kunde im ersten Jahr (inkl. Erstbestellung)
  let totalUnitsAllCustomers = 0;
  newPartnersPerMonth.forEach(cohortSize => {
    // VE pro Kunde in 12 Monaten
    let unitsPerCustomerFirstYear = unitsPerDisplay;               // Erstbestellung
    for (let m = 1; m <= 12; m++) {                                // inkl. Monat 12
      if (reorderCycle > 0 && m % reorderCycle === 0) {
        unitsPerCustomerFirstYear += (reorderRate / 100) * unitsPerDisplay;
      }
    }
    totalUnitsAllCustomers += cohortSize * unitsPerCustomerFirstYear;
  });
  const avgUnits = totalNew > 0 ? totalUnitsAllCustomers / totalNew : 0;
  const avgRevenue = avgUnits * sellPrice;

  // 4) Ø VE **nur** für Kunden, die tatsächlich nachbestellen
  //    d.h. für jede Kohorte: cohortSize * quote gibt Anzahl dieser "Reorderer"
  //    und jede/r davon hat genau unitsPerCustomerFirstYear VE
  const reorderersCount = Math.round(
    newPartnersPerMonth
      .slice(0, months - reorderCycle)
      .reduce((sum, cohortSize) => sum + cohortSize * (reorderRate / 100), 0)
  );
  // Wir hatten unitsPerCustomerFirstYear oberhalb als Laufvariable, 
  // wir berechnen sie hier noch einmal für den Widget-Wert:
  let unitsPerReordererFirstYear = unitsPerDisplay;
  for (let m = 1; m <= 12; m++) {
    if (reorderCycle > 0 && m % reorderCycle === 0) {
      unitsPerReordererFirstYear += (reorderRate / 100) * unitsPerDisplay;
    }
  }

  // Formatter
  const fmt = v =>
    new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(v) + ' €';
  const fmtNum = v =>
    new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(v);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-semibold mb-6">
        Business Case Simulator
      </h1>

      <CollapsibleSection title="Basisdaten">
        <InputMask data={data} onChange={setData} />
      </CollapsibleSection>

      <CollapsibleSection title="Übersicht">
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
            title="Ø VE nur bei Reorderern/Jahr"
            value={fmtNum(unitsPerReordererFirstYear)}
            info="Durchschnittliche VE pro Kunde, der mindestens einmal nachbestellt"
          />
          <SummaryWidget
            title="Gewinn vor Steuern je VE (€)"
            value={fmt(
              data.deckungsbeitragPerUnit - data.license1Gross - data.license2
            )}
            info="Deckungsbeitrag II pro VE minus Lizenzkosten"
          />
        </div>

        <h2 className="mt-8 text-xl font-semibold">Reorder-Ratio</h2>
        <ReorderRatioChart
          totalCustomers={totalNew}
          reorderers={reorderersCount}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Einnahmen & Marge">
        <LicenseChart
          data={data}
          startYear={startYear}
          startMonth={startMonth}
          dataKey="tier1"
          strokeColor="#34C759"
          name="Lizenz 1 Erlös"
          dataKey2="tier2"
          strokeColor2="#007AFF"
          name2="Lizenz 2 Erlös"
          dataKey3="deckungsbeitragII"
          strokeColor3="#FFD60A"
          name3="Deckungsbeitrag II"
          dataKey4="restgewinn"
          strokeColor4="#FF9500"
          name4="Restgewinn"
        />
      </CollapsibleSection>
    </div>
  );
}
