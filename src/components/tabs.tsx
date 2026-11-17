"use client";

import { Children, isValidElement, useState } from "react";

export function Tab({ children }: { title: string; children: React.ReactNode }) {
	return <>{children}</>;
}

export function Tabs({ children, group }: { children: React.ReactNode; group?: string }) {
	const tabs = Children.toArray(children).filter(isValidElement) as Array<React.ReactElement<{ title?: string }>>;
	const [active, setActive] = useState(0);

	if (!tabs.length) return null;

	return (
		<div className="tabs" data-group={group}>
			<div className="tab-list" role="tablist">
				{tabs.map((tab, index) => (
					<button
						type="button"
						role="tab"
						aria-selected={active === index}
						className={active === index ? "active" : ""}
						key={`${group ?? "tab"}-${index}`}
						onClick={() => setActive(index)}
					>
						{tab.props.title ?? `Tab ${index + 1}`}
					</button>
				))}
			</div>
			<div className="tab-panel" role="tabpanel">
				{tabs[active]}
			</div>
		</div>
	);
}
