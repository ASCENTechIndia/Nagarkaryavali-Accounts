import * as React from "react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

/* ================= BASE TABLE ================= */
function Table({ className, ...props }) {
  return (
    <div className="relative w-full overflow-x-auto">
      <table className={cn("w-full text-sm", className)} {...props} />
    </div>
  );
}

function TableHeader({ className, ...props }) {
  return <thead className={cn("border-b", className)} {...props} />;
}

function TableBody({ className, ...props }) {
  return <tbody className={cn("", className)} {...props} />;
}

function TableRow({ className, ...props }) {
  return (
    <tr
      className={cn(
        "hover:bg-muted/50 border-b transition-colors",
        className
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }) {
  return (
    <th
      className={cn(
        "h-10 px-2 text-center font-semibold text-white bg-[#083c76]",
        className
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }) {
  return (
    <td
      className={cn(
        "p-2 text-center align-middle",
        className
      )}
      {...props}
    />
  );
}

/* ================= MAIN TABLE ================= */
const ShadCNTable = ({
  headers = [],
  data = [],
  keyMapping = {},
  columnStyles = {},
  pagination = false,
  rowsPerPage = 5,
  onSelectAllChange,
  onRowCheckChange,
  className = "",
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / rowsPerPage);

  const paginatedData = pagination
    ? data.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
    : data;

  const isAllChecked =
    data.length > 0 && data.every((row) => !!row.checked);

  const cellBorder = (index) =>
    `border-r border-indigo-200 ${
      index === headers.length - 1 ? "border-r-0" : ""
    }`;

  return (
    <motion.div className="rounded-lg border bg-white shadow-sm">
      {/* HEADER */}
      <Table className="table-fixed w-full">
        <TableHeader>
          <TableRow>
            {headers.map((header, idx) => {
              const key = keyMapping[header];

              return (
                <TableHead
                  key={idx}
                  style={columnStyles[header]}
                  className={`${cellBorder(idx)}`}
                >
                  {key === "checked" ? (
                    <div className="flex justify-center items-center">
                      <Checkbox
                        checked={isAllChecked}
                        onCheckedChange={(checked) =>
                          onSelectAllChange?.(checked)
                        }
                      />
                    </div>
                  ) : (
                    header
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
      </Table>

      {/* BODY */}
      <ScrollArea className="max-h-[380px]">
        <Table className="table-fixed w-full">
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {headers.map((header, colIndex) => {
                    const key = keyMapping[header];

                    return (
                      <TableCell
                        key={colIndex}
                        style={columnStyles[header]}
                        className={cellBorder(colIndex)}
                      >
                        {key === "checked" ? (
                          <div className="flex justify-center items-center">
                            <Checkbox
                              checked={!!row.checked}
                              onCheckedChange={(checked) =>
                                onRowCheckChange?.(row, checked === true)
                              }
                            />
                          </div>
                        ) : (
                          row[key] ?? "-"
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={headers.length}
                  className="py-6 text-center text-red-600"
                >
                  No records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>

      {/* PAGINATION */}
      {pagination && totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 py-3">
          <Button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            Previous
          </Button>

          <span className="font-semibold">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </motion.div>
  );
};

export default ShadCNTable;