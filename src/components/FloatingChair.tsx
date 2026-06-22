export interface FloatingChairProps {
  id: string;
  className: string;
  canSpin?: boolean;
  canMoveBounds?: string;
}

const FLOATING_CHAIR_SIZE = 'w-32 md:w-36';

export function FloatingChair({
  id,
  className,
  canSpin = false,
  canMoveBounds = 'home-stage',
}: FloatingChairProps) {
  return (
    <img
      id={id}
      src="/red-stool.png"
      can-move="true"
      {...(canSpin ? { 'can-spin': '' } : {})}
      can-move-bounds={canMoveBounds}
      draggable={false}
      className={`absolute z-10 cursor-move opacity-95 ${FLOATING_CHAIR_SIZE} ${className}`}
    />
  );
}
