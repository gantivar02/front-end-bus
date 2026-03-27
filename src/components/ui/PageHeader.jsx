import styles from "./PageHeader.module.css";

export default function PageHeader({ title, description, action }) {
  return (
    <div className={styles.pageHeaderRow}>
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>

      {action && <div>{action}</div>}
    </div>
  );
}