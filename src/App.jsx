import React, { useState, useEffect } from 'react';
import InputMask from './components/InputMask';
import LicenseChart from './components/LicenseChart';
import SummarySection from './components/SummarySection';

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

export default function App() {
  const [data, setData] = useState({
    months: 36,
    startDate: '2025-07',
    costPrice: 6.9,
    sellPrice: 12.9,
    uvp: 19.9,
    salesCost: 0,
    logisticsCost: 0,
    marginPerUnit: 6.0,
    deckungsbeitragPerUnit: 2.0,
    unitsPerDisplay: 32,
    newPartners: 1,
    increaseInterval: 12,
    increaseAmount: 0,
    reorderRate: 100,
    reorderCycle: 12,
    license1Gross: 1.2,
    postcardCost: 0.1,
    graphicShare: 0.2,
    license2: 1.3,
    license2Threshold: 3
  });

  // Automatische Aktualisierung von marginPerUnit & deckungsbeitragPerUnit
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

  // Neukunden pro Monat
  const newPartnersPerMonth = Array.from(
    { length: months },
    (_, j) =>
      newPartners +
      (increaseInterval > 0
        ? Math.floor(j / increaseInterval) * increaseAmount
        : 0)
  );

  // Summary-Werte
  const totalNew = newPartnersPerMonth.reduce((a, b) => a + b, 0);
  const reorders = Math.round(
    newPartnersPerMonth
      .slice(0, months - reorderCycle)
      .reduce((sum, c) => sum + c * (reorderRate / 100), 0)
  );

  // Ø VE pro Händler/Jahr & Ø Umsatz pro Händler/Jahr
  // Wir zählen nur Reorders, die innerhalb der ersten 12 Monate nach Eintrittsmonat liegen (t < 12),
  // daher floor((12 - 1) / reorderCycle)
  const reorderEventsPerYear =
    reorderCycle > 0 ? Math.floor((12 - 1) / reorderCycle) : 0;
  const avgUnits =
    unitsPerDisplay * (1 + (reorderRate / 100) * reorderEventsPerYear);
  const avgRevenue = avgUnits * sellPrice;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-semibold mb-6">
        Business Case Simulator
      </h1>

      <CollapsibleSection title="Basisdaten">
        <InputMask data={data} onChange={setData} />
      </CollapsibleSection>

      <CollapsibleSection title="Übersicht">
        <SummarySection
          totalNew={totalNew}
          reorders={reorders}
          avgUnits={avgUnits}
          avgRevenue={avgRevenue}
          deckungsbeitragPerUnit={data.deckungsbeitragPerUnit}
          license1Gross={data.license1Gross}
          license2={data.license2}
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
