export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, confirmText = 'OK', cancelText = 'Cancel', variant = 'danger' }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-dialog-header">
          <h3>{title}</h3>
        </div>
        <div className="confirm-dialog-body">
          <p>{message}</p>
        </div>
        <div className="confirm-dialog-actions">
          <button 
            type="button" 
            className="btn btn-outline" 
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button 
            type="button" 
            className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
