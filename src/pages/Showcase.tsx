// ABOUTME: Showcase page hosting the domain-shared student project collection.
// ABOUTME: Displays the submission form only when its query flag is present.

import { useSearchParams } from 'react-router';
import { ProjectSubmissions } from '../components/ProjectSubmissions';

export default function Showcase() {
  const [searchParams] = useSearchParams();

  return (
    <main className="showcase-page min-h-screen">
      <ProjectSubmissions
        adminMode={searchParams.has('admin')}
        showSubmissionForm={searchParams.has('submitShowcase')}
        variant="showcase"
      />
    </main>
  );
}
