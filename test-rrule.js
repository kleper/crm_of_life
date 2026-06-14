const { RRule } = require('rrule');
const rule = new RRule({
  freq: RRule.WEEKLY,
  byweekday: [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR],
  dtstart: new Date('2026-06-23T00:00:00Z') // A Sunday
});
console.log("String:", rule.toString());
console.log("Between:", rule.between(new Date('2026-06-23T00:00:00Z'), new Date('2026-06-30T00:00:00Z'), true));
