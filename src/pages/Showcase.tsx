// ABOUTME: Showcase page hosting the domain-shared student project collection.
// ABOUTME: Students can submit projects here or from the bottom of week pages.

import { useSearchParams } from 'react-router';
import { ProjectSubmissions } from '../components/ProjectSubmissions';

export default function Showcase() {
  const [searchParams] = useSearchParams();

  return (
    <main className="showcase-page min-h-screen">
      <ProjectSubmissions
        adminMode={searchParams.has('admin')}
        variant="showcase"
      />
    </main>
  );
}
