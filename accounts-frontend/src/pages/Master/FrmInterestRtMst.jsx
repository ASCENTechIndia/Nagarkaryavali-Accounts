import React, { useEffect, useState } from "react";
import { Formik, Form } from "formik";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import Swal from "sweetalert2";
import { DatePicker } from "@/components/ui/calendar";

const initialValues = {
  interestId: "",
  fromDate: null,
  toDate: null,
  interestRate: "",
};

const FrmInterestRtMst = () => {
  const { user } = useAuth();
  const token = user?.token;
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, data } = location.state || {};
  const [formValues, setFormValues] = useState(initialValues);
  const [isLoading, setIsLoading] = useState(false);

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const formatDateForApi = (dateObj) => {
    if (!dateObj || !(dateObj instanceof Date) || isNaN(dateObj)) return null;
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const parseDateFromApi = (dateString) => {
    if (!dateString) return null;

    if (typeof dateString === "string" && dateString.includes("T")) {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return null;
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }

    if (typeof dateString === "string" && dateString.includes("-")) {
      const parts = dateString.split("-");
      if (parts[0].length === 4) {
        return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      } else if (parts[2].length === 4) {
        return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      }
    }

    const parsed = new Date(dateString);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  const fetchInterestById = async (id) => {
    try {
      setIsLoading(true);
      Swal.fire({
        title: "Loading ...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await axios.post(
        `${BASE_URL}/api/InterestMst/interestbyid`,
        {
          interestId: id,
          ulbId: Number(user?.ulbId),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const apiData = res.data?.data?.data?.[0];

      if (apiData) {
        const newValues = {
          interestId: apiData.INTEREST_ID ?? id,
          fromDate: parseDateFromApi(apiData.FROM_DATE),
          toDate: parseDateFromApi(apiData.TO_DATE),
          interestRate: apiData.INTEREST_RATE ?? "",
        };
        setFormValues(newValues);
        console.log("Fetched interest:", newValues);
      }
      Swal.close();
      setIsLoading(false);
    } catch (err) {
      console.error("Error:", err);
      Swal.close();
      setIsLoading(false);
    }
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      if (!values.fromDate || !values.toDate) {
        Swal.fire({
          text: "From Date and To Date are required",
          confirmButtonColor: "#1e3a8a",
        });
        setSubmitting(false);
        return;
      }

      if (values.toDate < values.fromDate) {
        Swal.fire({
          text: "To Date cannot be earlier than From Date",
          confirmButtonColor: "#1e3a8a",
        });
        setSubmitting(false);
        return;
      }

      const interestIdForUpdate =
        mode === 2 ? data?.interestId ?? formValues.interestId : 0;

      const payload = {
        mode: mode === 2 ? 2 : 1,
        ulbId: Number(user?.ulbId),
        interestId: interestIdForUpdate,
        fromDate: formatDateForApi(values.fromDate),
        toDate: formatDateForApi(values.toDate),
        interestRate: Number(values.interestRate),
        userId: user?.userId,
      };

      console.log("Save payload:", payload);

      Swal.fire({
        title: "Saving...",
        text: "Please wait",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await axios.post(
        `${BASE_URL}/api/InterestMst/saveinterest`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      Swal.close();

      const inner = res.data?.data ?? res.data;
      const successFlag =
        res.data?.ok === true ||
        res.data?.success === true ||
        inner?.success === true;

      if (successFlag) {
        Swal.fire({
          text: inner?.message || "Successfully saved",
          confirmButtonColor: "#1e3a8a",
        }).then(() => {
          navigate("/Masters/FrmInterestRtList");
        });
      } else {
        let errorMessage =
          inner?.message ||
          inner?.errorMsg ||
          res.data?.message ||
          res.data?.errorMsg ||
          res.data?.error ||
          "Error saving data.";

        if (errorMessage.includes("Message Code")) {
          const match = errorMessage.match(/Message Code\s*:\s*-\d+\s*-\s*(.*)/);
          if (match) errorMessage = match[1];
        }

        Swal.fire({ text: errorMessage, confirmButtonColor: "#1e3a8a" });
      }
    } catch (err) {
      console.error("Save Error:", err);
      Swal.close();

      let errorMessage =
        err.response?.data?.data?.message ||
        err.response?.data?.data?.errorMsg ||
        err.response?.data?.message ||
        err.response?.data?.errorMsg ||
        err.response?.data?.error ||
        "Error saving data.";

      if (errorMessage.includes("Message Code")) {
        const match = errorMessage.match(/Message Code\s*:\s*-\d+\s*-\s*(.*)/);
        if (match) errorMessage = match[1];
      }

      Swal.fire({ text: errorMessage, confirmButtonColor: "#1e3a8a" });
    }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    const interestId = data?.interestId ?? formValues.interestId;
    if (!interestId) {
      Swal.fire({ text: "Interest ID not found"});
      return;
    }

    const confirm = await Swal.fire({
      text: "Delete this interest rate record?",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    try {
      Swal.fire({
        title: "Deleting...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const payload = {
        mode: 3,
        ulbId: Number(user?.ulbId),
        interestId,
        fromDate: formatDateForApi(formValues.fromDate),
        toDate: formatDateForApi(formValues.toDate),
        interestRate: Number(formValues.interestRate),
        userId: user?.userId,
      };

      console.log("Delete payload:", payload);

      const res = await axios.post(
        `${BASE_URL}/api/InterestMst/saveinterest`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.close();

      const inner = res.data?.data ?? res.data;
      const successFlag =
        res.data?.ok === true ||
        res.data?.success === true ||
        inner?.success === true;

      if (successFlag) {
        Swal.fire({
          text: inner?.message || "Deleted successfully",
          confirmButtonColor: "#1e3a8a",
        }).then(() => navigate("/Masters/FrmInterestRtList"));
      } else {
        let errorMessage =
          inner?.message ||
          inner?.errorMsg ||
          "Error deleting record.";
        if (errorMessage.includes("Message Code")) {
          const match = errorMessage.match(/Message Code\s*:\s*-\d+\s*-\s*(.*)/);
          if (match) errorMessage = match[1];
        }
        Swal.fire({ text: errorMessage, confirmButtonColor: "#1e3a8a" });
      }
    } catch (err) {
      console.error("Delete Error:", err);
      Swal.close();
      Swal.fire({
        text: err.response?.data?.message || "Error deleting record.",
        confirmButtonColor: "#1e3a8a",
      });
    }
  };

  useEffect(() => {
    if (mode === 2 && data?.interestId) {
      fetchInterestById(data.interestId);
    }
  }, [mode, data]);

  return (
    <Formik
      initialValues={formValues}
      enableReinitialize={true}
      onSubmit={handleSubmit}
    >
      {({ values, handleChange, setFieldValue, isSubmitting }) => {
        return (
          <Form>
            <Card className="border shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="text-2xl font-semibold">
                  {mode === 2 ? "Edit Interest Rate Master" : "Interest Rate Master"}
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 space-y-6">
                <div className="flex justify-center mt-10">
                  <div className="grid grid-cols-2 gap-4 w-[800px]">
                    <Label className="font-bold whitespace-nowrap">
                      From Date <span className="text-red-500">*</span> :
                    </Label>
                    <Label className="font-bold whitespace-nowrap">
                      To Date <span className="text-red-500">*</span> :
                    </Label>

                    <div className="w-full">
                      <DatePicker
                        value={values.fromDate}
                        onChange={(date) => setFieldValue("fromDate", date)}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="w-full">
                      <DatePicker
                        value={values.toDate}
                        onChange={(date) => setFieldValue("toDate", date)}
                        disabled={isLoading}
                      />
                    </div>

                    <Label className="font-bold whitespace-nowrap">
                      Interest Rate (%) <span className="text-red-500">*</span> :
                    </Label>
                    <div></div>

                    <Input
                      type="number"
                      step="0.01"
                      name="interestRate"
                      value={values.interestRate || ""}
                      onChange={handleChange}
                      required
                      className="w-full sm:flex-1"
                    />
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex justify-center gap-4">

                    <Button
                      type="submit"
                      disabled={isSubmitting || isLoading}
                    >
                      {isSubmitting
                        ? mode === 2
                          ? "Updating..."
                          : "Saving..."
                        : mode === 2
                        ? "Update"
                        : "Save"}
                    </Button>

                    {mode === 2 && (
                      <Button
                        className="bg-red-600 text-white hover:bg-red-700"
                        type="button"
                        onClick={handleDelete}
                        disabled={isSubmitting || isLoading}
                      >
                        Delete
                      </Button>
                    )}

                    <Button
                      className="bg-gray-200 text-black hover:bg-gray-300"
                      type="button"
                      onClick={() => navigate("/Masters/FrmInterestRtList")}
                    >
                      Cancel
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

export default FrmInterestRtMst;