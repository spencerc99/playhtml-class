// ABOUTME: Showcase page displaying all student projects as draggable cards.
// ABOUTME: Projects accumulate here over the course of the class.

export default function Showcase() {
  return (
    <div className="min-h-screen px-8 py-12">
      <h1 className="mb-8 text-4xl font-extrabold uppercase text-[#e00000]">Showcase</h1>
      <p className="mb-8 text-neutral-500 dark:text-neutral-400">
        Student projects will appear here as they are submitted throughout the class.
      </p>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
        {/* Student project cards will go here */}
      </div>
    </div>
  );
}
