import React, { useMemo, useState } from "react";
import styles from "./checkout.module.css";

const PHONE_REGEX = /^(?:07|01)\d{8}$/;

const initialFormState = {
  name: "",
  phone: "",
  label: "Home",
  addressLine: "",
  city: "",
  region: "",
  postalCode: "",
  country: "Kenya",
  instructions: "",
};

export default function CheckoutForm({ onSubmit, isSubmitting, disabled }) {
  const [form, setForm] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  const isDisabled = disabled || isSubmitting;

  const validators = useMemo(
    () => ({
      name: (value) => (value.trim().length ? null : "Full name is required"),
      phone: (value) => {
        const normalised = value.replace(/\s+/g, "").trim();
        return PHONE_REGEX.test(normalised)
          ? null
          : "Enter a valid Kenyan phone (07 or 01 followed by 8 digits)";
      },
      label: (value) => (value.trim().length ? null : "Choose a label for this address"),
      addressLine: (value) =>
        value.trim().length >= 5 ? null : "Include estate, street, and house number",
      city: (value) => (value.trim().length >= 3 ? null : "City or town is required"),
      region: (value) => (value.trim().length >= 3 ? null : "County or region is required"),
      postalCode: (value) =>
        !value.trim().length || /^\d{5}$/.test(value.trim())
          ? null
          : "Postal code must be 5 digits",
    }),
    []
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validateForm = () => {
    const nextErrors = {};

    Object.entries(validators).forEach(([field, validator]) => {
      const message = validator(form[field] || "");
      if (message) {
        nextErrors[field] = message;
      }
    });

    return nextErrors;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    onSubmit(form);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <h3 className={styles.formHeading}>Delivery details</h3>
      <p className={styles.formNote}>We will share these details with your delivery agent.</p>

      <label className={`${styles.inputField} ${errors.name ? styles.inputError : ""}`}>
        Full name
        <input
          name="name"
          placeholder="Jane Wanjiku"
          value={form.name}
          onChange={handleChange}
          disabled={isDisabled}
          aria-invalid={Boolean(errors.name)}
        />
        {errors.name && <span className={styles.errorText}>{errors.name}</span>}
      </label>

      <label className={`${styles.inputField} ${errors.phone ? styles.inputError : ""}`}>
        Phone number
        <input
          name="phone"
          placeholder="07xx xxx xxx"
          value={form.phone}
          onChange={handleChange}
          disabled={isDisabled}
          aria-invalid={Boolean(errors.phone)}
        />
        {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
      </label>

      <label className={`${styles.inputField} ${errors.label ? styles.inputError : ""}`}>
        Address label
        <select
          name="label"
          value={form.label}
          onChange={handleChange}
          disabled={isDisabled}
          aria-invalid={Boolean(errors.label)}
        >
          <option value="Home">Home</option>
          <option value="Office">Office</option>
          <option value="Market">Market</option>
          <option value="Other">Other</option>
        </select>
        {errors.label && <span className={styles.errorText}>{errors.label}</span>}
      </label>

      <label className={`${styles.inputField} ${errors.addressLine ? styles.inputError : ""}`}>
        Delivery address
        <textarea
          name="addressLine"
          placeholder="Estate, street name, house number"
          value={form.addressLine}
          onChange={handleChange}
          rows={4}
          disabled={isDisabled}
          aria-invalid={Boolean(errors.addressLine)}
        />
        {errors.addressLine && (
          <span className={styles.errorText}>{errors.addressLine}</span>
        )}
      </label>

      <div className={styles.formRow}>
        <label className={`${styles.inputField} ${errors.city ? styles.inputError : ""}`}>
          City / Town
          <input
            name="city"
            placeholder="Nairobi"
            value={form.city}
            onChange={handleChange}
            disabled={isDisabled}
            aria-invalid={Boolean(errors.city)}
          />
          {errors.city && <span className={styles.errorText}>{errors.city}</span>}
        </label>
        <label className={`${styles.inputField} ${errors.region ? styles.inputError : ""}`}>
          County / Region
          <input
            name="region"
            placeholder="Nairobi County"
            value={form.region}
            onChange={handleChange}
            disabled={isDisabled}
            aria-invalid={Boolean(errors.region)}
          />
          {errors.region && <span className={styles.errorText}>{errors.region}</span>}
        </label>
      </div>

      <div className={styles.formRow}>
        <label className={`${styles.inputField} ${errors.postalCode ? styles.inputError : ""}`}>
          Postal code (optional)
          <input
            name="postalCode"
            placeholder="00100"
            value={form.postalCode}
            onChange={handleChange}
            disabled={isDisabled}
            aria-invalid={Boolean(errors.postalCode)}
          />
          {errors.postalCode && (
            <span className={styles.errorText}>{errors.postalCode}</span>
          )}
        </label>
        <label className={styles.inputField}>
          Country
          <input name="country" value={form.country} readOnly disabled />
        </label>
      </div>

      <label className={styles.inputField}>
        Delivery instructions (optional)
        <textarea
          name="instructions"
          placeholder="Gate code, delivery notes, or preferred drop-off"
          value={form.instructions}
          onChange={handleChange}
          rows={3}
          disabled={isDisabled}
        />
      </label>

      <button type="submit" className={styles.cta} disabled={isDisabled}>
        {isSubmitting ? "Placing order..." : "Place order"}
      </button>
    </form>
  );
}