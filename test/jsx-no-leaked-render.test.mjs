import { RuleTester } from 'eslint';
import { after, describe, it } from 'node:test';

import rule from '../react/plugins/jsx-no-leaked-render.mjs';

RuleTester.afterAll = after;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

const coerce = [{ validStrategies: ['coerce'] }];
const ternary = [{ validStrategies: ['ternary'] }];
const coerceAndTernary = [{ validStrategies: ['coerce', 'ternary'] }];

function component(parameters, expression) {
  return `
    const Component = (${parameters}) => {
      return <div>{${expression}}</div>
    }
  `;
}

function invalid(parameters, expression, fixedExpression, options = []) {
  return {
    code: component(parameters, expression),
    output: component(parameters, fixedExpression),
    options,
    errors: [{ messageId: 'noPotentialLeakedRender', line: 3, column: 20 }],
  };
}

ruleTester.run('jsx-no-leaked-render', rule, {
  valid: [
    component('', 'customTitle || defaultTitle'),
    component('{ elements }', 'elements'),
    component('{ count }', "!count && 'No results found'"),
    component('{ elements }', '!!elements.length && <List elements={elements}/>'),
    component('{ elements }', 'Boolean(elements.length) && <List elements={elements}/>'),
    component('{ elements }', 'elements.length > 0 && <List elements={elements}/>'),
    component('{ elements }', 'elements.length ? <List elements={elements}/> : null'),
    component('{ elements, count }', 'count ? <List elements={elements}/> : null'),
    component('{ title }', "'' && title"),
    { code: component('{ elements, count }', 'count ? <List elements={elements}/> : null'), options: ternary },
    { code: component('{ elements, count }', '!!count && <List elements={elements}/>'), options: coerce },
    { code: component('{ elements, count }', 'count ? <List elements={elements}/> : null'), options: coerceAndTernary },
    { code: component('{ elements, count }', '!!count && <List elements={elements}/>'), options: coerceAndTernary },
    {
      code: `
        const Component = () => {
          return (
            <div>
              <div> {direction ? (direction === "down" ? "▼" : "▲") : ""} </div>
              <div>{ containerName.length > 0 ? "Loading several stuff" : "Loading" }</div>
            </div>
          )
        }
      `,
      options: coerce,
    },
    {
      code: component('', 'direction ? (direction === "down" ? "▼" : "▲") : ""'),
      options: coerceAndTernary,
    },
    {
      code: `
        const Component = ({ direction }) => {
          return (
            <div>
              <div>{!!direction && direction === "down" && "▼"}</div>
              <div>{direction === "down" && !!direction && "▼"}</div>
              <div>{direction === "down" || !!direction && "▼"}</div>
              <div>{(!display || display === DISPLAY.WELCOME) && <span>foo</span>}</div>
            </div>
          )
        }
      `,
      options: coerce,
    },
    { code: component('{ elements, count }', 'count ? <List elements={elements}/> : <EmptyList />'), options: coerceAndTernary },
    { code: component('{ elements, count }', 'count ? <List elements={elements}/> : <EmptyList />'), options: coerce },
    {
      code: `
        const isOpen = true;
        const Component = () => <Popover open={isOpen && items.length > 0} />
      `,
      options: coerce,
    },
    {
      code: `
        const isOpen = false;
        const Component = () => <Popover open={isOpen && items.length > 0} />
      `,
      options: coerce,
    },
    {
      code: `
        const Component = () => {
          const isOpen = true;
          return <div>{isOpen && <Popover />}</div>
        }
      `,
    },
    component('{ count }', 'count > 0 && <span>{count}</span>'),
  ],

  invalid: [
    {
      code: `
        const Example = () => (
          <>
            {0 && <Something/>}
            {'' && <Something/>}
            {NaN && <Something/>}
          </>
        )
      `,
      output: `
        const Example = () => (
          <>
            {0 ? <Something/> : null}
            {'' && <Something/>}
            {NaN ? <Something/> : null}
          </>
        )
      `,
      errors: [
        { messageId: 'noPotentialLeakedRender', line: 4, column: 14 },
        { messageId: 'noPotentialLeakedRender', line: 6, column: 14 },
      ],
    },

    invalid('{ count, title }', 'count && title', 'count ? title : null'),
    invalid(
      '{ count }',
      'count && <span>There are {count} results</span>',
      'count ? <span>There are {count} results</span> : null',
    ),
    invalid(
      '{ elements }',
      'elements.length && <List elements={elements}/>',
      'elements.length ? <List elements={elements}/> : null',
    ),
    invalid(
      '{ nestedCollection }',
      'nestedCollection.elements.length && <List elements={nestedCollection.elements}/>',
      'nestedCollection.elements.length ? <List elements={nestedCollection.elements}/> : null',
    ),
    invalid('{ elements }', 'elements[0] && <List elements={elements}/>', 'elements[0] ? <List elements={elements}/> : null'),
    invalid(
      '{ numberA, numberB }',
      '(numberA || numberB) && <Results>{numberA+numberB}</Results>',
      '(numberA || numberB) ? <Results>{numberA+numberB}</Results> : null',
    ),
    invalid(
      '{ numberA, numberB }',
      '(numberA || numberB) && <Results>{numberA+numberB}</Results>',
      '!!(numberA || numberB) && <Results>{numberA+numberB}</Results>',
      coerceAndTernary,
    ),

    invalid('{ count, title }', 'count && title', 'count ? title : null', ternary),
    invalid(
      '{ count }',
      'count && <span>There are {count} results</span>',
      'count ? <span>There are {count} results</span> : null',
      ternary,
    ),
    invalid(
      '{ elements }',
      'elements.length && <List elements={elements}/>',
      'elements.length ? <List elements={elements}/> : null',
      ternary,
    ),
    invalid(
      '{ nestedCollection }',
      'nestedCollection.elements.length && <List elements={nestedCollection.elements}/>',
      'nestedCollection.elements.length ? <List elements={nestedCollection.elements}/> : null',
      ternary,
    ),
    invalid(
      '{ elements }',
      'elements[0] && <List elements={elements}/>',
      'elements[0] ? <List elements={elements}/> : null',
      ternary,
    ),
    invalid(
      '{ numberA, numberB }',
      '(numberA || numberB) && <Results>{numberA+numberB}</Results>',
      '(numberA || numberB) ? <Results>{numberA+numberB}</Results> : null',
      ternary,
    ),
    invalid('{ someCondition, title }', '!someCondition && title', '!someCondition ? title : null', ternary),
    invalid('{ count, title }', '!!count && title', 'count ? title : null', ternary),
    invalid('{ count, title }', 'count > 0 && title', 'count > 0 ? title : null', ternary),
    invalid('{ count, title }', '0 != count && title', '0 != count ? title : null', ternary),
    invalid('{ count, total, title }', 'count < total && title', 'count < total ? title : null', ternary),
    invalid(
      '{ count, title, somethingElse }',
      '!!(count && somethingElse) && title',
      'count && somethingElse ? title : null',
      ternary,
    ),

    invalid('{ count, title }', 'count && title', '!!count && title', coerce),
    invalid(
      '{ count }',
      'count && <span>There are {count} results</span>',
      '!!count && <span>There are {count} results</span>',
      coerce,
    ),
    invalid(
      '{ elements }',
      'elements.length && <List elements={elements}/>',
      '!!elements.length && <List elements={elements}/>',
      coerce,
    ),
    invalid(
      '{ nestedCollection }',
      'nestedCollection.elements.length && <List elements={nestedCollection.elements}/>',
      '!!nestedCollection.elements.length && <List elements={nestedCollection.elements}/>',
      coerce,
    ),
    invalid('{ elements }', 'elements[0] && <List elements={elements}/>', '!!elements[0] && <List elements={elements}/>', coerce),
    invalid(
      '{ numberA, numberB }',
      '(numberA || numberB) && <Results>{numberA+numberB}</Results>',
      '!!(numberA || numberB) && <Results>{numberA+numberB}</Results>',
      coerce,
    ),
    invalid(
      '{ connection, hasError, hasErrorUpdate }',
      'connection && (hasError || hasErrorUpdate)',
      '!!connection && (hasError || hasErrorUpdate)',
      coerce,
    ),
    invalid('{ count, title }', 'count ? title : null', '!!count && title', coerce),
    invalid('{ count, title }', '!count ? title : null', '!count && title', coerce),
    invalid('{ count, somethingElse, title }', 'count && somethingElse ? title : null', '!!count && !!somethingElse && title', coerce),
    invalid(
      '{ items, somethingElse, title }',
      'items.length > 0 && somethingElse && title',
      'items.length > 0 && !!somethingElse && title',
      coerce,
    ),
    invalid('{ title }', 'title ? title : undefined', '!!title && title', coerce),
    invalid(
      '{ maybeObject, isFoo }',
      'maybeObject && (isFoo ? <Aaa /> : <Bbb />)',
      '!!maybeObject && (isFoo ? <Aaa /> : <Bbb />)',
      coerce,
    ),

    {
      code: `
        const MyComponent = () => {
          const items = []
          const breakpoint = { phones: true }

          return <div>{items.length > 0 && breakpoint.phones && <span />}</div>
        }
      `,
      output: `
        const MyComponent = () => {
          const items = []
          const breakpoint = { phones: true }

          return <div>{items.length > 0 && !!breakpoint.phones && <span />}</div>
        }
      `,
      options: coerceAndTernary,
      errors: [{ messageId: 'noPotentialLeakedRender', line: 6, column: 24 }],
    },
    {
      code: `
        const MyComponent = () => <Something checked={isIndeterminate ? false : isChecked} />
      `,
      output: `
        const MyComponent = () => <Something checked={!isIndeterminate && isChecked} />
      `,
      options: coerce,
      errors: [{ messageId: 'noPotentialLeakedRender', line: 2, column: 55 }],
    },
    {
      code: `
        const MyComponent = () => <Something checked={cond && isIndeterminate ? false : isChecked} />
      `,
      output: `
        const MyComponent = () => <Something checked={!!cond && !!isIndeterminate ? false : isChecked} />
      `,
      options: coerce,
      errors: [{ messageId: 'noPotentialLeakedRender', line: 2, column: 55 }],
    },
    {
      code: `
        const MyComponent = () => (
          <>
            {someCondition && (
              <div>
                <p>hello</p>
              </div>
            )}
          </>
        )
      `,
      output: `
        const MyComponent = () => (
          <>
            {!!someCondition && (
              <div>
                <p>hello</p>
              </div>
            )}
          </>
        )
      `,
      options: coerceAndTernary,
      errors: [{ messageId: 'noPotentialLeakedRender', line: 4, column: 14 }],
    },
    {
      code: `
        const MyComponent = () => (
          <>
            {someCondition && (
              <SomeComponent
                prop1={val1}
                prop2={val2}
              />
            )}
          </>
        )
      `,
      output: `
        const MyComponent = () => (
          <>
            {!!someCondition && (
              <SomeComponent
                prop1={val1}
                prop2={val2}
              />
            )}
          </>
        )
      `,
      options: coerceAndTernary,
      errors: [{ messageId: 'noPotentialLeakedRender', line: 4, column: 14 }],
    },
    {
      code: `
        const isOpen = 0;
        const Component = () => <Popover open={isOpen && items.length > 0} />
      `,
      output: `
        const isOpen = 0;
        const Component = () => <Popover open={!!isOpen && items.length > 0} />
      `,
      options: coerce,
      errors: [{ messageId: 'noPotentialLeakedRender', line: 3, column: 48 }],
    },
    {
      code: `
        const Component = () => {
          let isOpen;
          return <div>{isOpen && <Popover />}</div>
        }
      `,
      output: `
        const Component = () => {
          let isOpen;
          return <div>{isOpen ? <Popover /> : null}</div>
        }
      `,
      errors: [{ messageId: 'noPotentialLeakedRender', line: 4, column: 24 }],
    },
  ],
});
