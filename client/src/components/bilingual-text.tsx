interface BilingualTextProps {
  english: string;
  telugu: string;
  className?: string;
}

export function BilingualText({ english, telugu, className = "" }: BilingualTextProps) {
  return (
    <span className={`font-telugu ${className}`}>
      {english} ({telugu})
    </span>
  );
}
