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
    sellPrice,
    deckungsbeitragPerUnit,
    license1Gross,
    license2
  } = data;

  const [startYear, startMonth] = startDate.split('-').map(Number);

  // 1) Neukunden-Kohorten pro Monat
  const newPartnersPerMonth = Array.from(
    { length: months },
    (_, j) =>
      newPartners +
      (increaseInterval > 0
        ? Math.floor(j / increaseInterval) * increaseAmount
        : 0)
  );

  // 2) Gesamt-Neukunden und Reorders im ersten Jahr (Offset 0…11)
  const totalNew = newPartnersPerMonth.reduce((a, b) => a + b, 0);
  const reorders = Math.round(
    newPartnersPerMonth
      .slice(0, months - reorderCycle)
      .reduce((sum, c) => sum + c * (reorderRate / 100), 0)
  );

  // 3) Ø VE pro Händler im zweiten Jahr (Offset 12…23)
  let totalUnitsSecondYearAllCustomers = 0;
  newPartnersPerMonth.forEach(cohortSize => {
    let veSecondYear = 0;
    for (let m = 12; m <= 23; m++) {
      if (reorderCycle > 0 && m % reorderCycle === 0) {
        veSecondYear += (reorderRate / 100) * unitsPerDisplay;
      }
    }
    totalUnitsSecondYearAllCustomers += cohortSize * veSecondYear;
  });
  const avgUnitsSecondYear =
    totalNew > 0 ? totalUnitsSecondYearAllCustomers / totalNew : 0;
  const avgRevenueSecondYear = avgUnitsSecondYear * sellPrice;

  // CSV-Export-Funktion (kein externes Package nötig)
  const handleExportCSV = () => {
    const headers = [
      'Monat',
      'Neukunden',
      'Reorders im 2. Jahr',
      'Ø VE im 2. Jahr pro Händler'
    ];
    const rows = newPartnersPerMonth.map((cohortSize, idx) => {
      let reordersYear2 = 0;
      for (let m = 12; m <= 23; m++) {
        if (reorderCycle > 0 && m % reorderCycle === 0) {
          reordersYear2 += cohortSize * (reorderRate / 100);
        }
      }
      return [
        idx + 1,
        cohortSize,
        Math.round(reordersYear2),
        avgUnitsSecondYear.toFixed(2)
      ];
    });

    const csvContent = [
      headers.join(';'),
      ...rows.map(r => r.join(';'))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `business_case_${new Date().toISOString()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
          avgUnits={avgUnitsSecondYear}
          avgRevenue={avgRevenueSecondYear}
          deckungsbeitragPerUnit={deckungsbeitragPerUnit}
          license1Gross={license1Gross}
          license2={license2}
        />
        <button
          onClick={handleExportCSV}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Export als CSV
        </button>
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
