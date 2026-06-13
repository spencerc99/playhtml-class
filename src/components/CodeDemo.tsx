// ABOUTME: Pairs a code snippet with a live demo that floats into the right
// ABOUTME: margin beside it on wide screens and stacks below on narrow ones.

import type { ReactNode } from 'react';

interface CodeDemoProps {
  demo: ReactNode;
  children: ReactNode;
}

export function CodeDemo({ demo, children }: CodeDemoProps) {
  return (
    <div className="code-demo">
      {children}
      <div className="code-demo__live">{demo}</div>
    </div>
  );
}
