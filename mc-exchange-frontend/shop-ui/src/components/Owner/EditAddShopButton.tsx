// components/Owner/EditAddShopButton.tsx
interface EditAddShopButtonProps {
  mode: 'add' | 'edit';
  shopData?: {
    id?: string;
    name?: string;
    owner?: string;
    bounds?: string;
    exchanges?: number;
    type?: string;
  };
  onClick?: () => void;
  className?: string;
}

export default function EditAddShopButton({ 
  mode, 
  shopData, 
  onClick,
  className = ""
}: EditAddShopButtonProps) {
  const buttonText = mode === 'add' ? '+ Add Shop' : 'Edit';
  const buttonStyle = mode === 'add' 
    ? 'bg-pv-primary hover:bg-pv-secondary' 
    : 'bg-pv-surface-elevated hover:bg-pv-border';

  const handleClick = () => {
    console.log(`${mode} shop clicked`, shopData);
    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      className={`
        ${buttonStyle}
        text-white
        px-4 py-2
        rounded-lg
        border
        border-pv-accent-border
        font-medium
        transition-colors
        bg-pv-surface-elevated
        duration-200
        hover:shadow-lg
        active:scale-95
        ${className}
      `}
    >
      {buttonText}
    </button>
  );
}