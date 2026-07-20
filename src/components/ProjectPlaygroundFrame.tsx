// ABOUTME: Reusable full-viewport iframe for the hosted shared-object room.

export function ProjectPlaygroundFrame() {
  return (
    <iframe
      className="project-playground-frame"
      src="/playground"
      title="Benches for the Internet shared playground"
      allow="clipboard-write"
    />
  );
}
