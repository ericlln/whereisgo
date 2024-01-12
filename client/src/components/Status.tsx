interface Props {
	onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
	path: string;
	viewport?: string;
	title: string;
	value?: string;
}

export default function Status(props: Props) {
	return (
		<div className="flex bg-[#49516F] rounded-md pr-2 py-0.5">
			{props.onClick ? (
				<button className="bg-emerald-400 rounded-md mr-2 ml-0.5" onClick={props.onClick}>
					<svg
						aria-hidden="true"
						className="h-8 w-8 text-[#2E382E]"
						fill="currentColor"
						xmlns="http://www.w3.org/2000/svg"
						viewBox={props.viewport ? props.viewport : '0 -960 960 960'}
					>
						<path d={props.path} />
					</svg>
				</button>
			) : (
				<span className="bg-white rounded-lg mr-2 ml-0.5">
					<svg
						aria-hidden="true"
						className="h-8 w-8 text-[#2E382E]"
						fill="currentColor"
						xmlns="http://www.w3.org/2000/svg"
						viewBox={props.viewport ? props.viewport : '0 -960 960 960'}
					>
						<path d={props.path} />
					</svg>
				</span>
			)}
			<span className="text-xs sm:text-lg text-gray-300">
				{props.value ? props.title + props.value : props.title}
			</span>
		</div>
	);
}
