import React from 'react';

export default function InputMask({ data, onChange }) {
  const handleChange = (name, value) => {
    let v;
    if (name === 'startDate') v = value;
    else v = parseFloat(value) || 0;
    onChange({ ...data, [name]: v });
  };

  const fields = [
    { section: 'Basisdaten', items: [
        { label:'Planungszeitraum (Monate)', name:'months', type:'slider', min:12,max:120,step:12 },
        { label:'Startdatum der Planung', name:'startDate', type:'month' },
      ] },
    { section: 'Produktkalkulation', items: [
        { label:'Einkaufspreis Pina (€ je VE)', name:'costPrice', type:'slider', min:0,max:20,step:0.1 },
        { label:'Verkaufspreis Pina (€ je VE)', name:'sellPrice', type:'slider', min:0,max:20,step:0.1 },
        { label:'UVP (€ je VE)', name:'uvp', type:'slider', min:0,max:20,step:0.1 },
        { label:'Rohertrag Pina pro VE (€)', name:'marginPerUnit', type:'readOnly' },
      ] },
    { section:'Händlerwachstum', items: [
        { label:'Start-Neukunden/Monat', name:'newPartners', type:'slider', min:0,max:20,step:1 },
        { label:'Erhöhungszyklus (Monate)', name:'increaseInterval', type:'slider', min:1,max:24,step:1 },
        { label:'Erhöhung pro Zyklus (Neukunden)', name:'increaseAmount', type:'slider', min:0,max:20,step:1 },
      ] },
    { section:'Bestellverhalten', items: [
        { label:'Nachbesteller-Quote (%)', name:'reorderRate', type:'slider', min:0,max:100,step:5 },
        { label:'Nachbestell-Rhythmus (Monate)', name:'reorderCycle', type:'slider', min:1,max:12,step:1 },
      ] },
    { section:'Kostenplanung (Pina)', items: [
        { label:'Vertriebskosten je VE (€)', name:'salesCost', type:'slider', min:0,max:5,step:0.1 },
        { label:'Logistikkosten je VE (€)', name:'logisticsCost', type:'slider', min:0,max:5,step:0.1 },
        { label:'Deckungsbeitrag II pro VE (€)', name:'deckungsbeitragPerUnit', type:'readOnly' },
      ] },
    { section:'Lizenz 1 / Städteserie (C-Hub)', items: [
        { label:'Lizenz 1 Einheit (€)', name:'license1Gross', type:'slider', min:0,max:5,step:0.01 },
        { label:'Postkartendruck €/Stück', name:'postcardCost', type:'slider', min:0,max:0.25,step:0.01 },
        { label:'Grafik-Kosten/Einheit (€)', name:'graphicShare', type:'slider', min:0,max:1,step:0.01 },
      ] },
    { section:'Lizenz 2 / Website & Shop (C-Hub)', items: [
        { label:'Lizenz 2 €/Einheit', name:'license2', type:'slider', min:0,max:5,step:0.01 },
        { label:'Schwelle Lizenz 2 (Händler)', name:'license2Threshold', type:'slider', min:0,max:200,step:1 },
      ] },
  ];

  return ( <div className="space-y-6">
    {fields.map((g,i)=><fieldset key={i} className="p-4 border rounded-2xl bg-gray-50">
      <legend className="text-lg font-medium mb-2">{g.section}</legend>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {g.items.map(item=>(
          <div key={item.name} className="flex items-center space-x-4">
            <label className="w-1/3 text-sm text-gray-700">{item.label}</label>
            {item.type==='month'?(
              <input type="month" value={data[item.name]} onChange={e=>handleChange(item.name,e.target.value)} className="flex-1 p-1"/>
            ): item.type==='readOnly' ?(
              <input type="number" readOnly value={data[item.name]} className="flex-1 p-1 bg-gray-100"/>
            ):(
              <div className="flex-1">
                <input type="range" min={item.min} max={item.max} step={item.step} value={data[item.name]} onChange={e=>handleChange(item.name,e.target.value)} className="w-full"/>
                <div className="text-sm text-right">{data[item.name]}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </fieldset>)}
  </div> );
}