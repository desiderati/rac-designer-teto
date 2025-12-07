interface InfoBarProps {
  message: string;
}

export function InfoBar({ message }: InfoBarProps) {
  return (
    <div 
      className="fixed bottom-5 left-24 right-5 mx-auto max-w-md text-center text-primary-foreground text-sm pointer-events-none z-50 bg-secondary/80 backdrop-blur-sm p-3 rounded-lg shadow-lg"
      dangerouslySetInnerHTML={{ __html: message }}
    />
  );
}
