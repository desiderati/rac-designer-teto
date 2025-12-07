import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';

interface InfoBarProps {
  message: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function InfoBar({ message, isCollapsed, onToggleCollapse }: InfoBarProps) {
  return (
    <div className="w-full bg-secondary/80 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden transition-all duration-300">
      <button
        onClick={onToggleCollapse}
        className="w-full flex items-center justify-center gap-2 p-2 text-primary-foreground/70 hover:text-primary-foreground text-xs cursor-pointer bg-transparent border-none transition-colors"
      >
        <FontAwesomeIcon icon={isCollapsed ? faChevronUp : faChevronDown} />
        <span>{isCollapsed ? 'Mostrar dicas' : 'Ocultar dicas'}</span>
      </button>
      {!isCollapsed && (
        <div 
          className="text-center text-primary-foreground text-sm p-3 pt-0"
          dangerouslySetInnerHTML={{ __html: message }}
        />
      )}
    </div>
  );
}
