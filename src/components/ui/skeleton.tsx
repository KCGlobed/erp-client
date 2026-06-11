interface SkeletonProps {
  className?: string;
}

const Skeleton = ({ className = '' }: SkeletonProps) => {
  return (
    <div
      className={`relative overflow-hidden bg-gray-200 ${className}`}
    >
      <div className="absolute inset-0 shimmer" />
    </div>
  );
};

export default Skeleton;