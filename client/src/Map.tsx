import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L, { LatLngBounds } from 'leaflet';
import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport';
import { LocatorClient } from './proto/locator.client';
import { LocateMessage, LocateRequest } from './proto/locator';
import bus from './icons/bus.svg';
import 'leaflet-rotatedmarker';
import 'leaflet/dist/leaflet.css';
import BusCard from './components/BusCard';

const envoyURL = 'http://localhost:8080';

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

	const getLocations = async () => {
		let transport = new GrpcWebFetchTransport({
			baseUrl: envoyURL,
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
		} catch (error) {
			console.log(error);
		}
	}

	useEffect(() => {
		fetchData();
	}, [l, b, centerLat, centerLng]);

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
			<div className="flex bg-[#9EBC9F] h-[calc(100% - 60px)]">
				<MapContainer
					center={[43.7186797, -80.5690764]}
					zoom={10}
					style={{ height: 'calc(100vh - 60px)', width: '100%' }}
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
			</div>
		</>
	);
}
