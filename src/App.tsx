// ABOUTME: Main app component displaying the collaborative 3D chair viewer.
// ABOUTME: Uses playhtml for real-time state syncing between users.

// import { CanMoveElement } from '@playhtml/react';
import { ChairViewer } from './ChairViewer';

export default function App() {
  return (
    <div>
      <h1>BUIDLING BENCHES FOR THE WEB</h1>
      <div className="flex flex-row">
        <img id="chair-1" src="/red-stool.png" can-move="" draggable={false} />
        <img id="chair-2" src="/red-stool.png" can-move="" draggable={false} />
        <img id="chair-3" src="/red-stool.png" can-move="" draggable={false} />
      </div>
      <ChairViewer />
    </div>
  );
}
