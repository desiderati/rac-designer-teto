import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLightbulb } from '@fortawesome/free-solid-svg-icons';

interface InfoBarProps {
  message: string;
}

export function InfoBar({ message }: InfoBarProps) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 ml-10 flex items-center gap-3 bg-[#2c3e50] text-white text-sm px-5 py-3 rounded-full shadow-xl border border-[#34495e] z-50 pointer-events-none">
      <FontAwesomeIcon 
        icon={faLightbulb} 
        className="text-yellow-400 text-base flex-shrink-0" 
      />
      <span dangerouslySetInnerHTML={{ __html: message }} />
    </div>
  );
}