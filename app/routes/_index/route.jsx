import { redirect, Form, useLoaderData } from "react-router";
import { login } from "../../shopify.server";
import styles from "./styles.module.css";

export const loader = async ({ request }) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData();

  return (
    <div className={styles.index}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap');
      `}</style>
      <div className={styles.content}>
        <div className={styles.logoContainer}>
          <img src="https://app.flowbee.io/svg/brand-logos/logo-flowbee-secondary.svg" alt="Flowbee Logo" className={styles.logo} />
        </div>
        <h1 className={styles.heading}>Flowbee WhatsApp Notifications</h1>
        <p className={styles.text}>
          Boost recovery rates and keep customers informed. Send real-time transactional WhatsApp notifications for Shopify order updates and abandoned checkouts automatically.
        </p>
        
        {showForm && (
          <Form className={styles.form} method="post" action="/auth/login">
            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="shop-input">
                Shop Domain
              </label>
              <div className={styles.inputWrapper}>
                <input 
                  id="shop-input"
                  className={styles.input} 
                  type="text" 
                  name="shop" 
                  placeholder="example.myshopify.com"
                  required
                />
                <button className={styles.button} type="submit">
                  Install / Login
                </button>
              </div>
              <span className={styles.helpText}>Enter your shopify domain to connect your store.</span>
            </div>
          </Form>
        )}

        <ul className={styles.list}>
          <li>
            <strong>Abandoned Cart Recovery</strong>. Recover lost sales by automatically triggering recovery notifications when customers abandon checkout.
          </li>
          <li>
            <strong>Order Status Updates</strong>. Keep customers updated with automated messages for new orders, payment confirmation, and delivery fulfillment.
          </li>
          <li>
            <strong>Interactive Templates</strong>. Effortlessly map variables and synchronize custom WhatsApp approved templates directly from your Flowbee dashboard.
          </li>
        </ul>
      </div>
    </div>
  );
}
