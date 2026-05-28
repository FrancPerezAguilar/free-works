import * as React from "react";
import { cn } from "@/lib/utils";

const Badge = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn("inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full", className)}
    {...props}
  />
);

export { Badge };
