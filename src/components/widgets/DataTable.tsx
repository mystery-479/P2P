type Column = {
  key: string;
  label: string;
  width?: string;
};

type Row = {
  id: string;
  values: Record<string, string | number>;
  status?: string;
  priority?: string;
};

type DataTableProps = {
  columns: Column[];
  rows: Row[];
  onRowClick?: (id: string) => void;
};

const STATUS_VARIANT: Record<string, string> = {
  Open: "badge--status-open",
  "In Progress": "badge--status-in-progress",
  Resolved: "badge--status-resolved",
};

export function DataTable({ columns, rows, onRowClick }: DataTableProps) {
  return (
    <div className="card">
      <table className="table table-compact">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={{ width: col.width }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} onClick={() => onRowClick?.(row.id)}>
              {columns.map((col) => {
                if (col.key === "id") {
                  return (
                    <td key={col.key}>
                      <span className="badge badge--neutral" style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem" }}>
                        {row.id.replace("CL-", "")}
                      </span>
                    </td>
                  );
                }
                if (col.key === "status") {
                  const variant = STATUS_VARIANT[row.status as string] || "badge--neutral";
                  return (
                    <td key={col.key}>
                      <span className={`badge ${variant}`}>{row.status}</span>
                    </td>
                  );
                }
                if (col.key === "priority") {
                  const variant = {
                    Critical: "badge--critical",
                    High: "badge--high",
                    Medium: "badge--medium",
                    Low: "badge--low",
                  }[row.priority as string] || "badge--neutral";
                  return (
                    <td key={col.key}>
                      <span className={`badge ${variant}`}>{row.priority}</span>
                    </td>
                  );
                }
                return <td key={col.key}>{String(row.values[col.key])}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
