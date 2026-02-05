import '../ContextMenu.css';

interface AdminContextMenuProps {
  x: number;
  y: number;
  isExpired: boolean;
  onExpire: () => void;
  onDelete: () => void;
  onExtend: () => void;
  onClose: () => void;
}

const AdminContextMenu = ({
  x,
  y,
  isExpired,
  onExpire,
  onDelete,
  onExtend,
  onClose,
}: AdminContextMenuProps) => {
  return (
    <>
      <div className="context-menu-overlay" onClick={onClose} />
      <div className="context-menu" style={{ left: `${x}px`, top: `${y}px` }}>
        {!isExpired && (
          <button
            onClick={() => {
              onExpire();
              onClose();
            }}
            className="context-menu-item expire"
          >
            <span>⏰</span>
            <span>Expire</span>
          </button>
        )}

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

        {isExpired && (
          <button
            onClick={() => {
              onExtend();
              onClose();
            }}
            className="context-menu-item extend"
          >
            <span>🔄</span>
            <span>Extend</span>
          </button>
        )}
      </div>
    </>
  );
};

export default AdminContextMenu;
