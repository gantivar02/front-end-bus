import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import styles from "./MainLayout.module.css";

export default function MainLayout() {
  return (
    <div className={styles.appShell}>
      <Sidebar />
      <div className={styles.contentArea}>
        <Header />
        <main className={styles.pageContent}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}