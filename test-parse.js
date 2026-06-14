const { RRule } = require('rrule');

const rruleString = "DTSTART:20260623T000000Z\nRRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR";
const options = RRule.parseString(rruleString);
options.dtstart = new Date('2026-06-23T00:00:00Z');
const rule = new RRule(options);
console.log(rule.between(new Date('2026-06-23T00:00:00Z'), new Date('2026-06-30T00:00:00Z'), true));
