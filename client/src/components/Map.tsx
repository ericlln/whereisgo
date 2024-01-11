import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L, { LatLngBounds } from 'leaflet';
import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport';
import { LocatorClient } from '../proto/locator.client';
import { LocateMessage, LocateRequest } from '../proto/locator';
import bus from '../icons/bus.svg';
import 'leaflet-rotatedmarker';
import 'leaflet/dist/leaflet.css';
import BusCard from './BusCard';
import Status from './Status';

const EnvoyUrl = 'http://localhost:8080';

// Bus svg faces right (90 bearing)
const icon = new L.Icon({
	iconUrl: bus,
	iconRetinaUrl: bus,
	iconSize: new L.Point(45, 15),
});

export default function Map() {
	let navigate = useNavigate();

	const [l, setL] = useState(0); // left edge of map
	const [b, setB] = useState(0); // bottom edge of map
	const [centerLat, setCenterLat] = useState(0); // center of map
	const [centerLng, setCenterLng] = useState(0); //

	const [locates, setLocates] = useState<LocateMessage>();
	const [lastUpdated, setLastUpdated] = useState<Date>();

	const getLocations = async () => {
		let transport = new GrpcWebFetchTransport({
			baseUrl: EnvoyUrl,
		});

		let client = new LocatorClient(transport);

		if (l == 0 || b == 0 || centerLat == 0 || centerLng == 0) {
			return;
		}

		const request: LocateRequest = {
			l: l,
			b: b,
			cLat: centerLat,
			cLng: centerLng,
		};

		let response = await client.locate(request);
		return response.response;
	};

	async function fetchData() {
		try {
			const resp = await getLocations();
			if (resp == null) {
				return;
			}
			setLocates(resp);
			setLastUpdated(new Date(Date.now()));
		} catch (error) {
			console.log(error);
		}
	}

	useEffect(() => {
		fetchData();
	}, [l]);

	const updateBounds = (bounds: LatLngBounds) => {
		setL(bounds.getWest());
		setB(bounds.getSouth());
		setCenterLat(bounds.getCenter().lat);
		setCenterLng(bounds.getCenter().lng);
	};

	// LocationMarker updates the bounds of the client map
	function LocationMarker() {
		const map = useMap();
		useEffect(() => {
			if (!map) return;
			updateBounds(map.getBounds());

			map.on('zoomend', function () {
				updateBounds(map.getBounds());
			});

			map.on('moveend', function () {
				updateBounds(map.getBounds());
			});
		}, [map]);
		return <></>;
	}

	return (
		<>
			<div className="flex flex-col bg-[#9EBC9F] h-[calc(100% - 116px)]">
				<MapContainer
					center={[43.7186797, -80.5690764]}
					zoom={10}
					style={{ height: 'calc(100vh - 116px)', width: '100%' }}
				>
					<TileLayer
						attribution='<a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
						url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
					/>
					{locates &&
						locates.locates.map((locate) => (
							<Marker
								key={locate.tripId}
								position={[locate.lat, locate.lng]}
								icon={icon}
								rotationAngle={locate.course - 90} // Bus svg faces right (90 bearing)
							>
								<Popup>
									<BusCard tripId={locate.tripId} />
								</Popup>
							</Marker>
						))}
					<LocationMarker />
				</MapContainer>
				<div className="h-{36} px-6 py-[10px] border-t-2 border-[#49516F] flex justify-between">
					<div className="flex gap-4">
						<Status
							title="Stations: "
							value="100" // placeholder
							path="M240-120v-680h390q14 0 26 6.5t20 17.5l124 176-124 176q-8 11-20 17.5t-26 6.5H320v280h-80Zm80-360h300l80-120-80-120H320v240Zm0 0v-240 240Z"
						/>

						<Status
							title="Ongoing Trips: "
							value="100" // placeholder
							path="M400-186v-228l56-160q5-11 14.5-18.5T494-600h292q14 0 24 7.5t14 18.5l56 160v228q0 11-7.5 18.5T854-160h-28q-11 0-18.5-7.5T800-186v-34H480v34q0 11-7.5 18.5T454-160h-28q-11 0-18.5-7.5T400-186Zm80-274h320l-28-80H508l-28 80Zm-20 60v120-120Zm60 100q17 0 28.5-11.5T560-340q0-17-11.5-28.5T520-380q-17 0-28.5 11.5T480-340q0 17 11.5 28.5T520-300Zm240 0q17 0 28.5-11.5T800-340q0-17-11.5-28.5T760-380q-17 0-28.5 11.5T720-340q0 17 11.5 28.5T760-300ZM160-160v-40l40-40q-50 0-85-35t-35-85v-320q0-66 59-93t201-27q148 0 204 26t56 94v40h-80v-40H160v240h200v280H160Zm40-160q17 0 28.5-11.5T240-360q0-17-11.5-28.5T200-400q-17 0-28.5 11.5T160-360q0 17 11.5 28.5T200-320Zm260 40h360v-120H460v120Z"
						/>

						<Status
							title="Unique Routes: "
							value="100" // placeholder
							path="M360-120q-66 0-113-47t-47-113v-327q-35-13-57.5-43.5T120-720q0-50 35-85t85-35q50 0 85 35t35 85q0 39-22.5 69.5T280-607v327q0 33 23.5 56.5T360-200q33 0 56.5-23.5T440-280v-400q0-66 47-113t113-47q66 0 113 47t47 113v327q35 13 57.5 43.5T840-240q0 50-35 85t-85 35q-50 0-85-35t-35-85q0-39 22.5-70t57.5-43v-327q0-33-23.5-56.5T600-760q-33 0-56.5 23.5T520-680v400q0 66-47 113t-113 47ZM240-680q17 0 28.5-11.5T280-720q0-17-11.5-28.5T240-760q-17 0-28.5 11.5T200-720q0 17 11.5 28.5T240-680Zm480 480q17 0 28.5-11.5T760-240q0-17-11.5-28.5T720-280q-17 0-28.5 11.5T680-240q0 17 11.5 28.5T720-200ZM240-720Zm480 480Z"
						/>
					</div>
					<div className="flex gap-6">
						<Status
							title="GO Transit Website"
							path="M440-280H280q-83 0-141.5-58.5T80-480q0-83 58.5-141.5T280-680h160v80H280q-50 0-85 35t-35 85q0 50 35 85t85 35h160v80ZM320-440v-80h320v80H320Zm200 160v-80h160q50 0 85-35t35-85q0-50-35-85t-85-35H520v-80h160q83 0 141.5 58.5T880-480q0 83-58.5 141.5T680-280H520Z"
							onClick={() => {
								let path = 'https://www.gotransit.com/en';
								navigate(path);
							}}
						/>

						<Status
							title="Last Updated: "
							value={
								lastUpdated
									? lastUpdated.toLocaleTimeString([], {
											hour: '2-digit',
											minute: '2-digit',
											second: '2-digit',
									  })
									: 'Not available'
							}
							onClick={() => {
								fetchData();
							}}
							viewport="0 -960 960 960"
							path="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z"
						/>
					</div>
				</div>
			</div>
		</>
	);
}
