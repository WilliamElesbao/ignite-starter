import { AuthFormContainer } from "./auth-form-container";
import { AuthFormDescription } from "./auth-form-description";
import { AuthFormField } from "./auth-form-fields";
import { AuthFormHeader } from "./auth-form-header";
import { AuthFormRoot } from "./auth-form-root";
import { AuthFormSeparator } from "./auth-form-separator";
import { AuthFormSocials } from "./auth-form-socials";
import { AuthFormSubmit } from "./auth-form-submit";

export const AuthForm = Object.assign(AuthFormRoot, {
  Form: AuthFormContainer,
  Header: AuthFormHeader,
  Field: AuthFormField,
  Submit: AuthFormSubmit,
  Separator: AuthFormSeparator,
  Socials: AuthFormSocials,
  Description: AuthFormDescription,
});
