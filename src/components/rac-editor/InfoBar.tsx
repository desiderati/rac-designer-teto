interface InfoBarProps {
  message: string;
}

export function InfoBar({ message }: InfoBarProps) {
  return (
    <div 
      className="h-12 bg-secondary/80 backdrop-blur-sm flex items-center justify-center px-4"
      dangerouslySetInnerHTML={{ __html: message }}
    />
  );
}
