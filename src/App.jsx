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
    license2Threshold: 3
  });

  // Aktualisiere marginPerUnit & deckungsbeitragPerUnit für Summary, bleibt aus Mask automatisch
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
    license2
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

  // 2) Chart-Daten generieren (IDENTISCH zu LicenseChart.jsx)
  const chartData = newPartnersPerMonth.map((cSize, i) => {
    const yyyy = startYear + Math.floor((startMonth - 1 + i) / 12);
    const mm = ((startMonth - 1 + i) % 12) + 1;
    const monthLabel = String(mm).padStart(2, '0') + '/' + yyyy;

    // Basis und Nachbesteller-Einheiten
    const baseUnits = cSize * unitsPerDisplay;
    let reorderUnits = 0;
    // berechne alle Reorders im 120-Monats-Zeitraum,
    // aber Chart zeigt nur Offset <= months, hier relevant für 2. Jahr etc.
    for (let k = 1; k * reorderCycle <= months; k++) {
      const offset = k * reorderCycle;
      if (offset <= i) {
        reorderUnits += newPartnersPerMonth[i - offset] * (reorderRate / 100) * unitsPerDisplay;
      }
    }
    // Für Einfachheit und Entsprechung zur bisherigen Logik: 
    // wir zählen pro Kohorte nur den eigenen Nachbesteller-Anteil:
    const ownReorderUnits = cSize * (reorderRate / 100) * unitsPerDisplay * 
      Math.floor((i + 1) / reorderCycle);

    // aber genauer: wie bisher in LicenseChart: 
    // wir summieren den Anteil der **dieser** Kohorte:
    const unitsThisCohort = (() => {
      const net1 = Math.max(license1Gross - postcardCost - graphicShare, 0);
      // Summen im Chart-Original:
      // bruttoRohertrag:
      const totalUnits = baseUnits + ownReorderUnits;
      const bruttoRohertrag = (sellPrice - costPrice) * totalUnits;
      const vertriebsKosten = salesCost * totalUnits;
      const logistikKosten = logisticsCost * totalUnits;
      const deckungsbeitragII = bruttoRohertrag - vertriebsKosten - logistikKosten;
      const tier1 = net1 * totalUnits;
      const tier2 = (i + 1 > data.license2Threshold)
        ? license2 * totalUnits
        : 0;
      const rest = deckungsbeitragII - tier1 - tier2;
      return {
        month: i + 1,
        monthLabel,
        newCustomers: cSize,
        reorderCustomers: Math.round(cSize * (reorderRate / 100)),
        bruttoRohertrag: Number(bruttoRohertrag.toFixed(2)),
        vertriebsKosten: Number(vertriebsKosten.toFixed(2)),
        logistikKosten: Number(logistikKosten.toFixed(2)),
        deckungsbeitragII: Number(deckungsbeitragII.toFixed(2)),
        tier1: Number(tier1.toFixed(2)),
        tier2: Number(tier2.toFixed(2)),
        restgewinn: Number(rest.toFixed(2))
      };
    })();
    return unitsThisCohort;
  });

  // 3) Summary-Werte (2. Jahr) bleiben unverändert …
  const totalUnitsSecondYearAllCustomers = chartData
    .filter((_, idx) => idx + 1 >= 13 && idx + 1 <= 24)
    .reduce((sum, row) => sum + row.bruttoRohertrag, 0); // oder deckungsbeitrag? hier einfach Rohertrag
  const avgUnitsSecondYear =
    months >= 24
      ? chartData
          .filter((_, idx) => idx + 1 >= 13 && idx + 1 <= 24)
          .reduce((sum, row) => sum + row.tier1 + row.tier2 + row.deckungsbeitragII + row.restgewinn, 0) /
        (newPartnersPerMonth.reduce((a, b) => a + b, 0))
      : 0;
  const avgRevenueSecondYear = avgUnitsSecondYear * sellPrice;

  // CSV-Export der Chart-Daten
  const handleExportCSV = () => {
    const headers = [
      'Monat',
      'MonatLabel',
      'Neukunden',
      'Nachbesteller',
      'Brutto Rohertrag',
      'VertriebsKosten',
      'LogistikKosten',
      'Deckungsbeitrag II',
      'Lizenz1 Erlös',
      'Lizenz2 Erlös',
      'Restgewinn'
    ];
    const rows = chartData.map(row => [
      row.month,
      row.monthLabel,
      row.newCustomers,
      row.reorderCustomers,
      row.bruttoRohertrag.toFixed(2),
      row.vertriebsKosten.toFixed(2),
      row.logistikKosten.toFixed(2),
      row.deckungsbeitragII.toFixed(2),
      row.tier1.toFixed(2),
      row.tier2.toFixed(2),
      row.restgewinn.toFixed(2)
    ].join(';'));

    const csvContent = [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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

      <CollapsibleSection title="Basisdaten">
        <InputMask data={data} onChange={setData} />
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
