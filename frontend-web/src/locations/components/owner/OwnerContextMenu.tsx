import '../ContextMenu.css';

interface OwnerContextMenuProps {
  x: number;
  y: number;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const OwnerContextMenu = ({
  x,
  y,
  onEdit,
  onDelete,
  onClose,
}: OwnerContextMenuProps) => {
  return (
    <>
      <div className="context-menu-overlay" onClick={onClose} />
      <div className="context-menu" style={{ left: `${x}px`, top: `${y}px` }}>
        <button
          onClick={() => {
            onEdit();
            onClose();
          }}
          className="context-menu-item edit"
        >
          <span>✏️</span>
          <span>Modify</span>
        </button>
        <button
          onClick={() => {
            onDelete();
            onClose();
          }}
          className="context-menu-item delete"
        >
          <span>🗑️</span>
          <span>Delete</span>
        </button>
      </div>
    </>
  );
};

export default OwnerContextMenu;
