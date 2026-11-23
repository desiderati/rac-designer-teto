// Run in a browser with locator.evaluate(measureSpacing, contract).
export function measureSpacing(root, { width, gaps, firstLine = [], content = [], topSpaceUnits = null }) {
  const issues = [];
  const tolerance = 1;
  const frameWidth = root.ownerDocument.defaultView.innerWidth;
  const viewport = root.ownerDocument.documentElement;
  const rect = (element) => element.getBoundingClientRect();

  function check(label, actual, expected) {
    if (Math.abs(actual - expected) > tolerance) {
      issues.push(`${label}: expected ${expected}px, got ${actual}px`);
    }
  }

  function select(scope, selector) {
    const matches = scope.querySelectorAll(selector);
    if (matches.length !== 1 || rect(matches[0]).height <= 0 || rect(matches[0]).width <= 0) {
      issues.push(`expected one rendered element: ${selector}`);
      return null;
    }
    return matches[0];
  }

  function scopes(selector) {
    if (!selector) return [root];
    const matches = root.querySelectorAll(selector);
    if (!matches.length) issues.push(`missing spacing scope: ${selector}`);
    return matches;
  }

  if (frameWidth !== width) issues.push(`frame width: expected ${width}px, got ${frameWidth}px`);
  if (viewport.scrollWidth > viewport.clientWidth + tolerance ||
      root.scrollWidth > root.clientWidth + tolerance ||
      rect(root).left < -tolerance || rect(root).right > viewport.clientWidth + tolerance) {
    issues.push("horizontal overflow");
  }

  // Resolve the CSS token in the actual frame, including relative units.
  const ruler = root.ownerDocument.createElement("span");
  ruler.style.cssText = "position:absolute;visibility:hidden;block-size:var(--font-size-base)";
  root.append(ruler);
  const base = rect(ruler).height;
  ruler.remove();
  if (base <= 0) issues.push("missing positive --font-size-base");
  if (topSpaceUnits !== null) check("top spacing", rect(root).top, topSpaceUnits * base);

  for (const { label, scope, before, after, units, axis = "block" } of gaps) {
    for (const group of scopes(scope)) {
      const start = select(group, before);
      const end = select(group, after);
      if (!start || !end) continue;
      const horizontal = axis === "inline";
      const rtl = horizontal && getComputedStyle(group).direction === "rtl";
      const distance = horizontal
        ? rtl ? rect(start).left - rect(end).right : rect(end).left - rect(start).right
        : rect(end).top - rect(start).bottom;
      check(label, distance, units * base);
    }
  }

  for (const { scope, badge, heading } of firstLine) {
    for (const group of scopes(scope)) {
      const marker = select(group, badge);
      const title = select(group, heading);
      if (marker && title) check("badge alignment", rect(marker).top, rect(title).top);
    }
  }

  for (const selector of content) {
    for (const element of scopes(selector)) {
      const bounds = rect(element);
      if (bounds.width <= 0 || bounds.height <= 0 ||
          element.scrollWidth > element.clientWidth + tolerance ||
          element.scrollHeight > element.clientHeight + tolerance) {
        issues.push(`clipped content: ${selector}`);
      }
    }
  }
  return issues;
}
