// ABOUTME: Immersive route rendered inside the Showcase and external ring widget.

import { useLocation } from 'react-router';
import { ProjectPlayground } from '../components/ProjectPlayground';

export default function Playground() {
  const { search } = useLocation();
  const demo = new URLSearchParams(search).get('demo') === 'true';

  return (
    <main className="project-playground-page">
      <ProjectPlayground demo={demo} />
    </main>
  );
}
