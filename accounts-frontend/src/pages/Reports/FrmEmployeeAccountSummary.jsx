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

const initialValues = {
  dcpsNo: "",
  yearId: "",
};

const FrmEmployeeAccountSummary = () => {
  const { user } = useAuth();
  const token = user?.token;
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [financialYears, setFinancialYears] = useState([]);
  const [isLoadingYears, setIsLoadingYears] = useState(true);

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  // ---------------------------------------------------------------
  // Fetch Financial Years
  // ---------------------------------------------------------------
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const res = await axios.get(
          `${BASE_URL}/api/FrmEmployeeAccountSummary/year-list`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log("Year-list raw response:", res.data);

        let rows = [];
        if (Array.isArray(res.data)) {
          rows = res.data;
        } else if (Array.isArray(res.data?.data)) {
          rows = res.data.data;
        } else if (Array.isArray(res.data?.rows)) {
          rows = res.data.rows;
        }

        console.log("Parsed years:", rows);
        setFinancialYears(rows);
      } catch (error) {
        console.error("Error fetching financial years:", error);
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

    if (token) {
      fetchYears();
    }
  }, [token, BASE_URL]);

  // ---------------------------------------------------------------
  // Submit → Generate PDF
  // ---------------------------------------------------------------
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      if (!values.dcpsNo || !values.yearId) {
        Swal.fire({
          text: "DCPS Number and Financial Year are required",
          confirmButtonColor: "#1e3a8a",
        });
        setSubmitting(false);
        return;
      }

      const payload = {
        ulbId: Number(user?.ulbId),
        dcpsNo: values.dcpsNo,
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
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      Swal.close();

      if (res.data && res.data.success && res.data.pdfUrl) {
        window.open(res.data.pdfUrl, "_blank");

        Swal.fire({
          text: "Report generated successfully",
          confirmButtonColor: "#1e3a8a",
        });
      } else {
        throw new Error(
          res.data?.message || "Invalid response from server"
        );
      }
    } catch (err) {
      console.error("Search Error:", err);

      let errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Error fetching report.";

      if (errorMessage.includes("Message Code")) {
        const match = errorMessage.match(
          /Message Code\s*:\s*-\d+\s*-\s*(.*)/
        );
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
      {({ values, handleChange, isSubmitting }) => {
        return (
          <Form>
            <Card className="border shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="text-2xl font-semibold">
                  Employee Account Summary Report
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 space-y-6">
                <div className="flex justify-center mt-5">
                  <div className="grid grid-cols-4 gap-6 w-[1000px] items-center">
                    <Label className="font-bold whitespace-nowrap text-right">
                      कर्मचाऱ्याचा क्र{" "}
                      <span className="text-red-500">*</span> :
                    </Label>

                    <Input
                      name="dcpsNo"
                      value={values.dcpsNo}
                      onChange={handleChange}
                      placeholder="Enter Employee Number"
                      required
                      className="w-full"
                    />

                    <Label className="font-bold whitespace-nowrap text-right">
                      आर्थिक वर्ष <span className="text-red-500">*</span> :
                    </Label>

                    <select
                      name="yearId"
                      value={values.yearId}
                      onChange={handleChange}
                      required
                      disabled={isLoadingYears}
                      className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">
                        {isLoadingYears
                          ? "Loading..."
                          : "Select Financial Year"}
                      </option>
                      {financialYears.map((year) => (
                        <option
                          key={year.NUM_YEAR_ID}
                          value={year.NUM_YEAR_ID}
                        >
                          {year.VAR_YEAR}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex justify-center gap-4">
                    <Button
                      type="submit"
                      disabled={
                        isSubmitting || isLoading || isLoadingYears
                      }
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
        );
      }}
    </Formik>
  );
};

export default FrmEmployeeAccountSummary;