import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "@/__tests__/test-utils";
import { ChangePasswordCard } from "../ChangePasswordCard";

describe("ChangePasswordCard", () => {
  const onSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders password fields and submit action", () => {
    render(<ChangePasswordCard isLoading={false} onSubmit={onSubmit} />);

    expect(screen.getByRole("heading", { name: /change password/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /update password/i })).toBeDisabled();
  });

  it("validates password confirmation before submit", async () => {
    const user = userEvent.setup();
    render(<ChangePasswordCard isLoading={false} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/current password/i), "currentpass");
    await user.type(screen.getByLabelText(/^new password$/i), "newpassword123");
    await user.type(screen.getByLabelText(/confirm new password/i), "differentpass");

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /update password/i })).toBeDisabled();
  });

  it("submits valid password values and clears the form", async () => {
    const user = userEvent.setup();
    onSubmit.mockResolvedValue(undefined);
    render(<ChangePasswordCard isLoading={false} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/current password/i), "currentpass");
    await user.type(screen.getByLabelText(/^new password$/i), "newpassword123");
    await user.type(screen.getByLabelText(/confirm new password/i), "newpassword123");
    await user.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith("currentpass", "newpassword123");
    });
    await waitFor(() => {
      expect(screen.getByLabelText(/current password/i)).toHaveValue("");
      expect(screen.getByLabelText(/^new password$/i)).toHaveValue("");
      expect(screen.getByLabelText(/confirm new password/i)).toHaveValue("");
    });
  });
});
