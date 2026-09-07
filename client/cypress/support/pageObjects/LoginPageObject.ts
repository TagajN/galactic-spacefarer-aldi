export class LoginPageObject {
  usernameInput() {
    return cy.get('input[placeholder*="alice"]');
  }
  passwordInput() {
    return cy.get('input[type="password"]');
  }
  submitButton() {
    return cy.get('[data-cy="submit-btn"]');
  }
  errorMessage() {
    return cy.get("p.text-red-400");
  }

  fillUsername(value: string) {
    this.usernameInput().clear().type(value);
    return this;
  }

  fillPassword(value: string) {
    this.passwordInput().clear().type(value);
    return this;
  }

  submit() {
    this.submitButton().click();
    return this;
  }

  login(username: string, password: string) {
    return this.fillUsername(username).fillPassword(password).submit();
  }
}
