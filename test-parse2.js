const { RRule } = require('rrule');
const rule = new RRule({
  freq: RRule.WEEKLY,
  byweekday: [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR],
  dtstart: new Date('2026-06-21T00:00:00Z') // A Sunday
});
console.log(rule.between(new Date('2026-06-21T00:00:00Z'), new Date('2026-06-28T00:00:00Z'), true));
