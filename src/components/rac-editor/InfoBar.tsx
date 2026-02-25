interface InfoBarProps {
  message: string;
}

export function InfoBar({message}: InfoBarProps) {
  return (
    <div
      className='w-full text-center text-primary-foreground text-xs bg-secondary/80 backdrop-blur-sm py-2 px-3 rounded-md shadow-lg'
      dangerouslySetInnerHTML={{__html: message}}
    />
  );
}
