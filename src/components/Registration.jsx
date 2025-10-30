import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { api } from "../Config.jsx";
import { useNavigate } from "react-router-dom";
import { User, Mail, Lock, Phone, UserCheck, LogIn, MapPin } from "lucide-react";
import "./Registration.css";

const GOOGLE_PLACES_API_KEY = "AIzaSyA-F3LUFmKxndLcLtlqyrkmkiM7ntx8ka8";

// Validation schema
const schema = yup.object({
  name: yup.string().required("Name is required").min(2, "Name must be at least 2 characters"),
  email: yup.string().required("Email is required").email("Please enter a valid email"),
  password: yup.string().required("Password is required").min(8, "Password must be at least 8 characters"),
  role: yup.string().required("Role is required").oneOf(["farmer", "buyer", "delivery_agent"], "Please select a valid role"),
  phone: yup.string().required("Phone is required").matches(/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number"),
  location: yup.string().required("Location is required"),
});

const Registration = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const placesReadyRef = useRef(false);
  const sessionTokenRef = useRef(null);
  const debounceRef = useRef(null);
  const suggestionsRef = useRef(null);
  const activeRequestRef = useRef(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "farmer",
      phone: "",
      location: "",
    }
  });

  useEffect(() => {
    const initializePlaces = async () => {
      try {
        if (!window.google?.maps) {
          return;
        }

        if (typeof window.google.maps.importLibrary === "function") {
          await window.google.maps.importLibrary("places");
        }

        if (window.google?.maps?.places?.AutocompleteSuggestion) {
          placesReadyRef.current = true;
          if (window.google.maps.places.AutocompleteSessionToken && !sessionTokenRef.current) {
            sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
          }
        } else {
          console.warn("Google Places AutocompleteSuggestion API is not available in this environment.");
        }
      } catch (libError) {
        console.error("Failed to initialize Google Places library", libError);
      }
    };

    if (window.google?.maps?.places?.AutocompleteSuggestion) {
      placesReadyRef.current = true;
      if (window.google.maps.places.AutocompleteSessionToken && !sessionTokenRef.current) {
        sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
      }
      return undefined;
    }

    const handleScriptLoad = () => {
      initializePlaces();
    };

    if (window.google?.maps?.places) {
      handleScriptLoad();
      return undefined;
    }

    const existingScript = document.getElementById("google-places-script");
    if (existingScript) {
      existingScript.addEventListener("load", handleScriptLoad);
      return () => existingScript.removeEventListener("load", handleScriptLoad);
    }

    const script = document.createElement("script");
    script.id = "google-places-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_PLACES_API_KEY}&libraries=places&language=en`;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", handleScriptLoad);
    script.addEventListener("error", () => {
      console.error("Failed to load Google Places script");
    });
    document.head.appendChild(script);

    return () => {
      script.removeEventListener("load", handleScriptLoad);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const getSuggestionLabel = (suggestion) => {
    if (!suggestion) {
      return "";
    }

    const prediction = suggestion.placePrediction;
    const textValue = prediction?.text?.text;
    if (textValue) {
      return textValue;
    }

    const main = prediction?.mainText?.text;
    const secondary = prediction?.secondaryText?.text;
    if (main && secondary) {
      return `${main}, ${secondary}`;
    }

    if (main) {
      return main;
    }

    if (secondary) {
      return secondary;
    }

    if (typeof suggestion.text === "string") {
      return suggestion.text;
    }

    if (suggestion.text?.text) {
      return suggestion.text.text;
    }

    if (suggestion.displayString) {
      return suggestion.displayString;
    }

    if (suggestion.description) {
      return suggestion.description;
    }

    return "";
  };

  const requestLocationSuggestions = async (inputValue) => {
    const trimmed = inputValue.trim();
    if (trimmed.length < 3) {
      setLocationSuggestions([]);
      setIsLoadingLocations(false);
      return;
    }

    if (!placesReadyRef.current || !window.google?.maps?.places?.AutocompleteSuggestion) {
      setIsLoadingLocations(false);
      return;
    }

    const requestId = ++activeRequestRef.current;
    setIsLoadingLocations(true);

    try {
      if (!sessionTokenRef.current && window.google.maps.places.AutocompleteSessionToken) {
        sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
      }

      const response = await window.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: trimmed,
        includedRegionCodes: ["KE", "UG", "TZ"],
        language: "en",
        sessionToken: sessionTokenRef.current || undefined,
      });

      if (requestId !== activeRequestRef.current) {
        return;
      }

      const suggestions = Array.isArray(response?.suggestions) ? response.suggestions : [];
      setLocationSuggestions(suggestions);
    } catch (fetchError) {
      if (requestId === activeRequestRef.current) {
        setLocationSuggestions([]);
      }
      console.error("Failed to fetch location suggestions", fetchError);
    } finally {
      if (requestId === activeRequestRef.current) {
        setIsLoadingLocations(false);
      }
    }
  };

  const handleLocationInput = (value) => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    if (value.trim().length < 3) {
      setLocationSuggestions([]);
      setIsLoadingLocations(false);
      activeRequestRef.current += 1;
      sessionTokenRef.current = null;
      return;
    }

    if (!sessionTokenRef.current && window.google?.maps?.places?.AutocompleteSessionToken) {
      sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
    }

    setIsLoadingLocations(true);
    debounceRef.current = window.setTimeout(() => {
      requestLocationSuggestions(value);
    }, 250);
  };

  const handleLocationSelect = (suggestion) => {
    const label = getSuggestionLabel(suggestion);
    setValue("location", label, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
    activeRequestRef.current += 1;
    setLocationSuggestions([]);
    setIsLoadingLocations(false);
    sessionTokenRef.current = null;
  };

  const handleLocationBlur = () => {
    window.setTimeout(() => {
      setLocationSuggestions([]);
    }, 150);
  };

  const locationRegister = register("location", {
    onChange: (event) => handleLocationInput(event.target.value),
    onBlur: handleLocationBlur
  });

  const onSubmit = async (data) => {
    setErrorMsg("");
    setSuccessMsg("");

    try {
      setLoading(true);
      const res = await api.post("/auth/register", data);
      setSuccessMsg(res.data.message);
      reset();
      setLocationSuggestions([]);
      
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      setErrorMsg(
        error.response?.data?.message || "Registration failed. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="register-container">
      <div className="register-card">
        <div className="register-heading">
          <div className="register-icon" aria-hidden="true">
            <UserCheck size={32} />
          </div>
          <h1>Join AgroLink Today</h1>
        </div>

        {errorMsg && (
          <div className="status-banner error" role="alert">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="status-banner success" role="status" aria-live="polite">
            {successMsg}
          </div>
        )}

        <form className="register-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              <span className="form-label-icon" aria-hidden="true">
                <User size={16} />
              </span>
              Full name
            </label>
            <input
              id="name"
              type="text"
              placeholder="eg. Jane Wambui"
              autoComplete="name"
              className={`form-input ${errors.name ? "has-error" : ""}`}
              {...register("name")}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && (
              <p id="name-error" className="helper-text" role="alert">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              <span className="form-label-icon" aria-hidden="true">
                <Mail size={16} />
              </span>
              Email address
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@gmail.com"
              autoComplete="email"
              className={`form-input ${errors.email ? "has-error" : ""}`}
              {...register("email")}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <p id="email-error" className="helper-text" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="location" className="form-label">
              <span className="form-label-icon" aria-hidden="true">
                <MapPin size={16} />
              </span>
              Primary location
            </label>
            <div className="form-autocomplete">
              <input
                id="location"
                type="text"
                placeholder="Search your farm, market, or hub"
                autoComplete="off"
                className={`form-input ${errors.location ? "has-error" : ""}`}
                aria-autocomplete="list"
                aria-controls="location-suggestions"
                aria-expanded={locationSuggestions.length > 0}
                aria-describedby={errors.location ? "location-error" : "location-hint"}
                {...locationRegister}
              />
              {isLoadingLocations && <span className="autocomplete-spinner" aria-hidden="true" />}
              {locationSuggestions.length > 0 && (
                <ul
                  id="location-suggestions"
                  className="autocomplete-list"
                  role="listbox"
                  ref={suggestionsRef}
                >
                  {locationSuggestions.map((suggestion, index) => {
                    const label = getSuggestionLabel(suggestion);
                    if (!label) {
                      return null;
                    }

                    const key = suggestion?.placePrediction?.placeId || `${label}-${index}`;

                    return (
                      <li key={key} role="option">
                        <button
                          type="button"
                          className="autocomplete-option"
                          onClick={() => handleLocationSelect(suggestion)}
                        >
                          {label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <p id="location-hint" className="helper-text" aria-live="polite">
              This helps connect you with nearby buyers and delivery partners.
            </p>
            {errors.location && (
              <p id="location-error" className="helper-text" role="alert">
                {errors.location.message}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              <span className="form-label-icon" aria-hidden="true">
                <Lock size={16} />
              </span>
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
              className={`form-input ${errors.password ? "has-error" : ""}`}
              {...register("password")}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : "password-hint"}
            />
            <p id="password-hint" className="helper-text" aria-live="polite">
              Use a mix of letters, numbers, or symbols for a stronger password.
            </p>
            {errors.password && (
              <p id="password-error" className="helper-text" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="role" className="form-label">
              <span className="form-label-icon" aria-hidden="true">
                <UserCheck size={16} />
              </span>
              Choose your role
            </label>
            <select
              id="role"
              className={`form-input ${errors.role ? "has-error" : ""}`}
              {...register("role")}
              aria-invalid={Boolean(errors.role)}
              aria-describedby={errors.role ? "role-error" : undefined}
            >
              <option value="farmer">Farmer</option>
              <option value="buyer">Buyer</option>
              <option value="delivery_agent">Delivery Agent</option>
            </select>
            {errors.role && (
              <p id="role-error" className="helper-text" role="alert">
                {errors.role.message}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="phone" className="form-label">
              <span className="form-label-icon" aria-hidden="true">
                <Phone size={16} />
              </span>
              Phone number
            </label>
            <input
              id="phone"
              type="tel"
              placeholder="+254700123456"
              autoComplete="tel"
              className={`form-input ${errors.phone ? "has-error" : ""}`}
              {...register("phone")}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? "phone-error" : "phone-hint"}
            />
            <p id="phone-hint" className="helper-text" aria-live="polite">
              Include your country code for smooth delivery coordination.
            </p>
            {errors.phone && (
              <p id="phone-error" className="helper-text" role="alert">
                {errors.phone.message}
              </p>
            )}
          </div>

          <button type="submit" className="primary-action" disabled={loading}>
            {loading ? "Creating your account…" : "Create my account"}
          </button>
        </form>

        <div className="register-footer">
          <span>Already have an account?</span>
          <button type="button" className="secondary-action" onClick={() => navigate("/login")}>
            <LogIn size={16} aria-hidden="true" />
            <span>Sign in</span>
          </button>
        </div>
      </div>
    </main>
  );
};

export default Registration;