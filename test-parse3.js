const { RRule } = require('rrule');

const rruleString = "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR";
const options = RRule.parseString(rruleString);
console.log("Options from parseString:", options);

options.dtstart = new Date('2026-06-21T00:00:00Z');
const rule = new RRule(options);
console.log("String generated:", rule.toString());
console.log(rule.between(new Date('2026-06-21T00:00:00Z'), new Date('2026-06-28T00:00:00Z'), true));
