import { Link } from 'react-router-dom';

const Nav = () => {
	return (
		<nav className="sticky top-0 z-100 bg-[#9EBC9F] border-b-2 border-[#49516F]">
			<div className="flex h-{36} justify-between px-4 py-[10px]">
				{/* 36 + 10 * 2 = 56 navbar height*/}
				<div>
					<Link to="https://google.com">
						<button className="flex justify-left gap-1 group">
							<svg
								aria-hidden="true"
								className="h-9 w-9 text-[#2E382E] duration-200 ease-in"
								fill="currentColor"
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 -960 960 960"
							>
								<path d="M240-120q-17 0-28.5-11.5T200-160v-82q-18-20-29-44.5T160-340v-380q0-83 77-121.5T480-880q172 0 246 37t74 123v380q0 29-11 53.5T760-242v82q0 17-11.5 28.5T720-120h-40q-17 0-28.5-11.5T640-160v-40H320v40q0 17-11.5 28.5T280-120h-40Zm242-640h224-448 224Zm158 280H240h480-80Zm-400-80h480v-120H240v120Zm100 240q25 0 42.5-17.5T400-380q0-25-17.5-42.5T340-440q-25 0-42.5 17.5T280-380q0 25 17.5 42.5T340-320Zm280 0q25 0 42.5-17.5T680-380q0-25-17.5-42.5T620-440q-25 0-42.5 17.5T560-380q0 25 17.5 42.5T620-320ZM258-760h448q-15-17-64.5-28.5T482-800q-107 0-156.5 12.5T258-760Zm62 480h320q33 0 56.5-23.5T720-360v-120H240v120q0 33 23.5 56.5T320-280Z" />
							</svg>
							<h1 className="text-2xl text-[#2E382E] group-hover:underline underline-offset-4 group-hover:text-[#49516F] duration-200 ease-in font-semibold">
								whereisgo
							</h1>
						</button>
					</Link>
				</div>
				<div>
					<button
						onClick={() => {}}
						className="text-2xl text-[#2E382E] font-semibold pr-4 hover:underline"
					>
						about
					</button>
				</div>
			</div>
		</nav>
	);
};

export default Nav;
