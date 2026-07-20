// ABOUTME: Reusable full-viewport iframe for the hosted shared-object room.

export function ProjectPlaygroundFrame() {
  return (
    <iframe
      className="project-playground-frame"
      src="/playground"
      title="Building Benches for the Web shared playground"
      allow="clipboard-write"
    />
  );
}
