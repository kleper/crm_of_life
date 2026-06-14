"use client";

import { useState, useEffect } from "react";
import { RRule, Frequency, Weekday } from "rrule";
import { humanizeRRule } from "@/lib/recurrence";
import { Button } from "@/components/ui/Button";

interface RecurrenceBuilderProps {
  onRRuleChange: (rruleStr: string) => void;
  startDate: Date;
}

const DAYS = [
  { label: "L", value: RRule.MO },
  { label: "M", value: RRule.TU },
  { label: "X", value: RRule.WE },
  { label: "J", value: RRule.TH },
  { label: "V", value: RRule.FR },
  { label: "S", value: RRule.SA },
  { label: "D", value: RRule.SU },
];

export default function RecurrenceBuilder({ onRRuleChange, startDate }: RecurrenceBuilderProps) {
  const [freq, setFreq] = useState<Frequency>(RRule.WEEKLY);
  const [interval, setInterval] = useState(1);
  const [byweekday, setByweekday] = useState<Weekday[]>([]);
  const [untilType, setUntilType] = useState<"never" | "count" | "date">("never");
  const [count, setCount] = useState(10);
  const [untilDate, setUntilDate] = useState("");

  useEffect(() => {
    try {
      const options: any = {
        freq,
        interval,
        dtstart: startDate,
      };

      if (freq === RRule.WEEKLY && byweekday.length > 0) {
        options.byweekday = byweekday;
      }

      if (untilType === "count") {
        options.count = count;
      } else if (untilType === "date" && untilDate) {
        options.until = new Date(untilDate);
      }

      const rrule = new RRule(options);
      onRRuleChange(rrule.toString());
    } catch (e) {
      // ignore
    }
  }, [freq, interval, byweekday, untilType, count, untilDate, startDate, onRRuleChange]);

  const toggleDay = (day: Weekday) => {
    setByweekday(prev => {
      if (prev.includes(day)) return prev.filter(d => d !== day);
      return [...prev, day];
    });
  };

  const generatedRRuleStr = (() => {
    try {
      const options: any = { freq, interval, dtstart: startDate };
      if (freq === RRule.WEEKLY && byweekday.length > 0) options.byweekday = byweekday;
      if (untilType === "count") options.count = count;
      if (untilType === "date" && untilDate) options.until = new Date(untilDate);
      return new RRule(options).toString();
    } catch (e) {
      return "";
    }
  })();

  return (
    <div className="bg-slate-50 border border-slate-200 p-4 space-y-4 rounded-none mt-4">
      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Configurar Repetición</h4>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Frecuencia</label>
          <select 
            value={freq} 
            onChange={(e) => setFreq(Number(e.target.value))}
            className="w-full text-sm p-2 border border-slate-200 rounded-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={RRule.DAILY}>Diaria</option>
            <option value={RRule.WEEKLY}>Semanal</option>
            <option value={RRule.MONTHLY}>Mensual</option>
            <option value={RRule.YEARLY}>Anual</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Repetir cada</label>
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              min={1} 
              value={interval} 
              onChange={(e) => setInterval(Number(e.target.value))}
              className="w-16 text-sm p-2 border border-slate-200 rounded-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-sm text-slate-600">
              {freq === RRule.DAILY ? (interval === 1 ? 'día' : 'días') :
               freq === RRule.WEEKLY ? (interval === 1 ? 'semana' : 'semanas') :
               freq === RRule.MONTHLY ? (interval === 1 ? 'mes' : 'meses') :
               (interval === 1 ? 'año' : 'años')}
            </span>
          </div>
        </div>
      </div>

      {freq === RRule.WEEKLY && (
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-2">Días de la semana</label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map(d => (
              <button
                key={d.label}
                type="button"
                onClick={() => toggleDay(d.value)}
                className={`w-8 h-8 flex items-center justify-center text-xs font-bold transition-colors rounded-none border ${
                  byweekday.includes(d.value) 
                    ? 'bg-indigo-600 border-indigo-600 text-white' 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-400'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-500 mb-2">Finaliza</label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input 
              type="radio" 
              name="untilType" 
              checked={untilType === "never"} 
              onChange={() => setUntilType("never")} 
            />
            Nunca
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input 
              type="radio" 
              name="untilType" 
              checked={untilType === "count"} 
              onChange={() => setUntilType("count")} 
            />
            Después de 
            <input 
              type="number" 
              min={1} 
              value={count} 
              onChange={(e) => setCount(Number(e.target.value))}
              disabled={untilType !== "count"}
              className="w-16 p-1 border border-slate-200 rounded-none disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            ocurrencias
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input 
              type="radio" 
              name="untilType" 
              checked={untilType === "date"} 
              onChange={() => setUntilType("date")} 
            />
            El día
            <input 
              type="date" 
              value={untilDate} 
              onChange={(e) => setUntilDate(e.target.value)}
              disabled={untilType !== "date"}
              className="p-1 border border-slate-200 rounded-none disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>
        </div>
      </div>

      <div className="bg-indigo-50 p-3 border border-indigo-100">
        <div className="text-xs font-bold text-indigo-900 mb-1">Resumen de repetición:</div>
        <div className="text-sm text-indigo-700 font-medium">
          {generatedRRuleStr ? humanizeRRule(generatedRRuleStr) : "Configurando..."}
        </div>
      </div>
    </div>
  );
}
