// ABOUTME: Showcase page hosting the domain-shared student project collection.
// ABOUTME: Students can submit projects here or from the bottom of week pages.

import { ProjectSubmissions } from '../components/ProjectSubmissions';

export default function Showcase() {
  return (
    <main className="showcase-page min-h-screen">
      <ProjectSubmissions variant="showcase" />
    </main>
  );
}
