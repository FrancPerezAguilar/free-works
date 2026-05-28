interface Props {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: Props) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && (
          <p className="text-sm text-gray-500 mt-1.5">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
