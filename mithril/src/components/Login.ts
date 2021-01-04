import axios from "axios";
import Debug from "debug";
import Joi, { ValidationError } from "joi";
import m from "mithril";

import validators from "../../../server/src/lib/validators";

const debug = Debug("anthologize:login");

const Login: m.ClosureComponent = () => {
  const values = {
    email: "",
    password: "",
    passwordAgain: "",
  };
  let error: string | null = null;
  let showSignup = true;
  let submitting = false;

  function setValue(key: keyof typeof values) {
    return (e: InputEvent) => {
      if (!e.target) return;
      values[key] = (e.target as HTMLInputElement).value;
    };
  }

  async function submit(e: Event) {
    e.preventDefault();

    submitting = true;
    error = null;
    m.redraw();

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
        return void m.redraw();
      }

      await axios.post("/api/auth/login-signup", values, {
        withCredentials: true,
      });
      m.route.set("/");
    } catch (ex) {
      debug("Error logging in: %O", ex);
      error =
        ex.response?.data?.errors ?? ex.response?.data?.error ?? ex.message;
    } finally {
      submitting = false;
      m.redraw();
    }
  }

  return {
    view() {
      if (submitting) {
        return m("div", "Submitting...");
      } else {
        return m(
          "form",
          { onsubmit: submit },
          error && m("p", error),

          m(
            `label${!showSignup ? ".text-red-500" : ""}`,
            m("input", {
              type: "radio",
              name: "auth-action",
              class: "hidden",
              onchange: () => {
                showSignup = false;
                m.redraw();
              },
              value: "login",
              checked: !showSignup,
            }),
            "Log In"
          ),

          m(
            `label${!showSignup ? ".text-red-500" : ""}`,
            m(
              "input",
              {
                type: "radio",
                name: "auth-action",
                class: "hidden",
                onchange: () => {
                  showSignup = true;
                  m.redraw();
                },
                value: "signup",
                checked: { showSignup },
              },
              "Log In"
            )
          ),

          m("input", {
            oninput: setValue("email"),
            type: "email",
            placeholder: "HomeStarRunner@StrongBadia.com",
            value: values.email,
          }),
          m("input", {
            oninput: setValue("password"),
            type: "password",
            placeholder: "hunter2",
            value: values.password,
          }),
          showSignup &&
            m("input", {
              oninput: setValue("passwordAgain"),
              type: "password",
              placeholder: "hunter2",
              value: values.passwordAgain,
            }),

          m("button", { type: "submit" }, showSignup ? "Sign Up" : "Log In")
        );
      }
    },
  };
};

export default Login;
