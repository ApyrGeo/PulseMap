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
        style={{
          position: 'fixed',
          left: `${x}px`,
          top: `${y}px`,
          backgroundColor: '#1A1A2E',
          border: '1px solid #2D2D44',
          borderRadius: '0.5rem',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.4)',
          padding: '0.25rem 0',
          zIndex: 1000,
          minWidth: '140px',
        }}
      >
        <button
          onClick={() => { onEdit(); onClose(); }}
          style={{
            width: '100%', padding: '0.5rem 1rem', textAlign: 'left',
            fontSize: '0.875rem', display: 'flex', alignItems: 'center',
            gap: '0.5rem', border: 'none', background: 'none',
            color: '#fff', cursor: 'pointer',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#2D2D44')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <img src="/icons/edit.png" style={{ width: 15, height: 15, filter: 'invert(1)' }} alt="" />
          <span>Modify</span>
        </button>
        <button
          onClick={() => { onDelete(); onClose(); }}
          style={{
            width: '100%', padding: '0.5rem 1rem', textAlign: 'left',
            fontSize: '0.875rem', display: 'flex', alignItems: 'center',
            gap: '0.5rem', border: 'none', background: 'none',
            color: '#FF6B6B', cursor: 'pointer',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#2D2D44')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <img src="/icons/trash.png" style={{ width: 15, height: 15, filter: 'invert(1)' }} alt="" />
          <span>Delete</span>
        </button>
      </div>
    </>
  );
};

export default LocationContextMenu;
