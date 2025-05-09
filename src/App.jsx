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

  // Auto‐Update von marginPerUnit & deckungsbeitragPerUnit
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
    sellPrice,
    deckungsbeitragPerUnit,
    license1Gross,
    license2
  } = data;

  const [startYear, startMonth] = startDate.split('-').map(Number);

  // 1) Neukunden‐Kohorten pro Monat
  const newPartnersPerMonth = Array.from(
    { length: months },
    (_, j) =>
      newPartners +
      (increaseInterval > 0
        ? Math.floor(j / increaseInterval) * increaseAmount
        : 0)
  );

  // 2) totalNew & reorders
  const totalNew = newPartnersPerMonth.reduce((a, b) => a + b, 0);
  const reorders = Math.round(
    newPartnersPerMonth
      .slice(0, months - reorderCycle)
      .reduce((sum, c) => sum + c * (reorderRate / 100), 0)
  );

  // 3) Gesamt‐VE in den ersten 12 Monaten aller Kunden
  let totalUnitsAllCustomers = 0;
  newPartnersPerMonth.forEach(cohortSize => {
    let vePerCustomer = unitsPerDisplay;            // Erstbestellung (Monat 0)
    for (let m = 1; m <= 11; m++) {                  // Nachbestellungen in Monat 1…11
      if (reorderCycle > 0 && m % reorderCycle === 0) {
        vePerCustomer += (reorderRate / 100) * unitsPerDisplay;
      }
    }
    totalUnitsAllCustomers += cohortSize * vePerCustomer;
  });

  // Ø VE pro Händler/Jahr (alle)
  const avgUnitsAll =
    totalNew > 0 ? totalUnitsAllCustomers / totalNew : 0;

  // 4) Anzahl der Händler mit ≥1 Nachbestellung
  const reorderersCount = Math.round(
    newPartnersPerMonth
      .slice(0, months - reorderCycle)
      .reduce((sum, cohortSize) => sum + cohortSize * (reorderRate / 100), 0)
  );

  // Ø VE pro Händler/Jahr (nur Reorderer)
  const avgUnitsReorderers =
    reorderersCount > 0
      ? totalUnitsAllCustomers / reorderersCount
      : 0;

  // Ø Umsatz pro Händler/Jahr (alle)
  const avgRevenueAll = avgUnitsAll * sellPrice;

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
        {/* Bestehende Zusammenfassung */}
        <SummarySection
          totalNew={totalNew}
          reorders={reorders}
          avgUnits={avgUnitsAll}
          avgRevenue={avgRevenueAll}
          deckungsbeitragPerUnit={deckungsbeitragPerUnit}
          license1Gross={license1Gross}
          license2={license2}
        />

        {/* Neues Widget: Ø VE nur über Reorderer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="p-4 bg-gray-100 rounded-xl text-center">
            <h3 className="font-medium">
              Ø VE nur Reorderer/Jahr
            </h3>
            <p className="text-sm text-gray-500 mb-2">
              Durchschnittliche Verkaufseinheiten in den ersten 12 Monaten pro Händler, der mindestens eine Nachbestellung getätigt hat
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {fmtNum(avgUnitsReorderers)}
            </p>
          </div>
        </div>
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
