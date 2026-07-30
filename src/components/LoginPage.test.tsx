import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  signInMock: vi.fn(),
  setAppSessionMock: vi.fn(),
}));

vi.mock("../lib/firebase", () => ({
  signInOrCreateWithPassword: mocks.signInMock,
  toLoginEmail: (value: string) => (value.includes("@") ? value : `${value}@uniodonto.com`),
}));

vi.mock("../context/AppSessionContext", () => ({
  setAppSession: mocks.setAppSessionMock,
}));

import { fireEvent, render, screen } from "@testing-library/react";
import { LoginPage } from "./LoginPage";

describe("LoginPage", () => {
  beforeEach(() => {
    localStorage.clear();
    mocks.signInMock.mockReset();
    mocks.setAppSessionMock.mockReset();
  });

  it("shows a validation error for invalid credentials", async () => {
    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText("Seu usuário ou e-mail"), {
      target: { value: "diretoria" },
    });
    fireEvent.change(screen.getByPlaceholderText("Sua senha de acesso"), {
      target: { value: "123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /entrar no painel/i }));

    expect(await screen.findByText(/pelo menos 6 caracteres/i)).toBeInTheDocument();
    expect(mocks.signInMock).not.toHaveBeenCalled();
  });
});
