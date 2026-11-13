import { builtinRules } from 'eslint/use-at-your-own-risk';

const ruleNames = ['require-atomic-updates'];

export default {
  meta: { name: 'eslint-core' },
  rules: Object.fromEntries(ruleNames.map((ruleName) => [ruleName, builtinRules.get(ruleName)])),
};
