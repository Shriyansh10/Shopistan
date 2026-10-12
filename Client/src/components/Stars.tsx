type StarsProps = {
  rating: number;
  className?: string;
};

export default function Stars({ rating, className = "" }: StarsProps) {
  const filled = Math.round(rating);
  return (
    <span role="img" aria-label={`${rating} out of 5 stars`} className={`inline-flex tracking-[1px] ${className}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} aria-hidden="true" className={n <= filled ? "text-amber-500" : "text-gray-200"}>
          ★
        </span>
      ))}
    </span>
  );
}
