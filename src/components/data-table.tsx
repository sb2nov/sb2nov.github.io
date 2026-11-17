"use client";

import { withBasePath } from "@/lib/base-path";
import { useEffect, useMemo, useState } from "react";

type Row = Record<string, unknown>;

export interface DataTableColumn {
	field: string;
	label?: string;
	align?: "left" | "center" | "right";
	sortable?: boolean;
}

/**
 * Renders a table from a JSON array (inline `rows` or a `src` URL), with optional search,
 * column sorting, and pagination. Replaces al-folio's Bootstrap Table integration.
 */
export function DataTable({
	src,
	rows: inlineRows,
	columns,
	search = false,
	pageSize,
}: {
	src?: string;
	rows?: Row[];
	columns: DataTableColumn[];
	search?: boolean;
	pageSize?: number;
}) {
	const [fetchedRows, setFetchedRows] = useState<Row[] | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [query, setQuery] = useState("");
	const [sort, setSort] = useState<{ field: string; direction: 1 | -1 } | null>(null);
	const [page, setPage] = useState(0);

	useEffect(() => {
		if (!src || inlineRows) return;
		let cancelled = false;
		fetch(withBasePath(src))
			.then((response) => {
				if (!response.ok) throw new Error(`HTTP ${response.status}`);
				return response.json() as Promise<Row[]>;
			})
			.then((data) => {
				if (!cancelled) setFetchedRows(Array.isArray(data) ? data : []);
			})
			.catch((reason: unknown) => {
				if (!cancelled) setError(reason instanceof Error ? reason.message : String(reason));
			});
		return () => {
			cancelled = true;
		};
	}, [src, inlineRows]);

	const rows = inlineRows ?? fetchedRows;

	const visibleRows = useMemo(() => {
		if (!rows) return [];
		const needle = query.trim().toLowerCase();
		const filtered = needle
			? rows.filter((row) =>
					columns.some((column) =>
						String(row[column.field] ?? "")
							.toLowerCase()
							.includes(needle)
					)
				)
			: rows;
		if (!sort) return filtered;
		return [...filtered].sort((a, b) => {
			const left = a[sort.field];
			const right = b[sort.field];
			if (typeof left === "number" && typeof right === "number") return (left - right) * sort.direction;
			return String(left ?? "").localeCompare(String(right ?? ""), undefined, { numeric: true }) * sort.direction;
		});
	}, [rows, columns, query, sort]);

	const pageCount = pageSize ? Math.max(1, Math.ceil(visibleRows.length / pageSize)) : 1;
	const currentPage = Math.min(page, pageCount - 1);
	const pageRows = pageSize ? visibleRows.slice(currentPage * pageSize, (currentPage + 1) * pageSize) : visibleRows;

	function toggleSort(field: string) {
		setSort((current) =>
			current?.field === field ? { field, direction: current.direction === 1 ? -1 : 1 } : { field, direction: 1 }
		);
	}

	if (error) return <p className="muted">Could not load table data ({error}).</p>;

	return (
		<div className="data-table">
			{search ? (
				<input
					type="search"
					className="data-table-search"
					value={query}
					onChange={(event) => {
						setQuery(event.target.value);
						setPage(0);
					}}
					placeholder="Search"
					aria-label="Search table"
				/>
			) : null}
			<div className="data-table-scroll">
				<table>
					<thead>
						<tr>
							{columns.map((column) => {
								const label = column.label ?? column.field;
								const direction = sort?.field === column.field ? sort.direction : 0;
								return (
									<th
										key={column.field}
										style={{ textAlign: column.align }}
										aria-sort={direction === 1 ? "ascending" : direction === -1 ? "descending" : undefined}
									>
										{column.sortable ? (
											<button type="button" onClick={() => toggleSort(column.field)}>
												{label} {direction === 1 ? "▲" : direction === -1 ? "▼" : "↕"}
											</button>
										) : (
											label
										)}
									</th>
								);
							})}
						</tr>
					</thead>
					<tbody>
						{rows === null ? (
							<tr>
								<td colSpan={columns.length}>Loading…</td>
							</tr>
						) : (
							pageRows.map((row, index) => (
								<tr key={index}>
									{columns.map((column) => (
										<td key={column.field} style={{ textAlign: column.align }}>
											{String(row[column.field] ?? "")}
										</td>
									))}
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
			{pageSize && pageCount > 1 ? (
				<div className="data-table-pager">
					<button type="button" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>
						Previous
					</button>
					<span>
						Page {currentPage + 1} of {pageCount}
					</span>
					<button type="button" disabled={currentPage >= pageCount - 1} onClick={() => setPage(currentPage + 1)}>
						Next
					</button>
				</div>
			) : null}
		</div>
	);
}
