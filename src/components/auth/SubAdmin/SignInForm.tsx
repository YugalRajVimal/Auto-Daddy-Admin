import { useState } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import Label from "../../form/Label";
import Input from "../../form/input/InputField";
import Button from "../../ui/button/Button";
import Alert from "../../ui/alert/Alert";
import { FormFieldError } from "../../../lib/validation/formUi";
import {
  signInEmailSchema,
  signInOtpSchema,
  type SignInEmailValues,
  type SignInOtpValues,
} from "../../../lib/validation/schemas/identity";

interface AlertState {
  isEnable: boolean;
  variant: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
}

export default function SignInForm() {
  const navigate = useNavigate();
  const [isOTPFieldsVisible, setIsOTPFormVisible] = useState(false);

  const {
    handleSubmit: handleEmailSubmit,
    watch: watchEmail,
    setValue: setEmailValue,
    formState: { errors: emailErrors },
  } = useForm<SignInEmailValues>({
    resolver: zodResolver(signInEmailSchema),
    mode: "onSubmit",
    defaultValues: { email: "" },
  });
  const email = watchEmail("email");

  const {
    handleSubmit: handleOtpSubmit,
    watch: watchOtp,
    setValue: setOtpValue,
    formState: { errors: otpErrors },
  } = useForm<SignInOtpValues>({
    resolver: zodResolver(signInOtpSchema),
    mode: "onSubmit",
    defaultValues: { otp: "" },
  });
  const otp = watchOtp("otp");

  const [alert, setAlert] = useState<AlertState>({
    isEnable: false,
    variant: "info",
    title: "",
    message: "",
  });

  const clearAlert = () => {
    setAlert({
      isEnable: false,
      variant: "info",
      title: "",
      message: "",
    });
  };

  // Send OTP
  const handleGetOTP = async (values: SignInEmailValues) => {
    clearAlert();

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/signin`,
        { email: values.email, role: "SubAdmin" }
      );

      setAlert({
        isEnable: true,
        variant: "success",
        title: "Success",
        message: res.data.message || "OTP sent to your email!",
      });
      setIsOTPFormVisible(true);
    } catch (err: any) {
      setAlert({
        isEnable: true,
        variant: "error",
        title: "Error",
        message: err.response?.data?.message || "Failed to send OTP.",
      });
    }
  };

  // Verify OTP
  const handleLogIn = async (values: SignInOtpValues) => {
    clearAlert();

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/verify-account`,
        { email, otp: values.otp, role: "SubAdmin" }
      );

      setAlert({
        isEnable: true,
        variant: "success",
        title: "Success",
        message: res.data.message || "OTP verified successfully!",
      });

      // Store token in localStorage
      if (res.data.token) {
        localStorage.setItem("sub-admin-token", res.data.token);
      }

      // Navigate to dashboard
      setTimeout(() => navigate("/sub-admin"), 1000);
    } catch (err: any) {
      setAlert({
        isEnable: true,
        variant: "error",
        title: "OTP Verification Failed",
        message:
          err.response?.data?.message || "Invalid OTP. Please try again.",
      });
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-4">
            {alert.isEnable && (
              <Alert
                variant={alert.variant as any}
                title={alert.title}
                message={alert.message}
              />
            )}
          </div>

          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sub Admin Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email to sign in!
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <Label>
                Email <span className="text-error-500">*</span>
              </Label>
              <Input
                placeholder="info@gmail.com"
                name="email"
                value={email}
                onChange={(e) => {
                  setEmailValue("email", e.target.value, { shouldValidate: false });
                  clearAlert();
                }}
              />
              <FormFieldError message={emailErrors.email?.message} />
            </div>

            <div className={`${isOTPFieldsVisible ? "block" : "hidden"}`}>
              <Label>
                OTP <span className="text-error-500">*</span>
              </Label>
              <Input
                type="number"
                placeholder="Enter OTP"
                name="otp"
                value={otp}
                onChange={(e) => {
                  setOtpValue("otp", e.target.value, { shouldValidate: false });
                  clearAlert();
                }}
              />
              <FormFieldError message={otpErrors.otp?.message} />
            </div>

            <div>
              {isOTPFieldsVisible ? (
                <Button onClick={handleOtpSubmit(handleLogIn)} className="w-full" size="sm">
                  Verify & Sign In
                </Button>
              ) : (
                <Button onClick={handleEmailSubmit(handleGetOTP)} className="w-full" size="sm">
                  Get OTP
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
