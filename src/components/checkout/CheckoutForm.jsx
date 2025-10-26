import React, { useState } from "react";
import styles from "./checkout.module.css";

export default function CheckoutForm({ onSubmit }){
  const [form, setForm] = useState({ name:"", phone:"", address:"" });

  const change = (e) => setForm(prev => ({...prev,[e.target.name]: e.target.value}));

  return (
    <form className={styles.form} onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}>
      <input name="name" placeholder="Full name" value={form.name} onChange={change} required />
      <input name="phone" placeholder="Phone (e.g. 07...)" value={form.phone} onChange={change} required/>
      <textarea name="address" placeholder="Delivery address" value={form.address} onChange={change} required />
      <button type="submit" className={styles.cta}>Place Order</button>
    </form>
  );
}
