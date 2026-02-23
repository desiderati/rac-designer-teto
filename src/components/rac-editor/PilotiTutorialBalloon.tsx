import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faXmark} from "@fortawesome/free-solid-svg-icons";

interface PilotiTutorialBalloonProps {
  position: { x: number; y: number };
  onClose: () => void;
}

export function PilotiTutorialBalloon({position, onClose}: PilotiTutorialBalloonProps) {
  return (
    <div
      className="fixed z-50 animate-scale-in pointer-events-auto"
      style={{
        left: position.x + 20,
        top: position.y - 20,
      }}
    >
      <div className="relative bg-amber-100 text-amber-900 rounded-xl shadow-lg p-3 max-w-[200px]">
        {/* Arrow pointing left */}
        <div
          className="absolute w-0 h-0 border-8 border-transparent border-r-amber-100"
          style={{left: "-15px", top: "20px", transform: "translateY(-50%)"}}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 w-6 h-6 bg-amber-200 hover:bg-amber-300 rounded-full flex items-center justify-center transition-colors z-50"
        >
          <FontAwesomeIcon icon={faXmark} className="text-amber-800 text-xs"/>
        </button>

        {/* Content */}
        <p className="text-xs text-amber-800">
          Clique duas vezes para alterar a altura do Piloti.
        </p>
      </div>
    </div>
  );
}
