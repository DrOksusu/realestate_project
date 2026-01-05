interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
  onClick?: () => void;
}

export default function Card({ children, className = '', title, action, onClick }: CardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border ${className}`} onClick={onClick}>
      {(title || action) && (
        <div className="flex items-center justify-between px-4 py-3 border-b">
          {title && <h3 className="font-semibold text-gray-900">{title}</h3>}
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
