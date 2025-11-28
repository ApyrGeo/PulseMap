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
      <div className="fixed inset-0 z-[999]" onClick={onClose} />
      <div
        className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-[1000]"
        style={{ left: `${x}px`, top: `${y}px` }}
      >
        {!isExpired && (
          <button
            onClick={() => {
              onExpire();
              onClose();
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-yellow-50 text-yellow-600 flex items-center gap-2"
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
          className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
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
            className="w-full px-4 py-2 text-left text-sm hover:bg-green-50 text-green-600 flex items-center gap-2"
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
