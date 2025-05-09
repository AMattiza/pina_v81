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
    salesCost: 0,
    logisticsCost: 0,
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
    license2Threshold: 3,
    marginPerUnit: 6.0,
    deckungsbeitragPerUnit: 2.0
  });

  // Auto-update marginPerUnit & deckungsbeitragPerUnit
  useEffect(() => {
    const { sellPrice, costPrice, salesCost, logisticsCost } = data;
    const margin = parseFloat((sellPrice - costPrice).toFixed(2));
    const deck = parseFloat((margin - salesCost - logisticsCost).toFixed(2));
    setData(d => ({ ...d, marginPerUnit: margin, deckungsbeitragPerUnit: deck }));
  }, [data.sellPrice, data.costPrice, data.salesCost, data.logisticsCost]);

  const {
    months,
    startDate,
    costPrice,
    sellPrice,
    salesCost,
    logisticsCost,
    unitsPerDisplay,
    newPartners,
    increaseInterval,
    increaseAmount,
    reorderRate,
    reorderCycle,
    license1Gross,
    postcardCost,
    graphicShare,
    license2,
    license2Threshold,
    marginPerUnit,
    deckungsbeitragPerUnit
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

  // 2) KPI-Berechnungen (erstes Jahr Offset 0…11)
  const totalNew = newPartnersPerMonth.reduce((a, b) => a + b, 0);
  const reorders = Math.round(
    newPartnersPerMonth
      .slice(0, months - reorderCycle)
      .reduce((sum, c) => sum + c * (reorderRate / 100), 0)
  );
  let totalUnitsFirstYear = 0;
  newPartnersPerMonth.forEach(cohortSize => {
    let ve = unitsPerDisplay;
    for (let m = 1; m <= 11; m++) {
      if (reorderCycle > 0 && m % reorderCycle === 0) {
        ve += (reorderRate / 100) * unitsPerDisplay;
      }
    }
    totalUnitsFirstYear += cohortSize * ve;
  });
  const avgUnitsFirstYear = totalNew > 0 ? totalUnitsFirstYear / totalNew : 0;
  const avgRevenueFirstYear = avgUnitsFirstYear * sellPrice;

  // 3) Chart-Daten (zweites Jahr Offset 12…23)
  const chartData = newPartnersPerMonth.map((cSize, i) => {
    const yyyy = startYear + Math.floor((startMonth - 1 + i) / 12);
    const mm = ((startMonth - 1 + i) % 12) + 1;
    const monthLabel = `${String(mm).padStart(2,'0')}/${yyyy}`;

    const baseUnits = cSize * unitsPerDisplay;
    let reorderUnits = 0;
    for (let m = 1; m * reorderCycle <= 23; m++) {
      const offset = m * reorderCycle;
      if (offset >= 12 && offset <= 23) {
        reorderUnits += cSize * (reorderRate/100) * unitsPerDisplay;
      }
    }
    const totalUnits = baseUnits + reorderUnits;
    const bruttoRohertrag = (sellPrice - costPrice) * totalUnits;
    const vertriebsKosten = salesCost * totalUnits;
    const logistikKosten = logisticsCost * totalUnits;
    const deckungsbeitragII = bruttoRohertrag - vertriebsKosten - logistikKosten;
    const net1 = Math.max(license1Gross - postcardCost - graphicShare, 0);
    const tier1 = net1 * totalUnits;
    const tier2 = cSize > license2Threshold ? license2 * totalUnits : 0;
    const rest = deckungsbeitragII - tier1 - tier2;

    return {
      month: i + 1,
      monthLabel,
      newCustomers: cSize,
      reorderCustomers: Math.round(cSize * (reorderRate/100)),
      bruttoRohertrag: Number(bruttoRohertrag.toFixed(2)),
      vertriebsKosten: Number(vertriebsKosten.toFixed(2)),
      logistikKosten: Number(logistikKosten.toFixed(2)),
      deckungsbeitragII: Number(deckungsbeitragII.toFixed(2)),
      tier1: Number(tier1.toFixed(2)),
      tier2: Number(tier2.toFixed(2)),
      restgewinn: Number(rest.toFixed(2))
    };
  });

  // CSV-Export der Chart-Daten
  const handleExportCSV = () => {
    const headers = [
      'Monat',
      'MonatLabel',
      'Neukunden',
      'Nachbesteller',
      'BruttoRohertrag',
      'VertriebsKosten',
      'LogistikKosten',
      'DeckungsbeitragII',
      'Lizenz1',
      'Lizenz2',
      'Restgewinn'
    ];
    const rows = chartData.map(r =>
      [
        r.month,
        r.monthLabel,
        r.newCustomers,
        r.reorderCustomers,
        r.bruttoRohertrag,
        r.vertriebsKosten,
        r.logistikKosten,
        r.deckungsbeitragII,
        r.tier1,
        r.tier2,
        r.restgewinn
      ].join(';')
    );
    const csv = [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chart_data_${new Date().toISOString()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-semibold mb-6">Business Case Simulator</h1>

      {/* 1: Basisdaten & Produktkalkulation */}
      <CollapsibleSection title="Basisdaten & Produktkalkulation">
        <InputMask
          data={data}
          onChange={setData}
          sections={['Basisdaten','Produktkalkulation']}
        />
      </CollapsibleSection>

      {/* 2: Händlerwachstum & Bestellverhalten */}
      <CollapsibleSection title="Händlerwachstum & Bestellverhalten">
        <InputMask
          data={data}
          onChange={setData}
          sections={['Händlerwachstum','Bestellverhalten']}
        />
      </CollapsibleSection>

      {/* 3: Kostenplanung (Pina) */}
      <CollapsibleSection title="Kostenplanung (Pina)">
        <InputMask
          data={data}
          onChange={setData}
          sections={['Kostenplanung (Pina)']}
        />
      </CollapsibleSection>

      {/* 4: Lizenz 1 / Städteserie & Lizenz 2 / Website & Shop */}
      <CollapsibleSection title="Lizenz 1 & Lizenz 2 (C-Hub)">
        <InputMask
          data={data}
          onChange={setData}
          sections={['Lizenz 1 / Städteserie (C-Hub)','Lizenz 2 / Website & Shop (C-Hub)']}
        />
      </CollapsibleSection>

      {/* Übersicht: KPI-Widgets */}
      <CollapsibleSection title="Übersicht">
        <SummarySection
          totalNew={totalNew}
          reorders={reorders}
          avgUnits={avgUnitsFirstYear}
          avgRevenue={avgRevenueFirstYear}
          deckungsbeitragPerUnit={deckungsbeitragPerUnit}
          license1Gross={license1Gross}
          license2={license2}
        />
      </CollapsibleSection>

      {/* Chart & CSV */}
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
        <button
          onClick={handleExportCSV}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Chart-Daten als CSV exportieren
        </button>
      </CollapsibleSection>
    </div>
  );
}
