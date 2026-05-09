export default function NegDataTable({
  columns = [],
  rows = [],
  keyField = "id",
  emptyMessage = "Sin resultados",
  onRowClick,
  className = "",
}) {
  return (
    <div
      className={`overflow-x-auto rounded-2xl border border-neg-outline-variant/60 bg-neg-surface-container-lowest ${className}`}
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-neg-surface-container-low text-left">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-[11px] uppercase tracking-wider font-semibold text-neg-on-surface-variant ${col.headerClassName ?? ""}`}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center text-neg-on-surface-variant"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row[keyField]}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`border-t border-neg-outline-variant/40 ${
                  onRowClick
                    ? "cursor-pointer hover:bg-neg-surface-container-low"
                    : ""
                }`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-neg-on-surface ${col.cellClassName ?? ""}`}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
