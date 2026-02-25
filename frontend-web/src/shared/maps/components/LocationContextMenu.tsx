interface LocationContextMenuProps {
  x: number;
  y: number;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const LocationContextMenu = ({
  x,
  y,
  onEdit,
  onDelete,
  onClose,
}: LocationContextMenuProps) => {
  return (
    <>
      <div className="fixed inset-0 z-999" onClick={onClose} />
      <div
        className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-1000"
        style={{ left: `${x}px`, top: `${y}px` }}
      >
        <button
          onClick={() => {
            onEdit();
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
        >
          <span />
          ✏️
          <span>Modify</span>
        </button>
        <button
          onClick={() => {
            onDelete();
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
        >
          <span />
          🗑️
          <span>Delete</span>
        </button>
      </div>
    </>
  );
};

export default LocationContextMenu;
