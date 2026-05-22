import * as React from "react"
import { cn } from "@/lib/utils"
import { useState } from "react";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

function Table({
  className,
  ...props
}) {
  return (
    <div data-slot="table-container" className="relative w-full">
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props} />
    </div>
  );
}

function TableHeader({
  className,
  ...props
}) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props} />
  );
}

function TableBody({
  className,
  ...props
}) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props} />
  );
}

function TableFooter({
  className,
  ...props
}) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn("bg-muted/50 border-t font-medium [&>tr]:last:border-b-0", className)}
      {...props} />
  );
}

function TableRow({
  className,
  ...props
}) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
        className
      )}
      {...props} />
  );
}

function TableHead({
  className,
  ...props
}) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props} />
  );
}

function TableCell({
  className,
  ...props
}) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props} />
  );
}

function TableCaption({
  className,
  ...props
}) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props} />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}


const fadeInUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
  transition: { duration: 0.4, ease: "easeOut" },
};

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
    `border-r border-indigo-200 ${index === headers.length - 1 ? "border-r-0" : ""
    }`;

  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      exit="exit"
      className="rounded-lg border border-indigo-200 bg-white shadow-lg"
    >
      {/* ✅ HORIZONTAL SCROLLER */}
      <div className="overflow-x-auto">
        <div className={cn("w-auto", className)}>
          {/* <div className="w-auto">  */}

          {/* ✅ FIXED HEADER */}
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow>
                {headers.map((header, idx) => {
                  const key = keyMapping[header];

                  return (
                    <TableHead
                      key={idx}
                      style={columnStyles[header]}
                      // className={`bg-[#083c76] text-white text-center font-semibold ${cellBorder(
                      //   idx
                      // )}`}
                      className={`bg-[#083c76] text-white text-center font-semibold 
                        ${cellBorder(idx)}
                        whitespace-normal break-words leading-tight
                        px-2 py-3 align-middle`}

                    >
                      {key === "checked" ? (
                        <Checkbox
                          checked={isAllChecked}
                          onCheckedChange={(checked) =>
                            onSelectAllChange?.(checked)
                          }
                        />
                      ) : (
                        header
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
          </Table>

          <ScrollArea className="max-h-[380px]  overflow-y-auto custom-scrollbar"  style={{ scrollbarGutter: "stable" }}>
            <Table className="table-fixed w-full">
              <TableBody className="text-center">
                {paginatedData.length > 0 ? (
                  paginatedData.map((row, rowIndex) => (
                    <TableRow
                      key={rowIndex}
                      className="hover:bg-indigo-50 border-b border-indigo-100"
                    >
                      {headers.map((header, colIndex) => {
                        const key = keyMapping[header];

                        return (
                          <TableCell
                            key={colIndex}
                            style={columnStyles[header]}
                            // className={cellBorder(colIndex)}
                            className={`${cellBorder(colIndex)} 
                              whitespace-normal break-words leading-tight
                              px-2 py-3 align-middle`}
                            title={typeof row[key] === "string" ? row[key] : ""}
                          >
                            {key === "rowcheck" || key === "checked" ? (
                              <Checkbox
                                checked={!!row.checked}
                                onCheckedChange={(checked) =>
                                  onRowCheckChange?.(row, checked === true)
                                }
                              />
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

        </div>
      </div>

      {/* ✅ PAGINATION */}
      {pagination && totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 py-3">
          <button
            className="border border-indigo-300 rounded px-3 py-1"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            Previous
          </button>
          <span className="font-semibold">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="border border-indigo-300 rounded px-3 py-1"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </motion.div>
  );
};


export default ShadCNTable;