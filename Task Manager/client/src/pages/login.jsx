import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import Textbox from "../components/TextBox";
import Button from "../components/Button";
import { useDispatch, useSelector } from "react-redux";
import { useLoginMutation } from "../redux/slices/api/authApiSlice";
import { setCredentials } from "../redux/slices/authSlice";
import Loading from "../components/Loader";
import ReCAPTCHA from "react-google-recaptcha";
import { toast } from "sonner";

const Login = () => {
  const { user } = useSelector((state) => state.auth);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [showCaptcha, setShowCaptcha] = useState(true);
  const [captchaValue, setCaptchaValue] = useState(null);
  const [showReset, setShowReset] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    formState: { errors: errorsReset },
    reset: resetResetForm,
  } = useForm();

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [login, { isLoading }] = useLoginMutation();

  const handleCaptchaChange = (value) => {
    setCaptchaValue(value);
  };

  useEffect(() => {
    user && navigate("/dashboard");
  }, [user]);

  const submitHandler = async (data) => {
    try {

      if (showCaptcha && !captchaValue) {
        alert("Vui lòng xác thực CAPTCHA!");
        return;
      }

      const formData = new URLSearchParams();
      formData.append("email", data.email);
      formData.append("password", data.password);
      if (captchaValue) {
        formData.append("captchaToken", captchaValue);
      }

      const response = await fetch("/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message);
      }

      window.location.reload();
      setLoginAttempts(0);
      setShowCaptcha(false);
      setCaptchaValue(null);
      dispatch(setCredentials(result));
      navigate("/dashboard");

    } catch (error) {

      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);

      if (newAttempts >= 3) {
        setShowCaptcha(true);
      }

      alert(error.message);
    }
  };

  const handleResetPassword = async (data) => {
    setResetLoading(true);
    try {
      const response = await fetch("/api/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      toast.success("Password reset! Please check your email.");
      setShowReset(false);
      resetResetForm();
    } catch (err) {
      toast.error(err.message || "Reset password failed");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center flex-col lg:flex-row bg-[#f3f4f6]">
      <div className="w-full md:w-auto flex gap-0 md:gap-40 flex-col md:flex-row items-center justify-center">
        <div className="h-full w-full lg:w-2/3 flex flex-col items-center justify-center">
          <div className="w-full md:max-w-lg 2xl:max-w-3xl flex flex-col items-center justify-center gap-5 md:gap-y-10 2xl:-mt-20">
            <span className="flex gap-1 py-1 px-3 border rounded-full text-sm md:text-base bordergray-300 text-gray-600">
              Manage all your task in one place!
            </span>
            <p className="flex flex-col gap-0 md:gap-4 text-4xl md:text-6xl 2xl:text-7xl font-black text-center text-blue-700">
              <span>Cloud-Based</span>
              <span>Task Manager</span>
            </p>
            <div className="cell">
              <div className="circle rotate-in-up-left"></div>
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/3 p-4 md:p-1 flex flex-col justify-center items-center">
          {showReset ? (
            <form
              onSubmit={handleSubmitReset(handleResetPassword)}
              className="form-container w-full md:w-[400px] flex flex-col gap-y-8 bg-white px-10 pt-14 pb-14"
            >
              <div className="">
                <p className="text-blue-600 text-2xl font-bold text-center mb-2">
                  Reset Password
                </p>
                <Textbox
                  id="reset-email"
                  placeholder="Enter your email"
                  type="email"
                  name="email"
                  label="Email"
                  className="w-full rounded-full"
                  register={registerReset("email", {
                    required: "Email is required!",
                  })}
                  error={errorsReset.email ? errorsReset.email.message : ""}
                />
              </div>
              <Button
                type="submit"
                label={resetLoading ? "Sending..." : "Send Reset Email"}
                className="w-full h-10 bg-blue-700 text-white rounded-full"
                disabled={resetLoading}
              />
              <span
                className="text-sm text-gray-500 hover:text-blue-600 hover:underline cursor-pointer text-center"
                onClick={() => setShowReset(false)}
              >
                Back to Login
              </span>
            </form>
          ) : (
            <form
              onSubmit={handleSubmit(submitHandler)}
              className="form-container w-full md:w-[400px] flex flex-col gap-y-8 bg-white px-10 pt-14 pb-14"
            >
              <div className="">
                <p className="text-blue-600 text-3xl font-bold text-center">
                  Welcome back!
                </p>
                <p className="text-center text-base text-gray-700 ">
                  Keep all your credential safe.
                </p>
              </div>

              <div className="flex flex-col gap-y-5">
                <Textbox
                  id="email"
                  placeholder="email@example.com"
                  type="email"
                  name="email"
                  label="Email"
                  className="w-full rounded-full"
                  register={register("email", {
                    required: "Email Address is required!",
                  })}
                  error={errors.email ? errors.email.message : ""}
                />
                <Textbox
                  id="password"
                  placeholder="Password"
                  type="password"
                  name="password"
                  label="Password"
                  className="w-full rounded-full"
                  register={register("password", {
                    required: "Password is required!",
                  })}
                  error={errors.password ? errors.password.message : ""}
                  autocomplete="current-password"
                />

                {showCaptcha && (
                  <div className="flex justify-center mt-4">
                    <ReCAPTCHA
                      sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                      onChange={handleCaptchaChange}
                    />
                  </div>
                )}

                {loginAttempts > 0 && (
                  <span className="text-sm text-red-500 text-center">
                    {`Số lần thử còn lại: ${5 - loginAttempts}`}
                  </span>
                )}

                <span
                  className="text-sm text-gray-500 hover:text-blue-600 hover:underline cursor-pointer text-center"
                  onClick={() => setShowReset(true)}
                >
                  Forgot Password?
                </span>

                {isLoading ? (
                  <Loading />
                ) : (
                  <Button
                    type="submit"
                    label="Submit"
                    className="w-full h-10 bg-blue-700 text-white rounded-full"
                  />
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
