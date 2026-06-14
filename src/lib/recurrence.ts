import { RRule, rrulestr } from "rrule";
import { RecurringTaskTemplate } from "@prisma/client";

export function parseRRule(rruleString: string, startDate: Date): RRule {
  const options = RRule.parseString(rruleString);
  options.dtstart = startDate;
  return new RRule(options);
}

export function getOccurrencesInRange(template: RecurringTaskTemplate, fromDate: Date, toDate: Date): Date[] {
  const rrule = parseRRule(template.rrule, template.startDate);
  
  // RRule.between includes boundaries if inc=true
  let occurrences = rrule.between(fromDate, toDate, true);

  // Filter out if after endDate or exceeds maxOccurrences
  if (template.endDate) {
    occurrences = occurrences.filter(date => date <= template.endDate!);
  }

  // maxOccurrences is usually handled natively if it was serialized into the rrule,
  // but if we need to enforce it manually we can't easily without generating ALL from dtstart.
  // Assuming the rrule string already contains COUNT=N if it was specified, RRule handles it.

  return occurrences;
}

const dayNames = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

export function humanizeRRule(rruleString: string): string {
  try {
    const rrule = RRule.parseString(rruleString);
    const freq = rrule.freq;
    const interval = rrule.interval || 1;
    
    let text = "";

    if (freq === RRule.DAILY) {
      text = interval === 1 ? "Cada día" : `Cada ${interval} días`;
    } else if (freq === RRule.WEEKLY) {
      text = interval === 1 ? "Cada semana" : `Cada ${interval} semanas`;
      const byweekday = rrule.byweekday as any;
      if (byweekday && Array.isArray(byweekday) && byweekday.length > 0) {
        // RRule days: 0=MO, 1=TU, ..., 6=SU
        const days = byweekday.map((d: any) => dayNames[typeof d === 'number' ? d : d.weekday]);
        if (days.length === 5 && !days.includes("sábado") && !days.includes("domingo")) {
          text += ", de lunes a viernes";
        } else if (days.length === 2 && days.includes("sábado") && days.includes("domingo")) {
          text += ", los fines de semana";
        } else {
          text += ", los " + days.join(", ");
        }
      }
    } else if (freq === RRule.MONTHLY) {
      text = interval === 1 ? "Cada mes" : `Cada ${interval} meses`;
      const bymonthday = rrule.bymonthday as any;
      if (bymonthday && Array.isArray(bymonthday) && bymonthday.length > 0) {
        text += `, el día ${bymonthday[0]}`;
      }
    } else if (freq === RRule.YEARLY) {
      text = interval === 1 ? "Cada año" : `Cada ${interval} años`;
    }

    if (rrule.until) {
      text += ` hasta el ${rrule.until.toLocaleDateString()}`;
    } else if (rrule.count) {
      text += ` (${rrule.count} veces)`;
    }

    return text;
  } catch (e) {
    return "Regla de repetición personalizada";
  }
}
