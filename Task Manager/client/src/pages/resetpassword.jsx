import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import Textbox from "../components/TextBox";
import Button from "../components/Button";
import Loading from "../components/Loader";
import { toast } from "sonner";

const ResetPassword = () => {
  const { search } = useLocation();
  const navigate = useNavigate();
  const token = new URLSearchParams(search).get("token");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm();

  const onSubmit = async (data) => {
    if (!token) {
      toast.error("Invalid or expired reset link.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/users/confirm-reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: data.newPassword }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
      toast.success("Password reset successfully! Please login.");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      toast.error(err.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white/90 shadow-xl rounded-3xl px-10 pt-10 pb-8 w-full max-w-md flex flex-col gap-8 border border-blue-100"
        style={{ boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)" }}
      >
        <div className="flex flex-col items-center mb-2">
          <div className="bg-blue-100 rounded-full p-3 mb-2">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path fill="#2563eb" d="M12 2a7 7 0 0 1 7 7v2.126c0 .34.138.667.383.908l1.617 1.617A2.25 2.25 0 0 1 22 16.25V17a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5v-.75a2.25 2.25 0 0 1 .617-1.549l1.617-1.617A1.25 1.25 0 0 0 6 11.126V9a7 7 0 0 1 6-7Zm0 2a5 5 0 0 0-5 5v2.126c0 1.02-.405 2-1.126 2.72l-1.617 1.617A.75.75 0 0 0 4 16.25V17a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-.75a.75.75 0 0 0-.217-.533l-1.617-1.617A3.25 3.25 0 0 1 17 11.126V9a5 5 0 0 0-5-5Zm0 10a2 2 0 0 1-2-2h2a2 2 0 0 1 2 2h-2Z"/></svg>
          </div>
          <h2 className="text-2xl font-bold text-blue-700 mb-1">Reset Password</h2>
          <p className="text-gray-500 text-sm text-center max-w-xs">Please enter your new password below. Make sure it is strong and unique.</p>
        </div>
        <Textbox
          type="password"
          name="newPassword"
          label={<span className="font-bold">New Password</span>}
          placeholder="Enter new password"
          className="rounded-full px-6 py-3 border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition w-full text-base"
          register={register("newPassword", {
            required: "Password is required!",
            minLength: { value: 8, message: "At least 8 characters" },
          })}
          error={errors.newPassword?.message}
        />
        <Textbox
          type="password"
          name="confirmPassword"
          label={<span className="font-bold">Confirm Password</span>}
          placeholder="Re-enter new password"
          className="rounded-full px-6 py-3 border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition w-full text-base"
          register={register("confirmPassword", {
            required: "Please confirm your password!",
            validate: (value) => value === watch("newPassword") || "Passwords do not match",
          })}
          error={errors.confirmPassword?.message}
        />
        <Button
          type="submit"
          className="bg-blue-600 text-white font-semibold py-2 rounded-full shadow hover:bg-blue-700 transition"
          label={loading ? <Loading /> : "Reset Password"}
          disabled={loading}
        />
      </form>
    </div>
  );
};

export default ResetPassword;
