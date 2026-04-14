import { useState } from "react";
import axios from "axios";
import { Formik, Form } from "formik";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import GetIPAddress from "@/utils/ipHelper";
import config from "@/utils/config";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const Login = () => {
  const navigate = useNavigate();
  const { loginAdmin } = useAuth();

  const [captchaValue, setCaptchaValue] = useState(generateCaptcha());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function generateCaptcha() {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let captcha = "";
    for (let i = 0; i < 5; i++) {
      captcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return captcha;
  }

  const refreshCaptcha = () => setCaptchaValue(generateCaptcha());

  const blockClipboard = (e) => e.preventDefault();

  return (
    <div className="min-h-screen bg-white">

      {/* HEADER */}
      <header className="bg-[#184aa6] px-6 py-3 shadow-sm flex items-center gap-4">
        <img src="/logo.png" className="h-14 w-14 rounded" />
        <h1 className="text-white text-xl sm:text-3xl font-bold">
           मालेगाव महानगरपालिका
        </h1>
      </header>

      {/* MAIN */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
        <div className="bg-white rounded-3xl border border-gray-400 shadow-[0px_10px_30px_10px_rgba(0,0,0,0.2)] overflow-hidden max-w-3xl w-full flex lg:flex-row relative">


          {/* LEFT DESIGN */}
          <div
            className="hidden lg:flex relative shrink-0 z-5 items-center justify-center bg-[#bad2fa]"
            style={{ width: '50%' }}
          >
            <div className="absolute -right-110 top-40 -translate-y-1/2
                            w-160 h-160 bg-white rounded-full" />
            <div className="absolute left-36 top-1/2 -translate-y-1/2 w-32.5 h-32.5 rounded-full  bg-[#184aa6] border-10        border-white flex items-center justify-center z-20">
              <img src="/login-label.png" alt="Login" className="w-16 h-16 object-contain sha" />
            </div>
          </div>

          {/* RIGHT FORM */}
          <div className="p-8 w-full z-10 lg:w-1/2">

            <Formik
              initialValues={{
                in_UserId: "",
                in_password: "",
                captcha: "",
              }}
              onSubmit={async (values) => {
                setError("");

                if (values.captcha !== captchaValue) {
                  setError("Invalid CAPTCHA");
                  refreshCaptcha();
                  return;
                }

                setLoading(true);

                try {
                  const ip = await GetIPAddress();

                  const payload = {
                    userId: values.in_UserId,
                    password: values.in_password,
                    macaddr: "WEB-LOCAL",
                    ipaddr: ip,
                    hostname: window.location.hostname,
                    source: config.source,
                    deptId: config.deptId,
                  };

                  const res = await axios.post(
                    `${BASE_URL}/api/auth/login-proc`,
                    payload
                  );

                  if (res.data?.ok && res.data?.data?.token) {
                    const { token, user } = res.data.data;

                    loginAdmin(user, token);
                    localStorage.setItem("token", token);
                    localStorage.setItem("user", JSON.stringify(user));

                    navigate("/about");
                    // navigate("/dashboard");
                  } else {
                    setError(res.data?.message || "Login failed");
                    refreshCaptcha();
                  }
                } catch (err) {
                  setError(
                    err.response?.data?.message || "Server error"
                  );
                  refreshCaptcha();
                } finally {
                  setLoading(false);
                }
              }}
            >
              {({ values, handleChange }) => (
                <Form className="space-y-6">

                  {/* USERNAME */}
                  <div className="flex gap-3">
                    <img src="/username.png" className="w-10 h-10" />
                    <div className="flex-1">
                      <Label>Username</Label>
                      <Input
                        name="in_UserId"
                        value={values.in_UserId}
                        onChange={handleChange}
                        placeholder="Enter username"
                        onCopy={blockClipboard}
                        onPaste={blockClipboard}
                      />
                    </div>
                  </div>

                  {/* PASSWORD */}
                  <div className="flex gap-3">
                    <img src="/password.png" className="w-10 h-10" />
                    <div className="flex-1">
                      <Label>Password</Label>
                      <Input
                        type="password"
                        name="in_password"
                        value={values.in_password}
                        onChange={handleChange}
                        placeholder="Enter password"
                        onCopy={blockClipboard}
                        onPaste={blockClipboard}
                      />
                    </div>
                  </div>

                  {/* CAPTCHA */}
                  <div className="flex gap-3">
                    <img src="/captcha.png" className="w-10 h-10" />
                    <div className="flex-1">
                      <div className="flex gap-2 mb-2">
                        <div className="px-3 py-2 bg-gray-200 font-bold rounded">
                          {captchaValue}
                        </div>
                        <Button type="button" onClick={refreshCaptcha}>
                          Refresh
                        </Button>
                      </div>

                      <Input
                        name="captcha"
                        value={values.captcha}
                        onChange={handleChange}
                        placeholder="Enter CAPTCHA"
                      />
                    </div>
                  </div>


                  {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm text-center">
                      {error}
                    </div>
                  )}
                  {/* BUTTON */}
                  <Button className="w-full" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                  </Button>

                </Form>
              )}
            </Formik>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;