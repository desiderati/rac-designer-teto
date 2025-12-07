interface InfoBarProps {
  message: string;
}

export function InfoBar({ message }: InfoBarProps) {
  return (
    <div 
      className="w-full text-center text-primary-foreground text-sm bg-secondary/80 backdrop-blur-sm p-3 rounded-lg shadow-lg"
      dangerouslySetInnerHTML={{ __html: message }}
    />
  );
}
