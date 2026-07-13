// ABOUTME: Showcase page hosting the domain-shared student project collection.
// ABOUTME: Students can submit projects here or from the bottom of week pages.

import { HomeBeaconOrb } from '../components/HomeBeaconOrb';
import { ProjectSubmissions } from '../components/ProjectSubmissions';

export default function Showcase() {
  return (
    <div className="showcase-page min-h-screen px-6 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-6xl">
        <p className="showcase-page__eyebrow">Built by the class</p>
        <div className="relative">
          <HomeBeaconOrb />
          <h1 className="showcase-page__title">Showcase</h1>
        </div>
        <p className="showcase-page__intro">
          Visit the communal spaces, experiments, and web benches made
          throughout the class.
        </p>
        <ProjectSubmissions variant="showcase" />
      </div>
    </div>
  );
}
