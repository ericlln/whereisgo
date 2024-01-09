interface Props {
	children: React.ReactNode;
	header?: string;
}

export default function BusCardLabel(props: Props) {
	return (
		<>
			{props.header && <h1 className="text-[#49516F] text-md font-semibold">{props.header}</h1>}
			<span className="text-xs text-[#49516F] mb-2">{props.children}</span>
		</>
	);
}
