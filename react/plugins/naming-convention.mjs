import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin';

const originalRule = typescriptEslintPlugin.rules['naming-convention'];

const parserServices = {
  esTreeNodeToTSNodeMap: new WeakMap(),
  tsNodeToESTreeNodeMap: new WeakMap(),
  program: null,
};

export default {
  meta: { name: 'sandokan' },
  rules: {
    'naming-convention': {
      meta: originalRule.meta,
      create(context) {
        const sourceCode = Object.create(context.sourceCode, { parserServices: { value: parserServices } });
        return originalRule.create(Object.create(context, { sourceCode: { value: sourceCode } }));
      },
    },
  },
};
