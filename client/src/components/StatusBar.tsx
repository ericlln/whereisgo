import { useState, useEffect } from 'react';
import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport';
import { HealthCheckClient } from '../proto/locator.client';
import { Empty, HealthCheckMessage } from '../proto/locator';
import Status from './Status';

const EnvoyUrl = 'http://localhost:8080';

interface Props {
	lastUpdated?: Date;
	fetchData: () => void;
}

const formatSeconds = (time: number | undefined): string => {
	if (time == null) return 'Undefined Time';

	return time < 60 ? `${time.toFixed(1)} seconds` : `${(time / 60).toFixed(1)} minutes`;
};

export default function StatusBar(props: Props) {
	const [health, setHealth] = useState<HealthCheckMessage>();

	const getHealth = async () => {
		let transport = new GrpcWebFetchTransport({
			baseUrl: EnvoyUrl,
		});

		let client = new HealthCheckClient(transport);

		const request: Empty = {};

		let response = await client.healthCheck(request);
		return response.response;
	};

	async function fetchData() {
		try {
			const resp = await getHealth();
			if (resp == null) {
				return;
			}
			setHealth(resp);
		} catch (error) {
			console.log(error);
		}
	}

	useEffect(() => {
		fetchData();
	}, []);

	return (
		<div className="h-{36} px-6 py-[10px] border-t-2 border-[#49516F] flex justify-between gap-4 sm:gap-0">
			<div className="flex flex-col sm:flex-row gap-4">
				<Status
					title="Stations: "
					value={health?.stopCount.toString()}
					path="M240-120v-680h390q14 0 26 6.5t20 17.5l124 176-124 176q-8 11-20 17.5t-26 6.5H320v280h-80Zm80-360h300l80-120-80-120H320v240Zm0 0v-240 240Z"
				/>

				<Status
					title="Ongoing Trips: "
					value={health?.trips.toString()}
					path="M400-186v-228l56-160q5-11 14.5-18.5T494-600h292q14 0 24 7.5t14 18.5l56 160v228q0 11-7.5 18.5T854-160h-28q-11 0-18.5-7.5T800-186v-34H480v34q0 11-7.5 18.5T454-160h-28q-11 0-18.5-7.5T400-186Zm80-274h320l-28-80H508l-28 80Zm-20 60v120-120Zm60 100q17 0 28.5-11.5T560-340q0-17-11.5-28.5T520-380q-17 0-28.5 11.5T480-340q0 17 11.5 28.5T520-300Zm240 0q17 0 28.5-11.5T800-340q0-17-11.5-28.5T760-380q-17 0-28.5 11.5T720-340q0 17 11.5 28.5T760-300ZM160-160v-40l40-40q-50 0-85-35t-35-85v-320q0-66 59-93t201-27q148 0 204 26t56 94v40h-80v-40H160v240h200v280H160Zm40-160q17 0 28.5-11.5T240-360q0-17-11.5-28.5T200-400q-17 0-28.5 11.5T160-360q0 17 11.5 28.5T200-320Zm260 40h360v-120H460v120Z"
				/>

				<Status
					title="Average Delay (last hour): "
					value={formatSeconds(health?.averageDelay)}
					path="m786-624 30-30-76-74v-112h-40v128l86 88ZM260-280q25 0 42.5-17.5T320-340q0-25-17.5-42.5T260-400q-25 0-42.5 17.5T200-340q0 25 17.5 42.5T260-280Zm280 0q25 0 42.5-17.5T600-340q0-25-17.5-42.5T540-400q-25 0-42.5 17.5T480-340q0 25 17.5 42.5T540-280ZM160-80q-17 0-28.5-11.5T120-120v-82q-18-20-29-44.5T80-300v-380q0-30 11.5-60.5t51-54.5Q182-819 259-831.5t207-6.5q-8 19-13.5 38.5T444-760q-112-3-177 8t-89 32h262q0 20 3 40t9 40H160v120h364q38 38 88.5 59T720-440v140q0 29-11 53.5T680-202v82q0 17-11.5 28.5T640-80h-40q-17 0-28.5-11.5T560-120v-40H240v40q0 17-11.5 28.5T200-80h-40Zm400-360H160h480-80Zm160-80q-83 0-141.5-58.5T520-720q0-83 58.5-141.5T720-920q83 0 141.5 58.5T920-720q0 83-58.5 141.5T720-520ZM240-240h320q33 0 56.5-23.5T640-320v-120H160v120q0 33 23.5 56.5T240-240Zm200-480H178h262Z"
				/>
			</div>
			<div className="flex sm:flex-row gap-6">
				<Status
					title="GO Transit Website"
					path="M440-280H280q-83 0-141.5-58.5T80-480q0-83 58.5-141.5T280-680h160v80H280q-50 0-85 35t-35 85q0 50 35 85t85 35h160v80ZM320-440v-80h320v80H320Zm200 160v-80h160q50 0 85-35t35-85q0-50-35-85t-85-35H520v-80h160q83 0 141.5 58.5T880-480q0 83-58.5 141.5T680-280H520Z"
					onClick={() => {
						let path = 'https://www.gotransit.com/en';
						window.location.href = path;
					}}
				/>

				<Status
					title="Last Updated: "
					value={
						props.lastUpdated
							? props.lastUpdated.toLocaleTimeString([], {
									hour: '2-digit',
									minute: '2-digit',
									second: '2-digit',
							  })
							: 'Not available'
					}
					onClick={() => {
						props.fetchData();
					}}
					viewport="0 -960 960 960"
					path="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z"
				/>
			</div>
		</div>
	);
}
