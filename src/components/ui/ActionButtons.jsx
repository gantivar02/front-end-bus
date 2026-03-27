import Button from "./Button";
import styles from "./ActionButtons.module.css";

export default function ActionButtons({
  onEdit,
  onDelete,
  showEdit = true,
  showDelete = true,
  editText = "Editar",
  deleteText = "Eliminar",
}) {
  return (
    <div className={styles.tableActions}>
      {showEdit && (
        <Button variant="secondary" onClick={onEdit}>
          {editText}
        </Button>
      )}

      {showDelete && (
        <Button variant="danger" onClick={onDelete}>
          {deleteText}
        </Button>
      )}
    </div>
  );
}