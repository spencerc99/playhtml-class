// ABOUTME: Immersive route rendered inside the Showcase and external ring widget.

import { useLocation } from 'react-router';
import { ProjectPlayground } from '../components/ProjectPlayground';

export default function Playground() {
  const { search } = useLocation();
  const parameters = new URLSearchParams(search);
  const demo = parameters.get('demo') === 'true';
  const embedded = window.self !== window.top;

  return (
    <main className="project-playground-page">
      <ProjectPlayground demo={demo} embedded={embedded} />
    </main>
  );
}
