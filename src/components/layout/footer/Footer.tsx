import styles from "./footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p>© 2026 Cheber Boll · демо-версия, данные хранятся в вашем браузере</p>
      </div>
    </footer>
  );
}
