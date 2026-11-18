const isVisible = true;

export const Component = ({ count, title, numberA, numberB }) => (
  <div>
    {count && title}
    {(numberA || numberB) && <span>{title}</span>}
    {!!count && title}
    {isVisible && title}
    {count > 0 && title}
  </div>
);
