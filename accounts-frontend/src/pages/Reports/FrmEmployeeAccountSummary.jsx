import React, { useState, useEffect } from "react";
import { Formik, Form } from "formik";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import Swal from "sweetalert2";

const initialValues = { dcpsNo: "", slipNo: "", yearId: "" };

const FrmEmployeeAccountSummary = () => {
  const { user } = useAuth();
  const token = user?.token;
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [financialYears, setFinancialYears] = useState([]);
  const [isLoadingYears, setIsLoadingYears] = useState(true);

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  // ---- Fetch Financial Years ----
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const res = await axios.get(
          `${BASE_URL}/api/FrmEmployeeAccountSummary/year-list`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        let rows = [];
        if (Array.isArray(res.data)) rows = res.data;
        else if (Array.isArray(res.data?.data)) rows = res.data.data;
        else if (Array.isArray(res.data?.rows)) rows = res.data.rows;
        setFinancialYears(rows);
      } catch (error) {
        Swal.fire({
          text:
            error.response?.data?.message ||
            "Failed to load financial years",
          confirmButtonColor: "#1e3a8a",
        });
      } finally {
        setIsLoadingYears(false);
      }
    };
    if (token) fetchYears();
  }, [token, BASE_URL]);

  // ---- Submit ----
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const dcpsNo = values.dcpsNo?.trim() || null;
      const slipNo = values.slipNo?.trim() || null;

      if ((!dcpsNo && !slipNo) || !values.yearId) {
        Swal.fire({
          text: "Please enter either Employee Number or Slip Number, and select a Financial Year",
          confirmButtonColor: "#1e3a8a",
        });
        setSubmitting(false);
        return;
      }

      const payload = {
        ulbId: Number(user?.ulbId),
        dcpsNo,
        slipNo,
        yearId: Number(values.yearId),
      };

      console.log("PDF Request payload:", payload);

      Swal.fire({
        title: "Generating PDF...",
        text: "Please wait",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await axios.post(
        `${BASE_URL}/api/FrmEmployeeAccountSummary/dcps-interest-pdf`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.close();

      if (res.data?.success && res.data.pdfUrl) {
        window.open(res.data.pdfUrl, "_blank");
        Swal.fire({
          text: "Report generated successfully",
          confirmButtonColor: "#1e3a8a",
        });
      } else {
        throw new Error(res.data?.message || "Invalid response from server");
      }
    } catch (err) {
      console.error("Search Error:", err);
      let errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Error fetching report.";
      if (errorMessage.includes("Message Code")) {
        const match = errorMessage.match(/Message Code\s*:\s*-\d+\s*-\s*(.*)/);
        if (match) errorMessage = match[1];
      }
      Swal.close();
      Swal.fire({
        text: errorMessage,
        confirmButtonColor: "#1e3a8a",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      {({ values, handleChange, isSubmitting }) => (
        <Form>
          <Card className="border shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="text-2xl font-semibold">
                Employee Account Summary Report
              </CardTitle>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 space-y-6">
              <div className="flex justify-center mt-5">
                <div className="grid grid-cols-6 gap-4 w-[1200px] items-center">
                  <Label className="font-bold whitespace-nowrap text-right">
                    कर्मचाऱ्याचा DCPS क्र :
                  </Label>
                  <Input
                    name="dcpsNo"
                    value={values.dcpsNo}
                    onChange={handleChange}
                    placeholder="Enter Employee DCPS No"
                    className="w-full"
                  />

                  <Label className="font-bold whitespace-nowrap text-right">
                    स्लिप क्र :
                  </Label>
                  <Input
                    name="slipNo"
                    value={values.slipNo}
                    onChange={handleChange}
                    placeholder="Enter Slip No"
                    className="w-full"
                  />

                  <Label className="font-bold whitespace-nowrap text-right">
                    आर्थिक वर्ष :
                  </Label>
                  <select
                    name="yearId"
                    value={values.yearId}
                    onChange={handleChange}
                    required
                    disabled={isLoadingYears}
                    className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">
                      {isLoadingYears ? "Loading..." : "Select Year"}
                    </option>
                    {financialYears.map((y) => (
                      <option key={y.NUM_YEAR_ID} value={y.NUM_YEAR_ID}>
                        {y.VAR_YEAR}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-6">
                <div className="flex justify-center gap-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting || isLoading || isLoadingYears}
                  >
                    {isSubmitting ? "Generating..." : "शोधा"}
                  </Button>
                  <Button
                    className="bg-gray-200 text-black hover:bg-gray-300"
                    type="button"
                    onClick={() => navigate("/HomePage/FrmHomePage")}
                  >
                    Back
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </Form>
      )}
    </Formik>
  );
};

export default FrmEmployeeAccountSummary;