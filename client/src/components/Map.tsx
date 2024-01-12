import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L, { LatLngBounds } from 'leaflet';
import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport';
import { LocatorClient } from '../proto/locator.client';
import { LocateMessage, LocateRequest } from '../proto/locator';
import BusCard from './BusCard';
import StatusBar from './StatusBar';
import 'leaflet-rotatedmarker';
import 'leaflet/dist/leaflet.css';
import bus from '../icons/bus.svg';

const EnvoyUrl = 'http://localhost:8080';

// Bus svg faces right (90 bearing)
const icon = new L.Icon({
	iconUrl: bus,
	iconRetinaUrl: bus,
	iconSize: new L.Point(45, 15),
});

export default function Map() {
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
			console.error('Called getLocations without providing map bounding box');
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
					center={[43.6690299, -79.6000671]}
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
				<StatusBar lastUpdated={lastUpdated} fetchData={fetchData} />
			</div>
		</>
	);
}
