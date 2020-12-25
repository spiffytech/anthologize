import { Context, createElement, Fragment } from "@bikeshaving/crank";
import axios from "axios";
import Joi, { ValidationError } from "joi";
import page from "page";

import validators from "../../../server/src/lib/validators";

export default function* Login(this: Context) {
  const values = {
    email: "",
    password: "",
    passwordAgain: "",
  };
  let error: string | null = null;
  let showSignup = true;
  let submitting = false;

  const setValue = (key: keyof typeof values) => {
    return (e: InputEvent) => {
      if (!e.target) return;
      values[key] = (e.target as HTMLInputElement).value;
    };
  };

  this.addEventListener("submit", async (e: Event) => {
    e.preventDefault();

    submitting = true;
    error = null;
    this.refresh();

    try {
      if (showSignup && values.password !== values.passwordAgain) {
        throw new Error("You need to enter the same password both times");
      }
      try {
        Joi.assert(
          { email: values.email, password: values.password },
          Joi.object({
            email: validators.email,
            password: validators.password,
          })
        );
      } catch (ex) {
        error = (ex.details as ValidationError[])
          .map((detail: ValidationError) => detail.message)
          .join(", ");
        return void this.refresh();
      }

      await axios.post("/api/auth/login-signup", values);
      page("/");
    } catch (ex) {
      error =
        ex.response?.data?.errors ?? ex.response?.data?.error ?? ex.message;
    } finally {
      submitting = false;
      this.refresh();
    }
  });

  while (true) {
    if (submitting) {
      yield <div>Submitting...</div>;
    } else {
      yield (
        <form>
          {error && <p>{error}</p>}

          <label class={`${!showSignup ? "text-red-500" : null}`}>
            <input
              type="radio"
              name="auth-action"
              class="hidden"
              onchange={() => {
                showSignup = false;
                this.refresh();
              }}
              value="login"
              checked={!showSignup}
            />
            Log In
          </label>

          <label class={`${showSignup ? "text-red-500" : null}`}>
            <input
              type="radio"
              name="auth-action"
              class="hidden"
              onchange={() => {
                showSignup = true;
                this.refresh();
              }}
              value="signup"
              checked={showSignup}
            />
            Log In
          </label>

          <input
            oninput={setValue("email")}
            type="email"
            placeholder="HomeStarRunner@StrongBadia.com"
            value={values.email}
          />
          <input
            oninput={setValue("password")}
            type="password"
            placeholder="hunter2"
            value={values.password}
          />
          {showSignup && (
            <input
              oninput={setValue("passwordAgain")}
              type="password"
              placeholder="hunter2"
              value={values.passwordAgain}
            />
          )}

          <button type="submit">{showSignup ? "Sign Up" : "Log In"}</button>
        </form>
      );
    }
  }
}
