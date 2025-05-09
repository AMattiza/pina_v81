import React from 'react';
import { ResponsiveContainer, LineChart, XAxis, Tooltip, Legend, Line } from 'recharts';

const LicenseChart = ({
  data, startYear, startMonth,
  dataKey, dataKey2, dataKey3, dataKey4,
  strokeColor, strokeColor2, strokeColor3, strokeColor4,
  name, name2, name3, name4
}) => (
  <ResponsiveContainer width="100%" height={400}>
    <LineChart data={(() => {
      const {
        months, newPartners, increaseInterval, increaseAmount,
        unitsPerDisplay, license1Gross, postcardCost, graphicShare,
        license2, license2Threshold, reorderRate, reorderCycle,
        costPrice, sellPrice, salesCost, logisticsCost
      } = data;

      const net1 = Math.max(license1Gross - postcardCost - graphicShare, 0);

      const newPartnersPerMonth = Array.from({ length: months }, (_, j) =>
        newPartners + (increaseInterval > 0 ? Math.floor(j / increaseInterval) * increaseAmount : 0)
      );

      return newPartnersPerMonth.map((cSize, i) => {
        const monthNum = i + 1;
        const yyyy = startYear + Math.floor((startMonth - 1 + i) / 12);
        const mm = ((startMonth - 1 + i) % 12) + 1;
        const monthLabel = String(mm).padStart(2, '0') + '/' + yyyy;

        const baseUnits = cSize * unitsPerDisplay;
        let reorderUnits = 0;
        newPartnersPerMonth.forEach((cs, j) => {
          const age = monthNum - (j + 1);
          if (reorderCycle > 0 && age >= reorderCycle && age % reorderCycle === 0) {
            reorderUnits += cs * (reorderRate / 100) * unitsPerDisplay;
          }
        });
        const totalUnits = baseUnits + reorderUnits;

        const bruttoRohertrag = (sellPrice - costPrice) * totalUnits;
        const vertriebsKosten = salesCost * totalUnits;
        const logistikKosten = logisticsCost * totalUnits;
        const deckungsbeitragII = bruttoRohertrag - vertriebsKosten - logistikKosten;
        const tier1 = net1 * totalUnits;
        const totalPartners = newPartnersPerMonth.slice(0, monthNum).reduce((a, b) => a + b, 0);
        const tier2 = totalPartners > license2Threshold ? license2 * totalUnits : 0;
        const rest = deckungsbeitragII - tier1 - tier2;

        return {
          month: monthNum,
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
      });
    })()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
      <XAxis dataKey="month" label={{ value: 'Monat', position: 'insideBottom', offset: -5 }} />
      <Tooltip />
      <Legend verticalAlign="top" />
      <Line type="monotone" dataKey="tier1" stroke={strokeColor} name={name} dot={false} strokeWidth={3} />
      <Line type="monotone" dataKey="tier2" stroke={strokeColor2} name={name2} dot={false} strokeWidth={3} />
      <Line type="monotone" dataKey="deckungsbeitragII" stroke={strokeColor3} name={name3} dot={false} strokeWidth={3} />
      <Line type="monotone" dataKey="restgewinn" stroke={strokeColor4} name={name4} dot={false} strokeWidth={3} />
    </LineChart>
  </ResponsiveContainer>
);

export default LicenseChart;
