const COERCE_STRATEGY = 'coerce';
const TERNARY_STRATEGY = 'ternary';
const DEFAULT_VALID_STRATEGIES = [TERNARY_STRATEGY, COERCE_STRATEGY];
const COERCE_VALID_LEFT_SIDE_EXPRESSIONS = new Set(['UnaryExpression', 'BinaryExpression', 'CallExpression']);
const TERNARY_INVALID_ALTERNATE_VALUES = new Set([undefined, null, false]);

function trimLeftNode(node) {
  if (node.type === 'UnaryExpression' && node.argument.type === 'UnaryExpression') {
    return trimLeftNode(node.argument.argument);
  }
  return node;
}

function isCoerceValidNestedLogicalExpression(node) {
  if (node.type === 'LogicalExpression') {
    return isCoerceValidNestedLogicalExpression(node.left) && isCoerceValidNestedLogicalExpression(node.right);
  }
  return COERCE_VALID_LEFT_SIDE_EXPRESSIONS.has(node.type);
}

function extractExpressionsBetweenLogicalAnds(node) {
  if (node.type !== 'LogicalExpression' || node.operator !== '&&') {
    return [node];
  }
  return [...extractExpressionsBetweenLogicalAnds(node.left), ...extractExpressionsBetweenLogicalAnds(node.right)];
}

function isParenthesized(sourceCode, node) {
  const previousToken = sourceCode.getTokenBefore(node);
  const nextToken = sourceCode.getTokenAfter(node);
  return previousToken?.value === '(' && nextToken?.value === ')';
}

function findVariable(sourceCode, node, name) {
  let scope = sourceCode.getScope(node);
  while (scope) {
    const variable = scope.set.get(name);
    if (variable) {
      return variable;
    }
    scope = scope.upper;
  }
  return undefined;
}

function isBooleanConstant(sourceCode, node) {
  if (node.type !== 'Identifier') {
    return false;
  }
  const variable = findVariable(sourceCode, node, node.name);
  return typeof variable?.defs[0]?.node.init?.value === 'boolean';
}

function isFalseConsequentTernary(node) {
  return node.parent?.type === 'ConditionalExpression' && node.parent.consequent.value === false;
}

function wrapIfParenthesized(sourceCode, node) {
  const text = sourceCode.getText(node);
  return isParenthesized(sourceCode, node) ? `(${text})` : text;
}

function fixWithCoerce(sourceCode, fixer, reportedNode, leftNode, rightNode) {
  const rightSideText = sourceCode.getText(rightNode);
  const coercedText = extractExpressionsBetweenLogicalAnds(leftNode)
    .map((node) => {
      const text = wrapIfParenthesized(sourceCode, node);
      if (isCoerceValidNestedLogicalExpression(node)) {
        return text;
      }
      return isFalseConsequentTernary(node) ? `!${text}` : `!!${text}`;
    })
    .join(' && ');

  if (isFalseConsequentTernary(rightNode)) {
    const ternary = rightNode.parent;
    const consequentText = ternary.consequent.raw || ternary.consequent.name;
    const alternateText = ternary.alternate.raw || ternary.alternate.name;
    if (ternary.test.type === 'LogicalExpression') {
      return fixer.replaceText(reportedNode, `${coercedText} ? ${consequentText} : ${alternateText}`);
    }
    return fixer.replaceText(reportedNode, `${coercedText} && ${alternateText}`);
  }

  if (rightNode.type === 'ConditionalExpression' || rightNode.type === 'LogicalExpression') {
    return fixer.replaceText(reportedNode, `${coercedText} && (${rightSideText})`);
  }

  if (rightNode.type === 'JSXElement') {
    const rightSideLines = rightSideText.split('\n');
    if (rightSideLines.length > 1) {
      const lastLineIndentation = rightSideLines.at(-1).search(/\S/);
      const contentIndentation = ' '.repeat(lastLineIndentation);
      const closingIndentation = ' '.repeat(lastLineIndentation - 2);
      return fixer.replaceText(
        reportedNode,
        `${coercedText} && (\n${contentIndentation}${rightSideText}\n${closingIndentation})`,
      );
    }
  }

  if (rightNode.type === 'Literal') {
    return null;
  }

  return fixer.replaceText(reportedNode, `${coercedText} && ${rightSideText}`);
}

function fixWithTernary(sourceCode, fixer, reportedNode, leftNode, rightNode) {
  const trimmedLeftNode = trimLeftNode(leftNode);
  const leftSideText = isParenthesized(sourceCode, leftNode)
    ? `(${sourceCode.getText(trimmedLeftNode)})`
    : sourceCode.getText(trimmedLeftNode);
  return fixer.replaceText(reportedNode, `${leftSideText} ? ${sourceCode.getText(rightNode)} : null`);
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow problematic leaked values from being rendered',
    },
    messages: {
      noPotentialLeakedRender:
        'Potential leaked value that might cause unintentionally rendered values or rendering crashes',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          validStrategies: {
            type: 'array',
            items: { enum: [TERNARY_STRATEGY, COERCE_STRATEGY] },
            uniqueItems: true,
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const sourceCode = context.sourceCode;
    const validStrategies = context.options[0]?.validStrategies ?? DEFAULT_VALID_STRATEGIES;
    const fixStrategy = validStrategies[0];
    const fix = fixStrategy === COERCE_STRATEGY ? fixWithCoerce : fixWithTernary;

    function report(node, leftNode, rightNode) {
      context.report({
        node,
        messageId: 'noPotentialLeakedRender',
        fix: (fixer) => fix(sourceCode, fixer, node, leftNode, rightNode),
      });
    }

    return {
      'JSXExpressionContainer > LogicalExpression[operator="&&"]'(node) {
        const leftSide = node.left;

        if (validStrategies.includes(COERCE_STRATEGY)) {
          if (isCoerceValidNestedLogicalExpression(leftSide) || isBooleanConstant(sourceCode, leftSide)) {
            return;
          }
        }

        if (leftSide.type === 'Literal' && leftSide.value === '') {
          return;
        }

        report(node, leftSide, node.right);
      },

      'JSXExpressionContainer > ConditionalExpression'(node) {
        if (validStrategies.includes(TERNARY_STRATEGY)) {
          return;
        }

        const isValidTernaryAlternate = !TERNARY_INVALID_ALTERNATE_VALUES.has(node.alternate.value);
        if (isValidTernaryAlternate || node.alternate.type === 'JSXElement') {
          return;
        }

        report(node, node.test, node.consequent);
      },
    };
  },
};
