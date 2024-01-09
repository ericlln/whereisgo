import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport';
import { TripDetailsMessage, TripDetailsRequest } from '../proto/locator';
import { TripDetailsClient } from '../proto/locator.client';
import { useState, useEffect } from 'react';
import BusCardLabel from './BusCardLabel';

const EnvoyUrl = 'http://localhost:8080';

interface Props {
	tripId: number;
}

const getTripDetails = async (tripId: number) => {
	let transport = new GrpcWebFetchTransport({
		baseUrl: EnvoyUrl,
	});

	let client = new TripDetailsClient(transport);

	const request: TripDetailsRequest = {
		tripId: tripId,
	};

	let response = await client.tripDetails(request);
	return response.response;
};

const getMinutes = (seconds: number | undefined): string => {
	var mins = seconds ? parseFloat((seconds / 60).toFixed(1)) : 0;
	if (mins == 0) {
		return 'None';
	}

	return mins > 0 ? `Behind by ${mins} minutes` : `Ahead by ${Math.abs(mins)} minutes`;
};

// Revisit
const getBusType = (type: number | undefined) => {
	if (type == undefined) {
		return 'Unknown';
	}

	switch (type) {
		case 0:
			return 'Coach';
		case 1:
			return 'Double-Decker';
	}
};

export default function BusCard(props: Props) {
	const [tripDetails, setTripDetails] = useState<TripDetailsMessage>();
	const [loading, setLoading] = useState(true);
	const [found, setFound] = useState(false);

	async function fetchData(tripId: number) {
		try {
			const resp = await getTripDetails(tripId);
			if (resp == null) {
				return;
			}
			setFound(true);
			setTripDetails(resp);
		} catch (error) {
			console.log(error);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		fetchData(props.tripId);
	}, [props.tripId]);

	return (
		<div className="w-60">
			{found ? (
				<>
					<div className="inline-flex font-semibold text-lg text-center mb-2 gap-2 justify-between">
						<h1 className="text-[#1f6627]">Route {tripDetails?.routeNumber}</h1>
						<h1 className="text-[#49516F]">
							({tripDetails?.startTime} ~ {tripDetails?.endTime})
						</h1>
					</div>

					<div className="flex flex-col">
						<BusCardLabel header="Bus Type">{getBusType(tripDetails?.busType)}</BusCardLabel>
						<BusCardLabel header="Previous Stop">{tripDetails?.stops?.prevStop}</BusCardLabel>
						<BusCardLabel header="First Stop">{tripDetails?.stops?.firstStop}</BusCardLabel>
						<BusCardLabel header="Final Stop">{tripDetails?.stops?.lastStop}</BusCardLabel>
						<BusCardLabel header="Delay">{getMinutes(tripDetails?.delayInSeconds)}</BusCardLabel>
					</div>
				</>
			) : (
				<div className="h-max-h flex items-center justify-center">
					{loading ? 'Loading...' : 'Trip Not Found :('}
				</div>
			)}
		</div>
	);
}
